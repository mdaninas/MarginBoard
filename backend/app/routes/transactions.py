from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas.transactions import TransactionAnomaly, TransactionSummary
from app.services import anomaly_service

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("/summary", response_model=TransactionSummary)
def transactions_summary() -> TransactionSummary:
    return anomaly_service.get_summary()


@router.get("/anomalies", response_model=list[TransactionAnomaly])
def transactions_anomalies(
    risk: str | None = Query(default=None, description="Filter by 'Low', 'Medium', or 'High'."),
    limit: int = Query(default=100, ge=1, le=500),
) -> list[TransactionAnomaly]:
    return anomaly_service.get_anomalies(risk=risk, limit=limit)
