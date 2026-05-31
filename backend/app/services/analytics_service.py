"""Analytics that the dashboard pages will consume later: cohort retention,
ABC classification, and RFM customer segmentation.

These are computed on the cleaned transactions frame and cached in-process
(same pattern as the other services).
"""

from __future__ import annotations

import logging
from threading import Lock

import pandas as pd

from app.schemas.analytics import (
    ABCClassificationRow,
    ABCSummary,
    CohortRetentionRow,
    CustomerSegment,
    SegmentSummary,
)
from app.services.data_service import load_transactions, product_skus_only

logger = logging.getLogger(__name__)

# Pareto cuts. 80/95 is the most common A/B split in inventory management;
# some teams use 70/90 instead. I picked the classic.
A_SHARE = 0.80
B_SHARE = 0.95


_cohort_lock = Lock()
_cohort_cache: list[CohortRetentionRow] | None = None

_abc_lock = Lock()
_abc_cache: tuple[list[ABCClassificationRow], ABCSummary] | None = None

_rfm_lock = Lock()
_rfm_cache: tuple[list[CustomerSegment], list[SegmentSummary]] | None = None


# ---------- Cohort retention -------------------------------------------------


def _build_cohort(df: pd.DataFrame) -> list[CohortRetentionRow]:
    customers = df.dropna(subset=["customer_id"]).copy()
    if customers.empty:
        return []

    customers["invoice_month"] = customers["invoice_date"].dt.to_period("M")
    first_purchase = (
        customers.groupby("customer_id")["invoice_month"].min().rename("cohort_month")
    )
    customers = customers.join(first_purchase, on="customer_id")
    customers["period_offset"] = (
        (customers["invoice_month"] - customers["cohort_month"]).apply(lambda x: x.n)
    )

    # cohort_size = unique customers per cohort
    cohort_sizes = (
        customers.drop_duplicates(["customer_id"])
        .groupby("cohort_month").size()
    )

    # active customers per (cohort, offset)
    activity = (
        customers.groupby(["cohort_month", "period_offset"])["customer_id"]
        .nunique()
        .unstack(fill_value=0)
        .sort_index()
    )

    # Cap horizon — pre-2010 cohorts can extend 24+ periods which clutters the API.
    max_offset = min(activity.columns.max(), 12)
    activity = activity.loc[:, :max_offset]

    rows: list[CohortRetentionRow] = []
    for cohort, counts in activity.iterrows():
        size = int(cohort_sizes.loc[cohort])
        if size == 0:
            continue
        retention = {
            str(int(off)): round(float(counts[off]) / size * 100, 1)
            for off in counts.index
        }
        rows.append(
            CohortRetentionRow(
                cohort_month=str(cohort),
                cohort_size=size,
                retention=retention,
            )
        )
    return rows


def get_cohort_retention() -> list[CohortRetentionRow]:
    global _cohort_cache
    if _cohort_cache is not None:
        return _cohort_cache
    with _cohort_lock:
        if _cohort_cache is None:
            _cohort_cache = _build_cohort(load_transactions())
        return _cohort_cache


# ---------- ABC classification -----------------------------------------------


def _build_abc(df: pd.DataFrame) -> tuple[list[ABCClassificationRow], ABCSummary]:
    sales = df[df["quantity"] > 0]
    if sales.empty:
        return [], ABCSummary(
            a_count=0, b_count=0, c_count=0,
            a_revenue_share_pct=0.0, b_revenue_share_pct=0.0, c_revenue_share_pct=0.0,
        )

    by_sku = (
        sales.groupby(["stock_code", "description"], as_index=False)
        .agg(revenue=("revenue", "sum"))
        .sort_values("revenue", ascending=False)
    )

    total = float(by_sku["revenue"].sum())
    by_sku["cum_share"] = by_sku["revenue"].cumsum() / total

    def _classify(share: float) -> str:
        if share <= A_SHARE:
            return "A"
        if share <= B_SHARE:
            return "B"
        return "C"

    by_sku["abc_class"] = by_sku["cum_share"].apply(_classify)

    rows = [
        ABCClassificationRow(
            stock_code=str(r["stock_code"]),
            description=str(r["description"]),
            revenue=round(float(r["revenue"]), 2),
            cumulative_share_pct=round(float(r["cum_share"]) * 100, 2),
            abc_class=r["abc_class"],
        )
        for _, r in by_sku.iterrows()
    ]

    grouped = by_sku.groupby("abc_class")
    summary = ABCSummary(
        a_count=int((by_sku["abc_class"] == "A").sum()),
        b_count=int((by_sku["abc_class"] == "B").sum()),
        c_count=int((by_sku["abc_class"] == "C").sum()),
        a_revenue_share_pct=round(float(grouped["revenue"].sum().get("A", 0)) / total * 100, 2),
        b_revenue_share_pct=round(float(grouped["revenue"].sum().get("B", 0)) / total * 100, 2),
        c_revenue_share_pct=round(float(grouped["revenue"].sum().get("C", 0)) / total * 100, 2),
    )
    return rows, summary


