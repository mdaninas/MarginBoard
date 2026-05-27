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
    """Resolve a requested range against the dataset bounds.

    Missing values fall back to the dataset bounds. The range is also clamped
    inside the dataset bounds so previous-period math stays well-defined.
    """
    parsed_start = parse_iso_date(start) or dataset_min
    parsed_end = parse_iso_date(end) or dataset_max

    if parsed_start > parsed_end:
        raise ValueError("start date must be on or before end date.")

    clamped_start = max(parsed_start, dataset_min)
    clamped_end = min(parsed_end, dataset_max)

    if clamped_start > clamped_end:
        # Requested window sits entirely outside the dataset.
        return DateRange(start=dataset_min, end=dataset_min)

    return DateRange(start=clamped_start, end=clamped_end)


def safe_growth_pct(current: float, previous: float) -> float | None:
    """Return percent change, or None if the previous value is zero."""
    if previous == 0:
        return None
    return round(((current - previous) / previous) * 100, 2)
