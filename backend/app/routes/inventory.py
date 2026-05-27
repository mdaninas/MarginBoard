from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas.inventory import InventoryProduct, InventorySummary
from app.services import inventory_service

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("/summary", response_model=InventorySummary)
def inventory_summary() -> InventorySummary:
    return inventory_service.get_inventory_summary()


@router.get("/products", response_model=list[InventoryProduct])
def inventory_products(
    risk: str | None = Query(default=None, description="Filter by 'Low', 'Medium', or 'High'."),
    limit: int = Query(default=100, ge=1, le=500),
) -> list[InventoryProduct]:
    return inventory_service.get_inventory_products(risk=risk, limit=limit)
