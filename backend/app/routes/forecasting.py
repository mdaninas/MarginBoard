from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.forecasting import ForecastPoint, ForecastSummary
from app.services import forecast_service

router = APIRouter(prefix="/forecasting", tags=["forecasting"])


@router.get("/summary", response_model=ForecastSummary)
def forecast_summary() -> ForecastSummary:
    try:
        return forecast_service.get_forecast_summary()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/timeseries", response_model=list[ForecastPoint])
def forecast_timeseries() -> list[ForecastPoint]:
    try:
        return forecast_service.get_forecast_timeseries()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
