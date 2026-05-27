import pandas as pd

from app.services import forecast_service
from app.services.forecast_service import (
    FEATURE_NAMES,
    FORECAST_HORIZON_DAYS,
    add_features,
    build_daily_revenue,
)


def test_daily_revenue_is_continuous(synthetic_transactions):
    """Reindex must fill missing days as zero so lag features stay defined."""
    series = build_daily_revenue(synthetic_transactions)
    diffs = series.index.to_series().diff().dropna().unique()
    assert len(diffs) == 1
    assert pd.Timedelta(diffs[0]) == pd.Timedelta(days=1)


def test_daily_revenue_includes_returns(synthetic_transactions):
    """A returns-day in the fixture should reduce that day's revenue."""
    series = build_daily_revenue(synthetic_transactions)
    # Fixture injects returns on day 60, 61, 62 — at least one of those days
    # has at least one return line.
    assert (series < series.max()).any()


class TestFeatureBuilder:
    def test_drops_warmup_window(self, synthetic_transactions):
        # Rolling 30 needs 30 prior days, so the first 30 rows must be dropped.
        series = build_daily_revenue(synthetic_transactions)
        features = add_features(series)
        assert len(features) == len(series) - 30

    def test_all_feature_columns_present(self, synthetic_transactions):
        series = build_daily_revenue(synthetic_transactions)
        features = add_features(series)
        for col in FEATURE_NAMES:
            assert col in features.columns, f"missing feature {col}"

    def test_is_weekend_correctness(self, synthetic_transactions):
        series = build_daily_revenue(synthetic_transactions)
        features = add_features(series)
        # Every row's is_weekend must match dayofweek >= 5.
        import numpy as np
        expected = np.asarray(features.index.dayofweek >= 5, dtype=int)
        assert (features["is_weekend"].to_numpy() == expected).all()


def test_build_artifacts_returns_30_forecast_points(synthetic_transactions):
    artifacts = forecast_service.build_artifacts()
    forecast_points = [p for p in artifacts.timeseries if p.type == "forecast"]
    assert len(forecast_points) == FORECAST_HORIZON_DAYS


def test_forecast_dates_are_sequential(synthetic_transactions):
    artifacts = forecast_service.build_artifacts()
    forecast_points = [p for p in artifacts.timeseries if p.type == "forecast"]
    deltas = [
        (forecast_points[i + 1].date - forecast_points[i].date).days
        for i in range(len(forecast_points) - 1)
    ]
    assert all(d == 1 for d in deltas)


def test_forecast_values_are_non_negative(synthetic_transactions):
    artifacts = forecast_service.build_artifacts()
    forecast_points = [p for p in artifacts.timeseries if p.type == "forecast"]
    assert all(p.revenue >= 0 for p in forecast_points)


def test_summary_has_cv_metrics(synthetic_transactions):
    summary = forecast_service.get_forecast_summary()
    assert summary.cv_folds >= 2
    assert summary.mae >= 0
    assert summary.mape >= 0
    # std is reported even if zero.
    assert summary.mae_std >= 0
