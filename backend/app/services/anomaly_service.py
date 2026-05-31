# Hybrid scoring: rule-based reason codes + IsolationForest. See
# docs/MODEL_CARD.md for the write-up; thresholds revisited in notebook 03.

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import UTC, datetime
from threading import Lock

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

from app.schemas.transactions import TransactionAnomaly, TransactionSummary
from app.services.data_service import load_transactions
from ml.artifacts import ANOMALY_ARTIFACT

logger = logging.getLogger(__name__)

DISCLAIMER = (
    "Transaction anomaly monitoring identifies unusual transaction patterns "
    "based on historical data. It does not confirm fraud and should be treated "
    "as a review aid only."
)

HIGH_THRESHOLD = 0.85  # TODO: re-justify against labelled flags if/when available
MEDIUM_THRESHOLD = 0.60


@dataclass
class AnomalyArtifacts:
    summary: TransactionSummary
    flagged: list[TransactionAnomaly]
    thresholds: dict[str, float] = field(default_factory=dict)
    trained_at: str | None = None


_lock = Lock()
_cached: AnomalyArtifacts | None = None


def _vectorized_reason_codes(
    work: pd.DataFrame,
    qty_high: float,
    price_high: float,
    value_high: float,
) -> pd.Series:
    """Build a Series of reason-code lists without per-row Python iteration."""
    flags = pd.DataFrame(index=work.index)
    flags["Negative quantity / return"] = work["quantity"] < 0
    flags["Unusually high quantity"] = work["quantity"] > qty_high
    flags["Extreme unit price"] = work["unit_price"] > price_high
    flags["Unusually high transaction value"] = work["transaction_value"].abs() > value_high
    flags["Invoice cancellation pattern"] = work["invoice_id"].str.startswith("C", na=False)

    codes_array = flags.to_numpy(dtype=bool)
    column_names = list(flags.columns)
    return pd.Series(
        [
            [name for name, hit in zip(column_names, row) if hit]
            for row in codes_array
        ],
        index=work.index,
    )


def _classify(score: float) -> str:
    if score >= HIGH_THRESHOLD:
        return "High"
    if score >= MEDIUM_THRESHOLD:
        return "Medium"
    return "Low"


def build_artifacts(df: pd.DataFrame | None = None) -> AnomalyArtifacts:
    """Score every transaction once, return summary + top-N flagged rows."""
    if df is None:
        df = load_transactions()
    return _compute(df)


