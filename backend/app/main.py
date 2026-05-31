from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import joblib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import API_PREFIX, CORS_ORIGINS, PROCESSED_DATASET_FILE, settings
from app.logging_config import configure_logging, get_logger
from app.middleware import RequestContextMiddleware
from app.routes import (
    admin,
    analytics,
    basket,
    forecasting,
    inventory,
    overview,
    transactions,
)
from app.services import (
    analytics_service,
    anomaly_service,
    basket_service,
    forecast_service,
    inventory_service,
)
from ml.artifacts import (
    ANOMALY_ARTIFACT,
    FORECAST_ARTIFACT,
    INVENTORY_ARTIFACT,
    ensure_dir,
)

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Startup: optionally pre-warm caches so the first HTTP request is fast.

    Each service tolerates missing artifacts by falling back to on-demand
    computation, so this step is best-effort — if anything fails, we log
    and keep going.
    """
    if settings.prewarm_on_startup:
        logger.info("startup.prewarm.begin")
        # First: ensure heavy ML artifacts are written to disk. If they
        # already exist, the underlying build call short-circuits to load().
        # If not, this builds AND persists them so the *next* restart is fast.
        ensure_dir()
        for label, build_fn, artifact_path in (
            ("forecast", forecast_service.build_artifacts, FORECAST_ARTIFACT),
            ("inventory", inventory_service.build_artifacts, INVENTORY_ARTIFACT),
            ("anomaly", anomaly_service.build_artifacts, ANOMALY_ARTIFACT),
        ):
            if artifact_path.exists():
                continue
            try:
                logger.info("startup.artifact.building", module=label)
                artifact = build_fn()
                joblib.dump(artifact, artifact_path, compress=3)
                logger.info("startup.artifact.saved", module=label, path=str(artifact_path))
            except Exception as exc:
                logger.warning("startup.artifact.failed", module=label, error=str(exc))

        # Then: warm in-process caches for the lighter analytics views too.
        for label, loader in (
            ("forecast", forecast_service.get_forecast_summary),
            ("inventory", inventory_service.get_inventory_summary),
            ("anomaly", anomaly_service.get_summary),
            ("basket", basket_service.get_summary),
            ("abc", analytics_service.get_abc_summary),
            ("segments", analytics_service.get_segment_summary),
            ("cohort", analytics_service.get_cohort_retention),
        ):
            try:
                loader()
                logger.info("startup.prewarm.ok", module=label)
            except Exception as exc:
                logger.warning("startup.prewarm.failed", module=label, error=str(exc))
    yield
    logger.info("shutdown")


app = FastAPI(
    title="MarginBoard API",
    description=(
        "Backend for MarginBoard — a retail operations dashboard built on the "
        "Online Retail II dataset. Surfaces overview KPIs, a 30-day revenue "
        "forecast, simulated inventory risk, and transaction anomaly monitoring."
    ),
    version="0.3.0",
    lifespan=lifespan,
)

app.add_middleware(RequestContextMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(CORS_ORIGINS),
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health", tags=["meta"])
def health() -> dict[str, object]:
    """Lightweight health probe with state checks for ops dashboards."""
    return {
        "status": "ok",
        "dataset_ready": PROCESSED_DATASET_FILE.exists(),
        "artifacts": {
            "forecast": FORECAST_ARTIFACT.exists(),
            "inventory": INVENTORY_ARTIFACT.exists(),
            "anomaly": ANOMALY_ARTIFACT.exists(),
        },
    }


for router in (
    overview.router,
    forecasting.router,
    inventory.router,
    transactions.router,
    analytics.router,
    basket.router,
    admin.router,
):
    app.include_router(router, prefix=API_PREFIX)