def get_abc_classification(limit: int = 100) -> list[ABCClassificationRow]:
    global _abc_cache
    if _abc_cache is None:
        with _abc_lock:
            if _abc_cache is None:
                _abc_cache = _build_abc(product_skus_only(load_transactions()))
    return _abc_cache[0][:limit]


def get_abc_summary() -> ABCSummary:
    global _abc_cache
    if _abc_cache is None:
        with _abc_lock:
            if _abc_cache is None:
                _abc_cache = _build_abc(product_skus_only(load_transactions()))
    return _abc_cache[1]


# ---------- RFM customer segments --------------------------------------------


def _score_quintile(series: pd.Series, ascending: bool) -> pd.Series:
    """Bucket into 5 groups. Higher score = better, regardless of metric direction.
    For Recency, low values are better, so ascending=False (small recency → high score).
    For Frequency and Monetary, high values are better, so ascending=True.
    """
    try:
        return pd.qcut(
            series.rank(method="first", ascending=ascending),
            q=5, labels=[1, 2, 3, 4, 5],
        ).astype(int)
    except ValueError:
        # Not enough distinct values for 5 buckets — fall back to median split.
        return (series >= series.median()).astype(int).replace({0: 1, 1: 5})


def _assign_segment(r: int, f: int, m: int) -> str:
    """Coarse RFM → segment mapping. Industry-standard buckets."""
    if r >= 4 and f >= 4 and m >= 4:
        return "Champions"
    if r >= 3 and f >= 4:
        return "Loyal"
    if r >= 4 and f <= 3:
        return "Potential Loyalist"
    if r <= 2 and f >= 3:
        return "At Risk"
    if r <= 2 and f <= 2 and m >= 3:
        return "Hibernating"
    if r <= 1 and f <= 1:
        return "Lost"
    if r >= 4 and f <= 1:
        return "New"
    return "Others"


def _build_rfm(df: pd.DataFrame) -> tuple[list[CustomerSegment], list[SegmentSummary]]:
    customers = df.dropna(subset=["customer_id"])
    customers = customers[customers["quantity"] > 0]
    if customers.empty:
        return [], []

    snapshot = customers["invoice_date"].max() + pd.Timedelta(days=1)

    rfm = customers.groupby("customer_id").agg(
        recency_days=("invoice_date", lambda s: (snapshot - s.max()).days),
        frequency=("invoice_id", "nunique"),
        monetary=("revenue", "sum"),
    ).reset_index()

    rfm["r_score"] = _score_quintile(rfm["recency_days"], ascending=False)
    rfm["f_score"] = _score_quintile(rfm["frequency"], ascending=True)
    rfm["m_score"] = _score_quintile(rfm["monetary"], ascending=True)
    rfm["segment"] = rfm.apply(
        lambda r: _assign_segment(r["r_score"], r["f_score"], r["m_score"]), axis=1
    )

    segments: list[CustomerSegment] = []
    for _, row in rfm.iterrows():
        segments.append(
            CustomerSegment(
                customer_id=int(row["customer_id"]),
                recency_days=int(row["recency_days"]),
                frequency=int(row["frequency"]),
                monetary=round(float(row["monetary"]), 2),
                r_score=int(row["r_score"]),
                f_score=int(row["f_score"]),
                m_score=int(row["m_score"]),
                segment=row["segment"],
            )
        )

    total_rev = float(rfm["monetary"].sum())
    summary = [
        SegmentSummary(
            segment=seg,
            customer_count=int(group.shape[0]),
            revenue_share_pct=round(float(group["monetary"].sum()) / total_rev * 100, 2)
            if total_rev else 0.0,
        )
        for seg, group in rfm.groupby("segment")
    ]
    summary.sort(key=lambda s: s.revenue_share_pct, reverse=True)
    return segments, summary


def get_customer_segments(limit: int = 500) -> list[CustomerSegment]:
    global _rfm_cache
    if _rfm_cache is None:
        with _rfm_lock:
            if _rfm_cache is None:
                _rfm_cache = _build_rfm(load_transactions())
    segments_sorted = sorted(_rfm_cache[0], key=lambda s: s.monetary, reverse=True)
    return segments_sorted[:limit]


def get_segment_summary() -> list[SegmentSummary]:
    global _rfm_cache
    if _rfm_cache is None:
        with _rfm_lock:
            if _rfm_cache is None:
                _rfm_cache = _build_rfm(load_transactions())
    return _rfm_cache[1]


def reset_cache() -> None:
    global _cohort_cache, _abc_cache, _rfm_cache
    with _cohort_lock:
        _cohort_cache = None
    with _abc_lock:
        _abc_cache = None
    with _rfm_lock:
        _rfm_cache = None
