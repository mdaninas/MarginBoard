from __future__ import annotations

from fastapi import APIRouter

from app.schemas.forecasting import ForecastPoint, ForecastSummary
from app.services import forecast_service

router = APIRouter(prefix="/forecasting", tags=["forecasting"])


@router.get("/summary", response_model=ForecastSummary)
def forecast_summary() -> ForecastSummary:
    return forecast_service.get_forecast_summary()


@router.get("/timeseries", response_model=list[ForecastPoint])
def forecast_timeseries() -> list[ForecastPoint]:
    return forecast_service.get_forecast_timeseries()
