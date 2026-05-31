"""Market basket analysis: frequent itemsets + association rules.

The pipeline is the classic one:

1. Treat each ``invoice_id`` as a basket of stock codes.
2. Prune to the most frequent ``TOP_N_ITEMS`` SKUs so the Apriori lattice stays
   manageable — on Online Retail II the catalog tail is ~6.8k SKUs and most of
   it has trivial support. The pruning is purely for runtime; rules involving
   long-tail items would not clear ``MIN_SUPPORT`` anyway.
3. Run FP-Growth (fpgrowth is faster than apriori at the same min_support
   on dense sparse matrices like this one).
4. Generate rules with a confidence threshold, then sort by lift so the
   strongest non-trivial associations rise to the top.

Cached in-memory after first compute. Reset via ``reset_cache()``.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from threading import Lock

import pandas as pd
from mlxtend.frequent_patterns import association_rules, fpgrowth
from mlxtend.preprocessing import TransactionEncoder

from app.schemas.basket import AssociationRule, BasketSummary
from app.services.data_service import load_transactions, product_skus_only

logger = logging.getLogger(__name__)

# These thresholds are dataset-specific. With ~53k invoices, MIN_SUPPORT=0.01
# means an itemset must appear in ≥530 baskets to be considered — high enough
# to skip noise, low enough to surface real cross-sell pairs.
TOP_N_ITEMS = 200
MIN_SUPPORT = 0.01
MIN_CONFIDENCE = 0.30
MAX_RULES_RETURNED = 200

NOTE = (
    "Rules describe statistical co-occurrence in past baskets, not causal "
    "recommendations. Use them as starting points for merchandising review, "
    "not as automated decisions."
)


@dataclass
class _BasketArtifacts:
    rules: list[AssociationRule]
    summary: BasketSummary


_lock = Lock()
_cached: _BasketArtifacts | None = None


def _canonical_descriptions(sales: pd.DataFrame) -> dict[str, str]:
    """Pick one description per stock_code. Pick the mode so a noisy return-line
    description doesn't end up as the public label.
    """
    descs = (
        sales.groupby("stock_code")["description"]
        .agg(lambda s: s.mode().iat[0] if not s.mode().empty else s.iloc[0])
    )
    return descs.to_dict()


def _build(df: pd.DataFrame) -> _BasketArtifacts:
    sales = df[df["quantity"] > 0]
    if sales.empty:
        return _empty(0, 0)

    # Keep the most frequent SKUs. Frequency is measured in number of distinct
    # invoices the SKU appears in, not units sold — a single bulk order should
    # not promote a SKU to the head of the list.
    invoice_counts = sales.groupby("stock_code")["invoice_id"].nunique()
    top_items = invoice_counts.sort_values(ascending=False).head(TOP_N_ITEMS).index
    sales = sales[sales["stock_code"].isin(top_items)]
    if sales.empty:
        return _empty(0, len(top_items))

    baskets_iter = (
        sales.groupby("invoice_id")["stock_code"].apply(list).tolist()
    )
    # Drop single-item baskets — they can't produce association rules and
    # they inflate the denominator of every support calculation.
    baskets_iter = [b for b in baskets_iter if len(b) >= 2]
    if not baskets_iter:
        return _empty(0, len(top_items))

    encoder = TransactionEncoder()
    matrix = pd.DataFrame(
        encoder.fit_transform(baskets_iter),
        columns=encoder.columns_,
    )

    n_transactions = len(matrix)
    logger.info(
        "Basket: %s multi-item baskets, %s SKUs, min_support=%s",
        n_transactions, matrix.shape[1], MIN_SUPPORT,
    )

    itemsets = fpgrowth(matrix, min_support=MIN_SUPPORT, use_colnames=True)
    if itemsets.empty:
        return _empty(n_transactions, len(top_items))

    rules_df = association_rules(
        itemsets, metric="confidence", min_threshold=MIN_CONFIDENCE
    )
    if rules_df.empty:
        return _empty(n_transactions, len(top_items))

    rules_df = rules_df.sort_values("lift", ascending=False).head(MAX_RULES_RETURNED)

    descs = _canonical_descriptions(sales)
    rules: list[AssociationRule] = []
    for _, row in rules_df.iterrows():
        ants = list(row["antecedents"])
        cons = list(row["consequents"])
        rules.append(
            AssociationRule(
                antecedents=ants,
                antecedent_labels=[descs.get(a, a) for a in ants],
                consequents=cons,
                consequent_labels=[descs.get(c, c) for c in cons],
                support=round(float(row["support"]), 4),
                confidence=round(float(row["confidence"]), 4),
                lift=round(float(row["lift"]), 4),
                antecedent_support=round(float(row["antecedent support"]), 4),
                consequent_support=round(float(row["consequent support"]), 4),
            )
        )

    summary = BasketSummary(
        transactions_analyzed=n_transactions,
        unique_items_considered=len(top_items),
        rules_found=len(rules),
        min_support=MIN_SUPPORT,
        min_confidence=MIN_CONFIDENCE,
        note=NOTE,
    )

    return _BasketArtifacts(rules=rules, summary=summary)


def _empty(n_tx: int, n_items: int) -> _BasketArtifacts:
    return _BasketArtifacts(
        rules=[],
        summary=BasketSummary(
            transactions_analyzed=n_tx,
            unique_items_considered=n_items,
            rules_found=0,
            min_support=MIN_SUPPORT,
            min_confidence=MIN_CONFIDENCE,
            note=NOTE,
        ),
    )


def _get_or_compute() -> _BasketArtifacts:
    global _cached
    if _cached is not None:
        return _cached
    with _lock:
        if _cached is None:
            logger.info("Computing market basket rules …")
            _cached = _build(product_skus_only(load_transactions()))
        return _cached


def get_rules(
    limit: int = 50,
    min_confidence: float | None = None,
    min_lift: float | None = None,
) -> list[AssociationRule]:
    rules = _get_or_compute().rules
    if min_confidence is not None:
        rules = [r for r in rules if r.confidence >= min_confidence]
    if min_lift is not None:
        rules = [r for r in rules if r.lift >= min_lift]
    return rules[:limit]


def get_summary() -> BasketSummary:
    return _get_or_compute().summary


def reset_cache() -> None:
    global _cached
    with _lock:
        _cached = None
