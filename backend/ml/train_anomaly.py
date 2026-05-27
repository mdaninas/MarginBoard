"""Train the anomaly scorer and persist the flagged-transactions table.

Run from the backend directory with the venv active:

    python -m ml.train_anomaly
"""

from __future__ import annotations

import logging
import sys

import joblib

from app.services import anomaly_service
from ml.artifacts import ANOMALY_ARTIFACT, ensure_dir

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s - %(message)s")
logger = logging.getLogger(__name__)


def main() -> int:
    ensure_dir()
    logger.info("Scoring transactions for anomalies …")
    artifacts = anomaly_service.build_artifacts()
    joblib.dump(artifacts, ANOMALY_ARTIFACT, compress=3)
    logger.info(
        "Saved anomaly artifact to %s (%s reviewed, %s flagged, avg score %.3f)",
        ANOMALY_ARTIFACT,
        artifacts.summary.transactions_reviewed,
        artifacts.summary.flagged_transactions,
        artifacts.summary.average_anomaly_score,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
