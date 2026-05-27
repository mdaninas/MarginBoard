"""Precompute the inventory risk table and persist it.

Run from the backend directory with the venv active:

    python -m ml.train_inventory
"""

from __future__ import annotations

import logging
import sys

import joblib

from app.services import inventory_service
from ml.artifacts import INVENTORY_ARTIFACT, ensure_dir

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s - %(message)s")
logger = logging.getLogger(__name__)


def main() -> int:
    ensure_dir()
    logger.info("Computing inventory risk …")
    artifacts = inventory_service.build_artifacts()
    joblib.dump(artifacts, INVENTORY_ARTIFACT, compress=3)
    logger.info(
        "Saved inventory artifact to %s (%s SKUs, %s at risk)",
        INVENTORY_ARTIFACT,
        len(artifacts.products),
        artifacts.summary.products_at_risk,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
