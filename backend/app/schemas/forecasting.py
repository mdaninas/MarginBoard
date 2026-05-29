from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class FeatureImportance(BaseModel):
    name: str
    importance: float


class ForecastSummary(BaseModel):
    model: str
    forecast_horizon_days: int
    forecasted_revenue: float
    previous_30_day_revenue: float
    expected_growth_pct: float | None
    mae: float = Field(description="Mean absolute error — mean across CV folds.")
    mae_std: float = Field(default=0.0, description="Std of MAE across CV folds.")
    mape: float = Field(description="Mean absolute percent error — mean across CV folds.")
    mape_std: float = Field(default=0.0, description="Std of MAPE across CV folds.")
    cv_folds: int = Field(default=1, description="Number of TimeSeriesSplit folds used for validation.")
    training_period_start: date
    training_period_end: date
    validation_period_start: date
    validation_period_end: date
    features: list[str]
    feature_importances: list[FeatureImportance] = Field(
        default_factory=list,
        description="Per-feature importance from the final fitted model, sorted descending.",
    )
    dataset_last_date: date | None = Field(
        default=None,
        description="Last invoice date in the dataset. Useful client-side to label the previous-30-day window correctly.",
    )


class ForecastPoint(BaseModel):
    date: date
    type: Literal["historical", "forecast"]
    revenue: float
