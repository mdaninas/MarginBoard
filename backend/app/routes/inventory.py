from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.schemas.inventory import InventoryProduct, InventorySummary
from app.services import inventory_service

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("/summary", response_model=InventorySummary)
def inventory_summary() -> InventorySummary:
    try:
        return inventory_service.get_inventory_summary()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/products", response_model=list[InventoryProduct])
def inventory_products(
    risk: str | None = Query(default=None, description="Filter by 'Low', 'Medium', or 'High'."),
    limit: int = Query(default=100, ge=1, le=500),
) -> list[InventoryProduct]:
    try:
        return inventory_service.get_inventory_products(risk=risk, limit=limit)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
