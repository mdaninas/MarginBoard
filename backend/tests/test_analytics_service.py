from app.services import analytics_service


def test_cohort_retention_first_period_is_100pct(synthetic_transactions):
    rows = analytics_service.get_cohort_retention()
    assert rows, "expected at least one cohort"
    for row in rows:
        # Offset 0 (the cohort's first month) is by definition 100% retention.
        assert row.retention["0"] == 100.0


def test_cohort_size_matches_unique_first_month_customers(synthetic_transactions):
    rows = analytics_service.get_cohort_retention()
    total = sum(r.cohort_size for r in rows)
    # The fixture has identified customer ids on every line, so total cohort
    # size should equal the unique customer count.
    unique = synthetic_transactions["customer_id"].dropna().nunique()
    assert total == unique


def test_abc_class_a_covers_about_80pct_revenue(synthetic_transactions):
    summary = analytics_service.get_abc_summary()
    # The classifier puts every SKU into exactly one class.
    total_skus = summary.a_count + summary.b_count + summary.c_count
    assert total_skus > 0
    # A class share is bounded above by 80% of total revenue by construction
    # (≤ A_SHARE = 0.80). Allow a small epsilon for rounding.
    assert summary.a_revenue_share_pct <= 80.5


def test_abc_classification_returns_sorted_by_revenue(synthetic_transactions):
    rows = analytics_service.get_abc_classification(limit=50)
    revenues = [r.revenue for r in rows]
    assert revenues == sorted(revenues, reverse=True)


def test_rfm_segments_contain_known_buckets(synthetic_transactions):
    summary = analytics_service.get_segment_summary()
    seg_names = {s.segment for s in summary}
    # At least one of the canonical segments must appear.
    assert seg_names & {"Champions", "Loyal", "At Risk", "Hibernating", "Lost", "Others"}


def test_rfm_revenue_share_sums_to_about_100(synthetic_transactions):
    summary = analytics_service.get_segment_summary()
    total = sum(s.revenue_share_pct for s in summary)
    assert 99.0 <= total <= 101.0
