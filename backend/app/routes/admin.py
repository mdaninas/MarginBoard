"""Admin endpoints — guarded by a bearer token.

The only operation here is dropping the in-memory caches so a freshly
trained artifact can be picked up without restarting the server. Useful
during demos and after running `python -m ml.train_all` against a
running container.
"""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, Response, status

from app.config import settings
from app.services import anomaly_service, data_service, forecast_service, inventory_service

router = APIRouter(prefix="/admin", tags=["admin"])


def _check_token(authorization: str | None) -> None:
    if not settings.admin_token:
        # No token configured → admin endpoints are disabled.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin endpoints are disabled.",
        )
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token.")
    if authorization.removeprefix("Bearer ").strip() != settings.admin_token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token.")


@router.post("/refresh")
def refresh_caches(authorization: str | None = Header(default=None)) -> Response:
    """Drop in-memory caches across all services."""
    _check_token(authorization)
    data_service.reset_cache()
    forecast_service.reset_cache()
    inventory_service.reset_cache()
    anomaly_service.reset_cache()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