def _compute(df: pd.DataFrame) -> AnomalyArtifacts:
    if df.empty:
        return AnomalyArtifacts(
            summary=TransactionSummary(
                transactions_reviewed=0,
                flagged_transactions=0,
                high_risk_transactions=0,
                medium_risk_transactions=0,
                return_count=0,
                average_anomaly_score=0.0,
                disclaimer=DISCLAIMER,
            ),
            flagged=[],
            trained_at=datetime.now(UTC).isoformat(timespec="seconds"),
        )

    work = df.copy()
    work["transaction_value"] = work["quantity"].astype(float) * work["unit_price"].astype(float)
    work["abs_quantity"] = work["quantity"].abs()
    work["abs_value"] = work["transaction_value"].abs()

    qty_high = float(work["abs_quantity"].quantile(0.99))
    price_high = float(work["unit_price"].quantile(0.99))
    value_high = float(work["abs_value"].quantile(0.99))

    # Subsample for IsolationForest to keep training fast on large datasets.
    sample = work.sample(
        n=min(len(work), 50_000), random_state=42
    ) if len(work) > 50_000 else work

    # n_jobs=1 here because uvicorn --reload on Windows can deadlock with
    # joblib's loky backend during the autoreload warm-up. The model is
    # small enough that single-threaded fit is fine.
    iso = IsolationForest(
        n_estimators=200,
        contamination=0.02,
        random_state=42,
        n_jobs=1,
    )
    iso.fit(sample[["abs_quantity", "unit_price", "abs_value"]])

    raw_scores = -iso.score_samples(work[["abs_quantity", "unit_price", "abs_value"]])
    # Min-max normalize to [0, 1] for an interpretable anomaly score.
    s_min = float(raw_scores.min())
    s_max = float(raw_scores.max())
    span = s_max - s_min or 1.0
    norm_scores = (raw_scores - s_min) / span

    work["anomaly_score"] = norm_scores

    work["reason_codes"] = _vectorized_reason_codes(
        work, qty_high=qty_high, price_high=price_high, value_high=value_high
    )

    # Boost score for every rule that fired so explainability and ranking agree.
    rule_count = work["reason_codes"].map(len)
    boost = np.clip(rule_count.to_numpy() * 0.15, 0.0, 0.45)
    work["anomaly_score"] = np.clip(work["anomaly_score"] + boost, 0.0, 1.0)

    work["risk_level"] = np.where(
        work["anomaly_score"] >= HIGH_THRESHOLD,
        "High",
        np.where(work["anomaly_score"] >= MEDIUM_THRESHOLD, "Medium", "Low"),
    )

    transactions_reviewed = len(work)
    flagged_mask = work["risk_level"] != "Low"
    flagged_count = int(flagged_mask.sum())
    high_count = int((work["risk_level"] == "High").sum())
    medium_count = int((work["risk_level"] == "Medium").sum())
    return_count = int((work["quantity"] < 0).sum())
    avg_score = float(work["anomaly_score"].mean())

    summary = TransactionSummary(
        transactions_reviewed=transactions_reviewed,
        flagged_transactions=flagged_count,
        high_risk_transactions=high_count,
        medium_risk_transactions=medium_count,
        return_count=return_count,
        average_anomaly_score=round(avg_score, 4),
        disclaimer=DISCLAIMER,
    )

    # Keep the top-N per risk level, not just the global top-N. Otherwise, when
    # High-risk transactions dominate the highest scores, filtering by "Medium"
    # would return nothing even though many medium-risk rows exist.
    flagged_df = (
        work[flagged_mask]
        .sort_values("anomaly_score", ascending=False)
        .groupby("risk_level", group_keys=False)
        .head(500)
        .sort_values("anomaly_score", ascending=False)
    )

    flagged: list[TransactionAnomaly] = []
    for _, row in flagged_df.iterrows():
        flagged.append(
            TransactionAnomaly(
                invoice_id=str(row["invoice_id"]),
                date=row["invoice_date"].date(),
                stock_code=str(row["stock_code"]),
                description=str(row["description"]),
                country=str(row["country"]),
                quantity=int(row["quantity"]),
                unit_price=round(float(row["unit_price"]), 2),
                transaction_value=round(float(row["transaction_value"]), 2),
                risk_level=row["risk_level"],
                anomaly_score=round(float(row["anomaly_score"]), 4),
                reason_codes=list(row["reason_codes"]) or ["Multivariate outlier"],
            )
        )

    return AnomalyArtifacts(
        summary=summary,
        flagged=flagged,
        thresholds={
            "qty_high": qty_high,
            "price_high": price_high,
            "value_high": value_high,
        },
        trained_at=datetime.now(UTC).isoformat(timespec="seconds"),
    )


def _try_load_artifact() -> AnomalyArtifacts | None:
    if not ANOMALY_ARTIFACT.exists():
        return None
    try:
        bundle = joblib.load(ANOMALY_ARTIFACT)
        logger.info(
            "Loaded anomaly artifact from %s (computed %s)",
            ANOMALY_ARTIFACT, bundle.trained_at,
        )
        return bundle
    except Exception as exc:
        logger.warning("Could not load anomaly artifact: %s", exc)
        return None


def _get_or_compute() -> AnomalyArtifacts:
    # Double-checked locking: avoid holding the lock during the expensive
    # _compute() call. Only one thread does the work; later threads see
    # the populated cache on the second check.
    global _cached
    if _cached is not None:
        return _cached
    with _lock:
        if _cached is not None:
            return _cached
        loaded = _try_load_artifact()
        if loaded is not None:
            _cached = loaded
        else:
            logger.info("No anomaly artifact found — scoring on demand.")
            _cached = build_artifacts()
        return _cached


def get_summary() -> TransactionSummary:
    return _get_or_compute().summary


def get_anomalies(
    risk: str | None = None, limit: int = 100
) -> list[TransactionAnomaly]:
    artifacts = _get_or_compute()
    flagged = artifacts.flagged
    if risk:
        flagged = [a for a in flagged if a.risk_level.lower() == risk.lower()]
    return flagged[:limit]


def reset_cache() -> None:
    global _cached
    with _lock:
        _cached = None
