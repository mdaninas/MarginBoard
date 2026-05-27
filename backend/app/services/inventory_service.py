"""Inventory risk estimation with simulated stock. See ADR-0002 for the rationale."""

from __future__ import annotations

import hashlib
import logging
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from threading import Lock

import joblib
import pandas as pd

from app.schemas.inventory import InventoryProduct, InventorySummary
from app.services.data_service import load_transactions
from ml.artifacts import INVENTORY_ARTIFACT

logger = logging.getLogger(__name__)

DEMAND_WINDOW_DAYS = 90  # XXX: hardcoded; could be per-category once we know more
HORIZON_DAYS = 30
SAFETY_MULTIPLIER = 1.65
SIMULATED_STOCK_NOTE = (
    "Simulated stock — the Online Retail II dataset does not include real "
    "inventory. Coverage ratios are deterministic per stock code."
)


@dataclass
class InventoryArtifacts:
    products: list[InventoryProduct]
    summary: InventorySummary
    trained_at: str | None = None


_lock = Lock()
_cached: InventoryArtifacts | None = None


def _coverage_ratio(stock_code: str) -> float:
    """Deterministic 0.3–2.0 coverage ratio derived from the stock code."""
    digest = hashlib.sha256(stock_code.encode("utf-8")).digest()
    bucket = digest[0] / 255.0
    return 0.3 + bucket * 1.7


def _classify(stock_gap: float, estimated_demand: float) -> str:
    if stock_gap <= 0:
        return "Low"
    if stock_gap <= estimated_demand * 0.3:
        return "Medium"
    return "High"


def build_artifacts(df: pd.DataFrame | None = None) -> InventoryArtifacts:
    """Compute inventory risk products + summary. Public entry for training."""
    if df is None:
        df = load_transactions()
    return _compute(df)


