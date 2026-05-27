"""Structlog setup.

Two output formats:

* `console` — human-readable, colorized. Default for local dev.
* `json`    — single-line JSON per event. For shipping to log aggregators.

The `log_format` setting drives which renderer is installed.
"""

from __future__ import annotations

import logging
import sys

import structlog

from app.config import settings


def configure_logging() -> None:
    level = getattr(logging, settings.log_level.upper(), logging.INFO)

    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if settings.log_format == "json":
        renderer: structlog.types.Processor = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer(colors=sys.stderr.isatty())

    structlog.configure(
        processors=[*shared_processors, renderer],
        wrapper_class=structlog.make_filtering_bound_logger(level),
        cache_logger_on_first_use=True,
    )

    # Route stdlib logging (uvicorn, sklearn) through structlog so everything
    # ends up in the same stream / format.
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=level,
        force=True,
    )

    # Quiet sklearn / joblib noise that doesn't help in production.
    for noisy in ("uvicorn.access",):
        logging.getLogger(noisy).setLevel(max(level, logging.INFO))


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    return structlog.get_logger(name)
