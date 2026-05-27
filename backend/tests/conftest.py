"""Shared fixtures.

Tests run against a small synthetic transactions frame rather than the real
Online Retail II CSV, so they stay fast and deterministic. The frame matches
the post-`data_service` internal schema.
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta

# Disable startup prewarm during the test session — TestClient triggers
# lifespan and we don't want each test paying that cost.
os.environ.setdefault("PREWARM_ON_STARTUP", "false")

import numpy as np
import pandas as pd
import pytest

from app.services import (
    analytics_service,
    anomaly_service,
    data_service,
    forecast_service,
    inventory_service,
    metrics_service,
)


@pytest.fixture
def synthetic_transactions() -> pd.DataFrame:
    """A tiny but realistic transactions frame covering ~120 days, 4 SKUs,
    2 countries, and a few returns and outliers."""
    rng = np.random.default_rng(seed=42)
    start = datetime(2011, 1, 1)
    rows: list[dict] = []
    skus = [
        ("85123A", "WHITE HANGING HEART T-LIGHT HOLDER", 2.55),
        ("71053", "WHITE METAL LANTERN", 3.39),
        ("84029G", "KNITTED UNION FLAG HOT WATER BOTTLE", 3.39),
        ("22423", "REGENCY CAKESTAND 3 TIER", 12.75),
    ]
    countries = ["United Kingdom", "Germany"]

    invoice_seq = 500_000
    for day_offset in range(120):
        date = start + timedelta(days=day_offset)
        # Skip weekends to mimic the dataset's weekly pattern.
        if date.weekday() >= 5:
            continue
        n_invoices = rng.integers(3, 8)
        for _ in range(int(n_invoices)):
            invoice_seq += 1
            country = rng.choice(countries, p=[0.85, 0.15])
            n_lines = rng.integers(1, 4)
            customer_id = float(rng.integers(10_000, 18_000))
            for _ in range(int(n_lines)):
                sku = skus[int(rng.integers(0, len(skus)))]
                qty = int(rng.integers(1, 12))
                rows.append({
                    "invoice_id": str(invoice_seq),
                    "stock_code": sku[0],
                    "description": sku[1],
                    "quantity": qty,
                    "invoice_date": date + timedelta(hours=int(rng.integers(8, 18))),
                    "unit_price": sku[2],
                    "customer_id": customer_id,
                    "country": str(country),
                })

    # Inject 3 returns (negative quantity with "C" invoice prefix).
    for i in range(3):
        rows.append({
            "invoice_id": f"C{invoice_seq + i + 1}",
            "stock_code": "85123A",
            "description": "WHITE HANGING HEART T-LIGHT HOLDER",
            "quantity": -2,
            "invoice_date": start + timedelta(days=60 + i),
            "unit_price": 2.55,
            "customer_id": 12345.0,
            "country": "United Kingdom",
        })

    # Inject one extreme transaction value outlier.
    rows.append({
        "invoice_id": "999999",
        "stock_code": "22423",
        "description": "REGENCY CAKESTAND 3 TIER",
        "quantity": 5000,
        "invoice_date": start + timedelta(days=90),
        "unit_price": 12.75,
        "customer_id": 17000.0,
        "country": "United Kingdom",
    })

    df = pd.DataFrame(rows)
    df["customer_id"] = df["customer_id"].astype("Int64")
    df["revenue"] = df["quantity"].astype(float) * df["unit_price"].astype(float)
    return df.sort_values("invoice_date").reset_index(drop=True)


@pytest.fixture(autouse=True)
def _patch_load_transactions(monkeypatch, synthetic_transactions):
    """Force every service that calls `load_transactions()` to use the fixture
    instead of touching the real parquet/CSV. Each service does
    `from app.services.data_service import load_transactions`, so we have to
    patch the name in every importing module — patching `data_service` alone
    would leave the stale reference in each consumer untouched.
    """
    def _stub(*_args, **_kwargs):
        return synthetic_transactions

    for module in (
        data_service,
        forecast_service,
        inventory_service,
        anomaly_service,
        metrics_service,
        analytics_service,
    ):
        monkeypatch.setattr(module, "load_transactions", _stub, raising=False)

    forecast_service.reset_cache()
    inventory_service.reset_cache()
    anomaly_service.reset_cache()
    analytics_service.reset_cache()
    yield
    forecast_service.reset_cache()
    inventory_service.reset_cache()
    anomaly_service.reset_cache()
    analytics_service.reset_cache()
