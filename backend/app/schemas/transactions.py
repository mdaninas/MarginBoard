from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

RiskLevel = Literal["Low", "Medium", "High"]


class TransactionSummary(BaseModel):
    transactions_reviewed: int
    flagged_transactions: int
    high_risk_transactions: int
    medium_risk_transactions: int
    return_count: int
    average_anomaly_score: float
    disclaimer: str = Field(
        description="Anomalies are not confirmed fraud — review aid only."
    )


class TransactionAnomaly(BaseModel):
    invoice_id: str
    date: date
    stock_code: str
    description: str
    country: str
    quantity: int
    unit_price: float
    transaction_value: float
    risk_level: RiskLevel
    anomaly_score: float
    reason_codes: list[str]
