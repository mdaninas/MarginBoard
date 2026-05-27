from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas.analytics import (
    ABCClassificationRow,
    ABCSummary,
    CohortRetentionRow,
    CustomerSegment,
    SegmentSummary,
)
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/cohort-retention", response_model=list[CohortRetentionRow])
def cohort_retention() -> list[CohortRetentionRow]:
    return analytics_service.get_cohort_retention()


@router.get("/abc-classification", response_model=list[ABCClassificationRow])
def abc_classification(
    limit: int = Query(default=100, ge=1, le=500),
) -> list[ABCClassificationRow]:
    return analytics_service.get_abc_classification(limit=limit)


@router.get("/abc-summary", response_model=ABCSummary)
def abc_summary() -> ABCSummary:
    return analytics_service.get_abc_summary()


@router.get("/customer-segments", response_model=list[CustomerSegment])
def customer_segments(
    limit: int = Query(default=500, ge=1, le=2000),
) -> list[CustomerSegment]:
    return analytics_service.get_customer_segments(limit=limit)


@router.get("/segment-summary", response_model=list[SegmentSummary])
def segment_summary() -> list[SegmentSummary]:
    return analytics_service.get_segment_summary()
