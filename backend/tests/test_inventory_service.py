from app.services import inventory_service
from app.services.inventory_service import _classify, _coverage_ratio


class TestRiskClassification:
    def test_low_when_stock_meets_demand(self):
        # stock_gap <= 0
        assert _classify(stock_gap=-10, estimated_demand=100) == "Low"
        assert _classify(stock_gap=0, estimated_demand=100) == "Low"

    def test_medium_when_gap_is_small_fraction(self):
        # gap <= 30% of demand
        assert _classify(stock_gap=20, estimated_demand=100) == "Medium"
        assert _classify(stock_gap=30, estimated_demand=100) == "Medium"

    def test_high_when_gap_exceeds_threshold(self):
        assert _classify(stock_gap=31, estimated_demand=100) == "High"
        assert _classify(stock_gap=200, estimated_demand=100) == "High"


class TestCoverageRatio:
    def test_is_deterministic_for_same_code(self):
        assert _coverage_ratio("85123A") == _coverage_ratio("85123A")

    def test_is_within_expected_bounds(self):
        for code in ["A", "B", "85123A", "ZZZ-9999", ""]:
            ratio = _coverage_ratio(code)
            assert 0.3 <= ratio <= 2.0


def test_build_artifacts_returns_consistent_summary(synthetic_transactions):
    artifacts = inventory_service.build_artifacts()
    s = artifacts.summary
    # Summary high/medium/low must equal the table counts.
    table_high = sum(1 for p in artifacts.products if p.risk_level == "High")
    table_medium = sum(1 for p in artifacts.products if p.risk_level == "Medium")
    table_low = sum(1 for p in artifacts.products if p.risk_level == "Low")
    assert s.high_risk_products == table_high
    assert s.medium_risk_products == table_medium
    assert s.low_risk_products == table_low
    assert s.products_at_risk == table_high + table_medium


def test_simulated_stock_label_in_summary_note(synthetic_transactions):
    summary = inventory_service.get_inventory_summary()
    assert "simulated" in summary.note.lower()


def test_products_sorted_by_lost_revenue_desc(synthetic_transactions):
    products = inventory_service.get_inventory_products(limit=100)
    losses = [p.potential_lost_revenue for p in products]
    assert losses == sorted(losses, reverse=True)
