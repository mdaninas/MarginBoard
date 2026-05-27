from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

RiskLevel = Literal["Low", "Medium", "High"]


class InventorySummary(BaseModel):
    products_at_risk: int
    high_risk_products: int
    medium_risk_products: int
    low_risk_products: int
    estimated_lost_revenue: float
    recommended_reorder_units: int
    horizon_days: int = Field(description="Demand horizon used for the estimate.")
    note: str = Field(
        description="Reminder that stock values are simulated, not from a real inventory system."
    )


class InventoryProduct(BaseModel):
    stock_code: str
    description: str
    estimated_demand: int
    simulated_stock: int
    safety_stock: int
    recommended_reorder: int
    potential_lost_revenue: float
    risk_level: RiskLevel
    average_unit_price: float
