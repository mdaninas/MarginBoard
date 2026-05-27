"""Filesystem layout and small helpers for ML artifacts.

The runtime services load these at startup. Training scripts under
`backend/ml/` write them. If an artifact is missing the corresponding
service falls back to on-demand computation, so the app stays runnable
without a separate training step.
"""

from __future__ import annotations

from pathlib import Path

from app.config import PROCESSED_DIR

ARTIFACT_DIR = PROCESSED_DIR / "artifacts"

FORECAST_ARTIFACT = ARTIFACT_DIR / "forecast.joblib"
ANOMALY_ARTIFACT = ARTIFACT_DIR / "anomaly.joblib"
INVENTORY_ARTIFACT = ARTIFACT_DIR / "inventory.parquet"
INVENTORY_SUMMARY_ARTIFACT = ARTIFACT_DIR / "inventory_summary.json"
ANOMALY_FLAGGED_ARTIFACT = ARTIFACT_DIR / "anomaly_flagged.parquet"
ANOMALY_SUMMARY_ARTIFACT = ARTIFACT_DIR / "anomaly_summary.json"


def ensure_dir() -> Path:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    return ARTIFACT_DIR
