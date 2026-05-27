from app.services import metrics_service


def test_overview_metrics_basic_shape(synthetic_transactions):
    m = metrics_service.get_overview_metrics()
    assert m.total_revenue > 0
    assert m.total_orders > 0
    assert m.average_order_value > 0
    assert m.period_start <= m.period_end
    assert m.previous_period_end < m.period_start


def test_revenue_trend_returns_sorted_dates(synthetic_transactions):
    points = metrics_service.get_revenue_trend()
    assert len(points) > 0
    dates = [p.date for p in points]
    assert dates == sorted(dates)


def test_top_products_excludes_returns(synthetic_transactions):
    # The fixture injects a 5000-unit outlier sale plus 3 small returns.
    # The outlier should rank #1; returns must NOT make a SKU appear top.
    products = metrics_service.get_top_products(limit=5)
    assert products, "expected at least one product"
    # Units sold must be positive for every ranked product.
    assert all(p.units_sold > 0 for p in products)
    # The 5000-unit outlier means REGENCY CAKESTAND tops by revenue.
    assert products[0].stock_code == "22423"


def test_top_products_avg_price_is_close_to_listed_price(synthetic_transactions):
    products = metrics_service.get_top_products(limit=5)
    by_code = {p.stock_code: p for p in products}
    # White Hanging Heart fixture price is 2.55 — no per-row variance.
    if "85123A" in by_code:
        assert by_code["85123A"].average_price == 2.55


def test_country_performance_ranks_uk_first(synthetic_transactions):
    countries = metrics_service.get_country_performance(limit=5)
    assert countries[0].country == "United Kingdom"
    assert countries[0].revenue > 0


def test_invalid_date_range_raises(synthetic_transactions):
    import pytest

    with pytest.raises(ValueError):
        metrics_service.get_overview_metrics(start="2011-12-01", end="2011-01-01")
