from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta


@dataclass(frozen=True)
class DateRange:
    start: date
    end: date

    @property
    def length_days(self) -> int:
        return (self.end - self.start).days + 1

    def previous_period(self) -> DateRange:
        length = self.length_days
        prev_end = self.start - timedelta(days=1)
        prev_start = prev_end - timedelta(days=length - 1)
        return DateRange(start=prev_start, end=prev_end)


def parse_iso_date(value: str | None) -> date | None:
    if value is None or value == "":
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise ValueError(
            f"Invalid date '{value}'. Expected ISO format YYYY-MM-DD."
        ) from exc


def resolve_range(
    start: str | None,
    end: str | None,
    dataset_min: date,
    dataset_max: date,
) -> DateRange:
    """Resolve a requested range, defaulting missing bounds to the dataset.

    The requested dates are returned **as-is** rather than clamped to the
    dataset window. Clamping silently rewrote out-of-range requests to the
    nearest dataset boundary — e.g. a 2020-01-01 request returned the last
    day of 2011 — which is misleading. Letting the filter return zero rows
    for non-overlapping windows is the honest behaviour.
    """
    parsed_start = parse_iso_date(start) or dataset_min
    parsed_end = parse_iso_date(end) or dataset_max

    if parsed_start > parsed_end:
        raise ValueError("start date must be on or before end date.")

    return DateRange(start=parsed_start, end=parsed_end)


def safe_growth_pct(current: float, previous: float) -> float | None:
    """Return percent change, or None if the previous value is zero."""
    if previous == 0:
        return None
    return round(((current - previous) / previous) * 100, 2)
