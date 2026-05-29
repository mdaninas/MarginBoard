from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.schemas.overview import (
    CountryPerformance,
    OverviewMetrics,
    RevenueTrendPoint,
    TopProduct,
)
from app.services import metrics_service

router = APIRouter(prefix="/overview", tags=["overview"])


@router.get("/metrics", response_model=OverviewMetrics)
def overview_metrics(
    start: str | None = Query(default=None, description="ISO date YYYY-MM-DD."),
    end: str | None = Query(default=None, description="ISO date YYYY-MM-DD."),
    country: str | None = Query(default=None, description="Country filter (exact, case-insensitive)."),
) -> OverviewMetrics:
    try:
        return metrics_service.get_overview_metrics(start=start, end=end, country=country)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/revenue-trend", response_model=list[RevenueTrendPoint])
def revenue_trend(
    start: str | None = Query(default=None),
    end: str | None = Query(default=None),
    country: str | None = Query(default=None),
) -> list[RevenueTrendPoint]:
    try:
        return metrics_service.get_revenue_trend(start=start, end=end, country=country)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/top-products", response_model=list[TopProduct])
def top_products(
    start: str | None = Query(default=None),
    end: str | None = Query(default=None),
    country: str | None = Query(default=None),
    limit: int = Query(default=10, ge=1, le=100),
) -> list[TopProduct]:
    try:
        return metrics_service.get_top_products(
            start=start, end=end, country=country, limit=limit
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/countries", response_model=list[str])
def countries() -> list[str]:
    return metrics_service.list_countries()


@router.get("/country-performance", response_model=list[CountryPerformance])
def country_performance(
    start: str | None = Query(default=None),
    end: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
) -> list[CountryPerformance]:
    try:
        return metrics_service.get_country_performance(
            start=start, end=end, limit=limit
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
