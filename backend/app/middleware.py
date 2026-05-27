"""Request-scoped middleware.

Currently just attaches a request_id to every request and binds it to
structlog's context vars so any logger.info() inside the handler carries
the id without explicit threading.
"""

from __future__ import annotations

import time
import uuid

import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = structlog.get_logger(__name__)


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):  # type: ignore[override]
        request_id = request.headers.get("x-request-id") or uuid.uuid4().hex[:12]
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            method=request.method,
            path=request.url.path,
        )
        started = time.perf_counter()
        try:
            response: Response = await call_next(request)
        except Exception:
            logger.exception("request.failed")
            raise
        elapsed_ms = round((time.perf_counter() - started) * 1000, 1)
        logger.info("request.completed", status=response.status_code, elapsed_ms=elapsed_ms)
        response.headers["x-request-id"] = request_id
        return response
