"""30-day revenue forecasting via Gradient Boosting on lag/calendar features.

Pipeline
--------
1. Aggregate transactions into a continuous daily revenue series (reindexed
   so missing days become zero — important for lag features).
2. Build calendar features (day-of-week, month, week-of-year, is_weekend) and
   lag/rolling features (lag 1, lag 7, rolling 7, 14, 30).
3. Validate with TimeSeriesSplit (5 folds) to report mean ± std for MAE / MAPE.
4. Refit on the full series and iteratively generate the next 30 days,
   using each freshly predicted value to fill the lag features of the
   next step.

The pipeline is split into pure functions so `ml.train_forecast` can run it
offline and persist an artifact; the runtime service loads that artifact at
first request and falls back to on-demand training when missing.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import UTC, datetime
from threading import Lock
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import TimeSeriesSplit

from app.schemas.forecasting import FeatureImportance, ForecastPoint, ForecastSummary
from app.services.data_service import load_transactions
from ml.artifacts import FORECAST_ARTIFACT

logger = logging.getLogger(__name__)

FORECAST_HORIZON_DAYS = 30
MODEL_NAME = "GradientBoostingRegressor"
FEATURE_NAMES = [
    "day_of_week",
    "month",
    "week_of_year",
    "is_weekend",
    "lag_1",
    "lag_7",
    "rolling_7",
    "rolling_14",
    "rolling_30",
]
CV_FOLDS = 5
MODEL_PARAMS: dict[str, Any] = {
    "n_estimators": 300,
    "learning_rate": 0.05,
    "max_depth": 3,
    "random_state": 42,
}


@dataclass
class ForecastArtifacts:
    summary: ForecastSummary
    timeseries: list[ForecastPoint]
    model: GradientBoostingRegressor | None = None
    trained_at: str | None = None


_lock = Lock()
_cached: ForecastArtifacts | None = None


# ---------------------------------------------------------------------------
# Pure pipeline functions — also called from ml/train_forecast.py
# ---------------------------------------------------------------------------


def build_daily_revenue(df: pd.DataFrame) -> pd.Series:
    daily = (
        df.assign(_day=df["invoice_date"].dt.normalize())
        .groupby("_day")["revenue"]
        .sum()
    )
    full_index = pd.date_range(daily.index.min(), daily.index.max(), freq="D")
    return daily.reindex(full_index, fill_value=0.0).rename("revenue")


def add_features(series: pd.Series) -> pd.DataFrame:
    frame = series.to_frame()
    frame["day_of_week"] = frame.index.dayofweek
    frame["month"] = frame.index.month
    frame["week_of_year"] = frame.index.isocalendar().week.astype(int)
    frame["is_weekend"] = (frame.index.dayofweek >= 5).astype(int)
    frame["lag_1"] = frame["revenue"].shift(1)
    frame["lag_7"] = frame["revenue"].shift(7)
    frame["rolling_7"] = frame["revenue"].shift(1).rolling(7).mean()
    frame["rolling_14"] = frame["revenue"].shift(1).rolling(14).mean()
    frame["rolling_30"] = frame["revenue"].shift(1).rolling(30).mean()
    return frame.dropna()


def _mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    mask = y_true != 0
    if not mask.any():
        return 0.0
    return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)


def cross_validate(features: pd.DataFrame) -> tuple[float, float, float, float]:
    """TimeSeriesSplit CV. Returns (mae_mean, mae_std, mape_mean, mape_std)."""
    tscv = TimeSeriesSplit(n_splits=CV_FOLDS)
    maes: list[float] = []
    mapes: list[float] = []
    x_all = features[FEATURE_NAMES]
    y_all = features["revenue"]

    for fold, (train_idx, valid_idx) in enumerate(tscv.split(features), start=1):
        model = GradientBoostingRegressor(**MODEL_PARAMS)
        model.fit(x_all.iloc[train_idx], y_all.iloc[train_idx])
        preds = model.predict(x_all.iloc[valid_idx])
        actual = y_all.iloc[valid_idx].to_numpy()
        maes.append(float(mean_absolute_error(actual, preds)))
        mapes.append(_mape(actual, preds))
        logger.info(
            "Fold %s: MAE %.2f MAPE %.2f%% (train n=%s, valid n=%s)",
            fold, maes[-1], mapes[-1], len(train_idx), len(valid_idx),
        )

    return (
        float(np.mean(maes)),
        float(np.std(maes)),
        float(np.mean(mapes)),
        float(np.std(mapes)),
    )


def iterative_forecast(
    model: GradientBoostingRegressor, series: pd.Series, horizon: int
) -> tuple[list[pd.Timestamp], list[float]]:
    # FIXME: iterative inference accumulates error past ~day 14. If accuracy
    # ever becomes business-critical, switch to direct multi-step (one model
    # per horizon) or an RNN. For now, the demo horizon is short enough.
    # Flat buffer for lag lookups — avoids O(n) pd.concat per step.
    buffer = list(series.iloc[-30:].to_numpy())
    last_date = series.index[-1]
    dates: list[pd.Timestamp] = []
    values: list[float] = []

    for step in range(1, horizon + 1):
        target = last_date + pd.Timedelta(days=step)
        row = {
            "day_of_week": target.dayofweek,
            "month": target.month,
            "week_of_year": int(target.isocalendar().week),
            "is_weekend": int(target.dayofweek >= 5),
            "lag_1": buffer[-1],
            "lag_7": buffer[-7],
            "rolling_7": float(np.mean(buffer[-7:])),
            "rolling_14": float(np.mean(buffer[-14:])),
            "rolling_30": float(np.mean(buffer[-30:])),
        }
        x_step = pd.DataFrame([row], columns=FEATURE_NAMES)
        pred = max(float(model.predict(x_step)[0]), 0.0)
        dates.append(target)
        values.append(pred)
        buffer.append(pred)

    return dates, values


def build_artifacts(df: pd.DataFrame | None = None) -> ForecastArtifacts:
    """Run the full pipeline and return everything needed at serve time."""
    if df is None:
        df = load_transactions()

    series = build_daily_revenue(df)
    if len(series) < 60:
        raise ValueError(
            "Not enough historical days to forecast. Need at least 60 days."
        )

    features = add_features(series)
    mae_mean, mae_std, mape_mean, mape_std = cross_validate(features)

    final_model = GradientBoostingRegressor(**MODEL_PARAMS)
    final_model.fit(features[FEATURE_NAMES], features["revenue"])

    forecast_dates, forecast_values = iterative_forecast(
        final_model, series, FORECAST_HORIZON_DAYS
    )

    forecasted_revenue = float(sum(forecast_values))
    previous_30_actual = float(series.iloc[-FORECAST_HORIZON_DAYS:].sum())
    growth = (
        round(((forecasted_revenue - previous_30_actual) / previous_30_actual) * 100, 2)
        if previous_30_actual
        else None
    )

    # The final model is fit on ALL features (not on any single fold), so the
    # reported training_period reflects the full available range. The
    # validation_period below is the *last* fold's validation window — useful
    # as a representative sample of CV behavior, not a literal validation set
    # for the production model.
    train_start = features.index[0].date()
    train_end = features.index[-1].date()
    tscv = TimeSeriesSplit(n_splits=CV_FOLDS)
    _, valid_idx = list(tscv.split(features))[-1]
    valid_start = features.index[valid_idx[0]].date()
    valid_end = features.index[valid_idx[-1]].date()

    importances = sorted(
        (
            FeatureImportance(name=name, importance=round(float(value), 4))
            for name, value in zip(FEATURE_NAMES, final_model.feature_importances_)
        ),
        key=lambda x: x.importance,
        reverse=True,
    )

    summary = ForecastSummary(
        model=MODEL_NAME,
        forecast_horizon_days=FORECAST_HORIZON_DAYS,
        forecasted_revenue=round(forecasted_revenue, 2),
        previous_30_day_revenue=round(previous_30_actual, 2),
        expected_growth_pct=growth,
        mae=round(mae_mean, 2),
        mae_std=round(mae_std, 2),
        mape=round(mape_mean, 2),
        mape_std=round(mape_std, 2),
        cv_folds=CV_FOLDS,
        training_period_start=train_start,
        training_period_end=train_end,
        validation_period_start=valid_start,
        validation_period_end=valid_end,
        features=list(FEATURE_NAMES),
        feature_importances=importances,
        dataset_last_date=series.index[-1].date(),
    )

    timeseries: list[ForecastPoint] = []
    # Cap historical points returned to keep the payload reasonable for charts.
    for ts, value in series.iloc[-180:].items():
        timeseries.append(
            ForecastPoint(date=ts.date(), type="historical", revenue=round(float(value), 2))
        )
    for ts, value in zip(forecast_dates, forecast_values):
        timeseries.append(
            ForecastPoint(date=ts.date(), type="forecast", revenue=round(value, 2))
        )

    return ForecastArtifacts(
        summary=summary,
        timeseries=timeseries,
        model=final_model,
        trained_at=datetime.now(UTC).isoformat(timespec="seconds"),
    )


# ---------------------------------------------------------------------------
# Runtime: load artifact if present, otherwise compute on demand.
# ---------------------------------------------------------------------------


def _try_load_artifact() -> ForecastArtifacts | None:
    if not FORECAST_ARTIFACT.exists():
        return None
    try:
        bundle = joblib.load(FORECAST_ARTIFACT)
        logger.info(
            "Loaded forecast artifact from %s (trained %s)",
            FORECAST_ARTIFACT, bundle.trained_at,
        )
        return bundle
    except Exception as exc:
        logger.warning("Could not load forecast artifact: %s", exc)
        return None


def _get_or_compute() -> ForecastArtifacts:
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
            logger.info("No forecast artifact found — training on demand.")
            _cached = build_artifacts()
        return _cached


def get_forecast_summary() -> ForecastSummary:
    return _get_or_compute().summary


def get_forecast_timeseries() -> list[ForecastPoint]:
    return _get_or_compute().timeseries


def reset_cache() -> None:
    global _cached
    with _lock:
        _cached = None
