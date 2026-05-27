"""End-to-end happy-path API tests via FastAPI TestClient.

These tests boot the full app (with our monkeypatched data layer) and hit
every public endpoint. They verify status codes and basic response shapes;
the deeper correctness checks live in the per-service test files.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


# ---- meta -------------------------------------------------------------------


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert "artifacts" in body
    assert "dataset_ready" in body


# ---- overview ---------------------------------------------------------------


def test_overview_metrics(client):
    r = client.get("/api/overview/metrics")
    assert r.status_code == 200
    body = r.json()
    assert body["total_revenue"] >= 0
    assert body["total_orders"] >= 0
    # Growth fields can be null when there is no prior period.
    assert "revenue_growth_pct" in body


def test_overview_metrics_bad_date_returns_400(client):
    r = client.get("/api/overview/metrics", params={"start": "not-a-date"})
    assert r.status_code == 400


def test_overview_metrics_inverted_range_returns_400(client):
    r = client.get(
        "/api/overview/metrics",
        params={"start": "2011-12-01", "end": "2011-01-01"},
    )
    assert r.status_code == 400


def test_revenue_trend_returns_list(client):
    r = client.get("/api/overview/revenue-trend")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_top_products_respects_limit(client):
    r = client.get("/api/overview/top-products", params={"limit": 3})
    assert r.status_code == 200
    body = r.json()
    assert len(body) <= 3


def test_country_performance(client):
    r = client.get("/api/overview/country-performance")
    assert r.status_code == 200
    countries = [row["country"] for row in r.json()]
    assert "United Kingdom" in countries


# ---- forecasting ------------------------------------------------------------


def test_forecast_summary(client):
    r = client.get("/api/forecasting/summary")
    assert r.status_code == 200
    body = r.json()
    assert body["model"] == "GradientBoostingRegressor"
    assert body["forecast_horizon_days"] == 30
    assert body["cv_folds"] >= 2


def test_forecast_timeseries_has_both_types(client):
    r = client.get("/api/forecasting/timeseries")
    assert r.status_code == 200
    types = {row["type"] for row in r.json()}
    assert {"historical", "forecast"}.issubset(types)


# ---- inventory --------------------------------------------------------------


def test_inventory_summary(client):
    r = client.get("/api/inventory/summary")
    assert r.status_code == 200
    body = r.json()
    assert "simulated" in body["note"].lower()


def test_inventory_products_filter(client):
    r = client.get("/api/inventory/products", params={"risk": "High", "limit": 50})
    assert r.status_code == 200
    for row in r.json():
        assert row["risk_level"] == "High"


# ---- transactions -----------------------------------------------------------


def test_transactions_summary_has_disclaimer(client):
    r = client.get("/api/transactions/summary")
    assert r.status_code == 200
    body = r.json()
    assert "fraud" in body["disclaimer"].lower()


def test_transactions_anomalies(client):
    r = client.get("/api/transactions/anomalies", params={"limit": 20})
    assert r.status_code == 200
    assert len(r.json()) <= 20


# ---- methodology ------------------------------------------------------------


def test_methodology_english_default(client):
    r = client.get("/api/methodology")
    assert r.status_code == 200
    assert r.json()["dataset"]["title"] == "Dataset"


def test_methodology_indonesian(client):
    r = client.get("/api/methodology", params={"lang": "id"})
    assert r.status_code == 200
    assert r.json()["data_cleaning"]["title"] == "Pembersihan Data"


# ---- analytics --------------------------------------------------------------


def test_cohort_retention(client):
    r = client.get("/api/analytics/cohort-retention")
    assert r.status_code == 200
    rows = r.json()
    # Every cohort starts at 100% retention by definition.
    for row in rows:
        assert row["retention"]["0"] == 100.0


def test_abc_summary(client):
    r = client.get("/api/analytics/abc-summary")
    assert r.status_code == 200
    body = r.json()
    total_share = (
        body["a_revenue_share_pct"]
        + body["b_revenue_share_pct"]
        + body["c_revenue_share_pct"]
    )
    assert 99.0 <= total_share <= 101.0


def test_segment_summary(client):
    r = client.get("/api/analytics/segment-summary")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ---- admin ------------------------------------------------------------------


def test_admin_refresh_disabled_when_no_token(client):
    # ADMIN_TOKEN isn't set in tests → endpoint returns 404.
    r = client.post("/api/admin/refresh")
    assert r.status_code == 404
