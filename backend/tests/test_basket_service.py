"""Tests for the market basket service.

The synthetic fixture only has 4 SKUs and ~700 invoices, so the rule set is
sparse — but enough to exercise the pipeline end-to-end. The assertions focus
on invariants that must hold regardless of which rules happen to clear the
thresholds (since rule content depends on the random fixture).
"""

from __future__ import annotations

from app.services import basket_service


def test_summary_reports_basket_count(synthetic_transactions):
    summary = basket_service.get_summary()
    # Multi-item baskets only — must be ≤ total invoice count.
    n_invoices = synthetic_transactions["invoice_id"].nunique()
    assert 0 < summary.transactions_analyzed <= n_invoices
    assert summary.unique_items_considered > 0


def test_summary_records_thresholds(synthetic_transactions):
    summary = basket_service.get_summary()
    assert summary.min_support == basket_service.MIN_SUPPORT
    assert summary.min_confidence == basket_service.MIN_CONFIDENCE


def test_rules_obey_thresholds(synthetic_transactions):
    rules = basket_service.get_rules(limit=50)
    for r in rules:
        assert r.support >= basket_service.MIN_SUPPORT - 1e-9
        assert r.confidence >= basket_service.MIN_CONFIDENCE - 1e-9
        # antecedents and consequents must be disjoint sets (mlxtend invariant)
        assert not set(r.antecedents) & set(r.consequents)


def test_min_lift_filter_excludes_below_threshold(synthetic_transactions):
    high_lift = basket_service.get_rules(limit=100, min_lift=2.0)
    for r in high_lift:
        assert r.lift >= 2.0


def test_rules_sorted_by_lift_descending(synthetic_transactions):
    rules = basket_service.get_rules(limit=20)
    if len(rules) >= 2:
        lifts = [r.lift for r in rules]
        assert lifts == sorted(lifts, reverse=True)


def test_antecedent_labels_match_codes_length(synthetic_transactions):
    rules = basket_service.get_rules(limit=10)
    for r in rules:
        assert len(r.antecedents) == len(r.antecedent_labels)
        assert len(r.consequents) == len(r.consequent_labels)


def test_empty_after_filter_returns_empty_list(synthetic_transactions):
    # No real rule will clear lift = 1000 on this dataset.
    rules = basket_service.get_rules(limit=10, min_lift=1000.0)
    assert rules == []
