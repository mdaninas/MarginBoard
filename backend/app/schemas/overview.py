from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field


class OverviewMetrics(BaseModel):
    total_revenue: float
    total_orders: int
    average_order_value: float
    units_sold: int
    return_count: int = Field(
        description="Count of invoices containing at least one return/cancellation line."
    )
    active_customers: int
    revenue_growth_pct: float | None = Field(
        description="Percent change vs the previous period of equal length. "
        "Null when previous-period revenue is zero."
    )
    orders_growth_pct: float | None
    period_start: date
    period_end: date
    previous_period_start: date
    previous_period_end: date


class RevenueTrendPoint(BaseModel):
    date: date
    revenue: float
    orders: int
    units: int


class TopProduct(BaseModel):
    stock_code: str
    description: str
    units_sold: int
    revenue: float
    average_price: float
    order_count: int


class CountryPerformance(BaseModel):
    country: str
    revenue: float
    orders: int
    units: int
    active_customers: int
