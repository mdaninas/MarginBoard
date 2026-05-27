from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

ABCClass = Literal["A", "B", "C"]
RFMSegment = Literal[
    "Champions",
    "Loyal",
    "Potential Loyalist",
    "At Risk",
    "Hibernating",
    "Lost",
    "New",
    "Others",
]


class CohortRetentionRow(BaseModel):
    cohort_month: str
    cohort_size: int
    # Retention rates by months-since-first-purchase. Keys are "0", "1", "2", ...
    retention: dict[str, float]


class ABCClassificationRow(BaseModel):
    stock_code: str
    description: str
    revenue: float
    cumulative_share_pct: float
    abc_class: ABCClass


class ABCSummary(BaseModel):
    a_count: int
    b_count: int
    c_count: int
    a_revenue_share_pct: float
    b_revenue_share_pct: float
    c_revenue_share_pct: float


class CustomerSegment(BaseModel):
    customer_id: int
    recency_days: int
    frequency: int
    monetary: float
    r_score: int
    f_score: int
    m_score: int
    segment: RFMSegment


class SegmentSummary(BaseModel):
    segment: RFMSegment
    customer_count: int
    revenue_share_pct: float
