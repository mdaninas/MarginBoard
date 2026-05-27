from datetime import date

import pytest

from app.utils.dates import (
    DateRange,
    parse_iso_date,
    resolve_range,
    safe_growth_pct,
)


class TestParseIsoDate:
    def test_returns_none_for_empty(self):
        assert parse_iso_date(None) is None
        assert parse_iso_date("") is None

    def test_parses_valid_iso(self):
        assert parse_iso_date("2011-03-15") == date(2011, 3, 15)

    def test_rejects_invalid_format(self):
        with pytest.raises(ValueError):
            parse_iso_date("15/03/2011")


class TestDateRange:
    def test_length_is_inclusive(self):
        r = DateRange(start=date(2011, 1, 1), end=date(2011, 1, 31))
        assert r.length_days == 31

    def test_previous_period_is_adjacent_and_same_length(self):
        r = DateRange(start=date(2011, 4, 1), end=date(2011, 4, 30))
        prev = r.previous_period()
        assert prev.length_days == r.length_days
        # Previous period ends the day before current starts.
        assert prev.end == date(2011, 3, 31)
        assert prev.start == date(2011, 3, 2)

    def test_single_day_range(self):
        r = DateRange(start=date(2011, 1, 1), end=date(2011, 1, 1))
        assert r.length_days == 1
        prev = r.previous_period()
        assert prev.start == prev.end == date(2010, 12, 31)


class TestResolveRange:
    def test_defaults_to_dataset_bounds(self):
        r = resolve_range(None, None, date(2011, 1, 1), date(2011, 12, 31))
        assert r.start == date(2011, 1, 1)
        assert r.end == date(2011, 12, 31)

    def test_clamps_to_dataset_bounds(self):
        # Requested range extends before dataset start
        r = resolve_range("2010-06-01", "2011-06-30", date(2011, 1, 1), date(2011, 12, 31))
        assert r.start == date(2011, 1, 1)
        assert r.end == date(2011, 6, 30)

    def test_rejects_inverted_range(self):
        with pytest.raises(ValueError):
            resolve_range("2011-12-01", "2011-01-01", date(2011, 1, 1), date(2011, 12, 31))


class TestSafeGrowthPct:
    def test_handles_zero_previous(self):
        assert safe_growth_pct(100, 0) is None

    def test_positive_growth(self):
        assert safe_growth_pct(108.4, 100) == 8.4

    def test_negative_growth(self):
        assert safe_growth_pct(80, 100) == -20.0

    def test_zero_change(self):
        assert safe_growth_pct(100, 100) == 0.0