def _compute(df: pd.DataFrame) -> InventoryArtifacts:
    if df.empty:
        return InventoryArtifacts(
            products=[],
            summary=InventorySummary(
                products_at_risk=0,
                high_risk_products=0,
                medium_risk_products=0,
                low_risk_products=0,
                estimated_lost_revenue=0.0,
                recommended_reorder_units=0,
                horizon_days=HORIZON_DAYS,
                note=SIMULATED_STOCK_NOTE,
            ),
            trained_at=datetime.now(UTC).isoformat(timespec="seconds"),
        )

    # Only positive-quantity rows represent outbound demand.
    sales = df[df["quantity"] > 0].copy()
    if sales.empty:
        return InventoryArtifacts(products=[], summary=_empty_summary())

    max_date = sales["invoice_date"].max().normalize()
    window_start = max_date - timedelta(days=DEMAND_WINDOW_DAYS - 1)
    recent = sales[sales["invoice_date"] >= window_start]
    if recent.empty:
        return InventoryArtifacts(products=[], summary=_empty_summary())

    # Build a (stock_code × day) matrix so zero-sale days count in the
    # demand statistics. The previous version grouped only on days that had
    # sales, which made `mean` over-estimate slow movers — a SKU with one
    # 10-unit sale across 90 days came out as mean_daily_units = 10
    # (i.e. estimated_demand = 300 for the next 30 days). Now mean is the
    # true daily average over the window.
    recent = recent.assign(_day=recent["invoice_date"].dt.normalize())
    daily_pivot = (
        recent.pivot_table(
            index="stock_code",
            columns="_day",
            values="quantity",
            aggfunc="sum",
            fill_value=0,
        )
        .reindex(
            columns=pd.date_range(window_start, max_date, freq="D"),
            fill_value=0,
        )
    )
    stats = pd.DataFrame({
        "mean_daily_units": daily_pivot.mean(axis=1),
        "std_daily_units": daily_pivot.std(axis=1).fillna(0.0),
    })

    # Use the most frequent description per stock_code to avoid noisy
    # one-off return descriptions overwriting the canonical product name.
    descriptions = (
        sales.groupby("stock_code")["description"]
        .agg(lambda s: s.mode().iat[0] if not s.mode().empty else s.iloc[0])
        .rename("description")
    )
    avg_price = (
        sales.groupby("stock_code")["unit_price"].mean().rename("average_unit_price")
    )
    meta = pd.concat([descriptions, avg_price], axis=1)

    merged = stats.join(meta, how="inner").reset_index()
    # Restrict to SKUs with at least one sale in the window to avoid noise.
    merged = merged[merged["mean_daily_units"] > 0]

    products: list[InventoryProduct] = []
    for _, row in merged.iterrows():
        stock_code = str(row["stock_code"])
        estimated_demand = float(row["mean_daily_units"]) * HORIZON_DAYS
        safety_stock = float(row["std_daily_units"]) * SAFETY_MULTIPLIER
        simulated_stock = estimated_demand * _coverage_ratio(stock_code)
        stock_gap = estimated_demand + safety_stock - simulated_stock
        recommended_reorder = max(0.0, stock_gap)
        avg_price = float(row["average_unit_price"])
        potential_lost_revenue = max(0.0, estimated_demand - simulated_stock) * avg_price
        risk = _classify(stock_gap, estimated_demand)

        products.append(
            InventoryProduct(
                stock_code=stock_code,
                description=str(row["description"]),
                estimated_demand=int(round(estimated_demand)),
                simulated_stock=int(round(simulated_stock)),
                safety_stock=int(round(safety_stock)),
                recommended_reorder=int(round(recommended_reorder)),
                potential_lost_revenue=round(potential_lost_revenue, 2),
                risk_level=risk,  # type: ignore[arg-type]
                average_unit_price=round(avg_price, 2),
            )
        )

    products.sort(key=lambda p: p.potential_lost_revenue, reverse=True)

    high = sum(1 for p in products if p.risk_level == "High")
    medium = sum(1 for p in products if p.risk_level == "Medium")
    low = sum(1 for p in products if p.risk_level == "Low")
    total_at_risk = high + medium
    total_lost_revenue = round(sum(p.potential_lost_revenue for p in products), 2)
    total_reorder = int(sum(p.recommended_reorder for p in products))

    summary = InventorySummary(
        products_at_risk=total_at_risk,
        high_risk_products=high,
        medium_risk_products=medium,
        low_risk_products=low,
        estimated_lost_revenue=total_lost_revenue,
        recommended_reorder_units=total_reorder,
        horizon_days=HORIZON_DAYS,
        note=SIMULATED_STOCK_NOTE,
    )

    return InventoryArtifacts(
        products=products,
        summary=summary,
        trained_at=datetime.now(UTC).isoformat(timespec="seconds"),
    )


def _empty_summary() -> InventorySummary:
    return InventorySummary(
        products_at_risk=0,
        high_risk_products=0,
        medium_risk_products=0,
        low_risk_products=0,
        estimated_lost_revenue=0.0,
        recommended_reorder_units=0,
        horizon_days=HORIZON_DAYS,
        note=SIMULATED_STOCK_NOTE,
    )


def _try_load_artifact() -> InventoryArtifacts | None:
    if not INVENTORY_ARTIFACT.exists():
        return None
    try:
        bundle = joblib.load(INVENTORY_ARTIFACT)
        logger.info(
            "Loaded inventory artifact from %s (computed %s)",
            INVENTORY_ARTIFACT, bundle.trained_at,
        )
        return bundle
    except Exception as exc:
        logger.warning("Could not load inventory artifact: %s", exc)
        return None


def _get_or_compute() -> InventoryArtifacts:
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
            logger.info("No inventory artifact found — computing on demand.")
            _cached = build_artifacts()
        return _cached


def get_inventory_summary() -> InventorySummary:
    return _get_or_compute().summary


def get_inventory_products(
    risk: str | None = None, limit: int = 100
) -> list[InventoryProduct]:
    artifacts = _get_or_compute()
    products = artifacts.products
    if risk:
        products = [p for p in products if p.risk_level.lower() == risk.lower()]
    return products[:limit]


def reset_cache() -> None:
    global _cached
    with _lock:
        _cached = None
