"""Run all three training scripts sequentially.

    python -m ml.train_all
"""

from __future__ import annotations

import logging
import sys

from ml import train_anomaly, train_forecast, train_inventory

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s - %(message)s")
logger = logging.getLogger(__name__)


def main() -> int:
    # TODO: parallelize. Sequential is fine for 3 jobs and < 2 min total.
    for label, runner in (
        ("forecast", train_forecast.main),
        ("inventory", train_inventory.main),
        ("anomaly", train_anomaly.main),
    ):
        logger.info("=== Training %s ===", label)
        rc = runner()
        if rc != 0:
            logger.error("Training %s failed with rc=%s", label, rc)
            return rc
    logger.info("All artifacts written.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
