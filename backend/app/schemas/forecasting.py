from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


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


class ForecastPoint(BaseModel):
    date: date
    type: Literal["historical", "forecast"]
    revenue: float
