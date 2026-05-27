"""Train the forecast model and persist the artifact to disk.

Run from the backend directory with the venv active:

    python -m ml.train_forecast

The runtime service (`app.services.forecast_service`) loads this artifact on
first request. If it is missing the service falls back to on-demand training,
which is convenient for first-time runs but pays the training cost on the
first HTTP request.
"""

from __future__ import annotations

import logging
import sys

import joblib

from app.services import forecast_service
from ml.artifacts import FORECAST_ARTIFACT, ensure_dir

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s - %(message)s")
logger = logging.getLogger(__name__)


def main() -> int:
    ensure_dir()
    logger.info("Training forecast model …")
    artifacts = forecast_service.build_artifacts()
    joblib.dump(artifacts, FORECAST_ARTIFACT, compress=3)
    logger.info(
        "Saved forecast artifact to %s (MAPE %.2f%% ± %.2f, MAE %.2f ± %.2f)",
        FORECAST_ARTIFACT,
        artifacts.summary.mape,
        artifacts.summary.mape_std,
        artifacts.summary.mae,
        artifacts.summary.mae_std,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
