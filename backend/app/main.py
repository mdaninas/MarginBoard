from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import API_PREFIX, CORS_ORIGINS
from app.routes import forecasting, inventory, methodology, overview, transactions

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
)

app = FastAPI(
    title="MarginBoard API",
    description=(
        "Backend for MarginBoard — a retail operations dashboard built on the "
        "Online Retail II dataset. Surfaces overview KPIs, a 30-day revenue "
        "forecast, simulated inventory risk, and transaction anomaly monitoring."
    ),
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(CORS_ORIGINS),
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}


for router in (
    overview.router,
    forecasting.router,
    inventory.router,
    transactions.router,
    methodology.router,
):
    app.include_router(router, prefix=API_PREFIX)
