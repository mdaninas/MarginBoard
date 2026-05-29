from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas.basket import AssociationRule, BasketSummary
from app.services import basket_service

router = APIRouter(prefix="/basket", tags=["basket"])


@router.get("/summary", response_model=BasketSummary)
def basket_summary() -> BasketSummary:
    return basket_service.get_summary()


@router.get("/rules", response_model=list[AssociationRule])
def basket_rules(
    limit: int = Query(default=50, ge=1, le=200),
    min_confidence: float | None = Query(default=None, ge=0.0, le=1.0),
    min_lift: float | None = Query(default=None, ge=1.0),
) -> list[AssociationRule]:
    return basket_service.get_rules(
        limit=limit, min_confidence=min_confidence, min_lift=min_lift
    )
