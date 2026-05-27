import pandas as pd

from app.services import anomaly_service
from app.services.anomaly_service import (
    HIGH_THRESHOLD,
    MEDIUM_THRESHOLD,
    _classify,
    _vectorized_reason_codes,
)


class TestRiskThreshold:
    def test_high_at_and_above_cutoff(self):
        assert _classify(HIGH_THRESHOLD) == "High"
        assert _classify(0.95) == "High"

    def test_medium_at_cutoff(self):
        assert _classify(MEDIUM_THRESHOLD) == "Medium"
        assert _classify(0.75) == "Medium"

    def test_low_below_medium_cutoff(self):
        assert _classify(MEDIUM_THRESHOLD - 0.01) == "Low"
        assert _classify(0.0) == "Low"


class TestVectorizedReasonCodes:
    def _frame(self, quantity, unit_price, invoice="A"):
        df = pd.DataFrame({
            "quantity": [quantity],
            "unit_price": [unit_price],
            "invoice_id": [invoice],
        })
        df["transaction_value"] = df["quantity"] * df["unit_price"]
        return df

    def test_negative_quantity_flagged(self):
        codes = _vectorized_reason_codes(
            self._frame(-5, 2.0), qty_high=100, price_high=50, value_high=200
        )
        assert "Negative quantity / return" in codes.iloc[0]

    def test_high_quantity_flagged(self):
        codes = _vectorized_reason_codes(
            self._frame(500, 1.0), qty_high=100, price_high=50, value_high=10_000
        )
        assert "Unusually high quantity" in codes.iloc[0]

    def test_extreme_price_flagged(self):
        codes = _vectorized_reason_codes(
            self._frame(1, 9999.0), qty_high=100, price_high=50, value_high=20_000
        )
        assert "Extreme unit price" in codes.iloc[0]

    def test_cancellation_invoice_flagged(self):
        codes = _vectorized_reason_codes(
            self._frame(1, 1.0, invoice="C12345"),
            qty_high=100, price_high=50, value_high=200,
        )
        assert "Invoice cancellation pattern" in codes.iloc[0]

    def test_normal_transaction_has_no_codes(self):
        codes = _vectorized_reason_codes(
            self._frame(1, 1.0, invoice="A"),
            qty_high=100, price_high=50, value_high=200,
        )
        assert codes.iloc[0] == []


def test_summary_disclaimer_present(synthetic_transactions):
    summary = anomaly_service.get_summary()
    assert "fraud" in summary.disclaimer.lower()
    assert "review" in summary.disclaimer.lower()


def test_high_risk_count_matches_table_subset(synthetic_transactions):
    summary = anomaly_service.get_summary()
    high = anomaly_service.get_anomalies(risk="High", limit=500)
    # All returned rows are High by construction.
    assert all(a.risk_level == "High" for a in high)
    # The summary counts the entire population; the table is top-N flagged.
    assert summary.high_risk_transactions >= len(high)
