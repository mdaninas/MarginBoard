"""Compute overview-page metrics from the cleaned transactions frame.

All functions accept the same `start`/`end`/`country` filters the routes
expose, normalize them against the dataset bounds, and return plain Python
objects ready for Pydantic serialization.
"""

from __future__ import annotations

from datetime import date

import pandas as pd

from app.schemas.overview import (
    CountryPerformance,
    OverviewMetrics,
    RevenueTrendPoint,
    TopProduct,
)
from app.services.data_service import load_transactions
from app.utils.dates import DateRange, resolve_range, safe_growth_pct


def _dataset_bounds(df: pd.DataFrame) -> tuple[date, date]:
    return df["invoice_date"].min().date(), df["invoice_date"].max().date()


def _filter(
    df: pd.DataFrame, range_: DateRange, country: str | None
) -> pd.DataFrame:
    start_ts = pd.Timestamp(range_.start)
    # End is inclusive — bump to end-of-day so timestamps on the last date are
    # included regardless of the time component.
    end_ts = pd.Timestamp(range_.end) + pd.Timedelta(days=1) - pd.Timedelta(seconds=1)
    mask = (df["invoice_date"] >= start_ts) & (df["invoice_date"] <= end_ts)
    if country:
        # Use the pre-normalized column when available (added in data_service)
        # to skip a 1M-row casefold on every request.
        if "country_lc" in df.columns:
            mask &= df["country_lc"] == country.casefold()
        else:
            mask &= df["country"].str.casefold() == country.casefold()
    return df.loc[mask]


def _period_aggregates(df: pd.DataFrame) -> dict[str, float | int]:
    if df.empty:
        return {
            "revenue": 0.0,
            "orders": 0,
            "units": 0,
            "return_invoices": 0,
            "active_customers": 0,
        }

    revenue = float(df["revenue"].sum())
    orders = int(df["invoice_id"].nunique())
    units = int(df["quantity"].sum())

    # An invoice is a return/cancellation if any of its lines has qty < 0 or if
    # the invoice id is prefixed with 'C' (Online Retail II convention).
    is_return_line = (df["quantity"] < 0) | df["invoice_id"].str.startswith("C", na=False)
    return_invoices = int(df.loc[is_return_line, "invoice_id"].nunique())

    active_customers = int(df["customer_id"].dropna().nunique())

    return {
        "revenue": revenue,
        "orders": orders,
        "units": units,
        "return_invoices": return_invoices,
        "active_customers": active_customers,
    }


def get_overview_metrics(
    start: str | None = None,
    end: str | None = None,
    country: str | None = None,
) -> OverviewMetrics:
    df = load_transactions()
    dataset_min, dataset_max = _dataset_bounds(df)
    current_range = resolve_range(start, end, dataset_min, dataset_max)
    previous_range = current_range.previous_period()

    current = _period_aggregates(_filter(df, current_range, country))
    previous = _period_aggregates(_filter(df, previous_range, country))

    aov = current["revenue"] / current["orders"] if current["orders"] else 0.0

    return OverviewMetrics(
        total_revenue=round(current["revenue"], 2),
        total_orders=current["orders"],
        average_order_value=round(aov, 2),
        units_sold=current["units"],
        return_count=current["return_invoices"],
        active_customers=current["active_customers"],
        revenue_growth_pct=safe_growth_pct(current["revenue"], previous["revenue"]),
        orders_growth_pct=safe_growth_pct(current["orders"], previous["orders"]),
        period_start=current_range.start,
        period_end=current_range.end,
        previous_period_start=previous_range.start,
        previous_period_end=previous_range.end,
    )


def get_revenue_trend(
    start: str | None = None,
    end: str | None = None,
    country: str | None = None,
) -> list[RevenueTrendPoint]:
    df = load_transactions()
    dataset_min, dataset_max = _dataset_bounds(df)
    range_ = resolve_range(start, end, dataset_min, dataset_max)
    filtered = _filter(df, range_, country)
    if filtered.empty:
        return []

    daily = (
        filtered.assign(_day=filtered["invoice_date"].dt.date)
        .groupby("_day", as_index=False)
        .agg(
            revenue=("revenue", "sum"),
            orders=("invoice_id", "nunique"),
            units=("quantity", "sum"),
        )
        .sort_values("_day")
    )

    return [
        RevenueTrendPoint(
            date=row["_day"],
            revenue=round(float(row["revenue"]), 2),
            orders=int(row["orders"]),
            units=int(row["units"]),
        )
        for _, row in daily.iterrows()
    ]


def get_top_products(
    start: str | None = None,
    end: str | None = None,
    country: str | None = None,
    limit: int = 10,
) -> list[TopProduct]:
    df = load_transactions()
    dataset_min, dataset_max = _dataset_bounds(df)
    range_ = resolve_range(start, end, dataset_min, dataset_max)
    filtered = _filter(df, range_, country)
    if filtered.empty:
        return []

    # Ranking semantics intentionally differ from /overview/revenue-trend:
    #   - revenue-trend includes returns (negative quantity → negative revenue)
    #     so the daily series reflects net business activity.
    #   - top-products excludes returns to rank by gross sales only, otherwise
    #     a product with high return volume could appear at the top with a
    #     small net positive.
    # This is documented on the Methodology page.
    sales_only = filtered[filtered["quantity"] > 0]
    if sales_only.empty:
        return []

    grouped = (
        sales_only.groupby(["stock_code", "description"], as_index=False)
        .agg(
            units_sold=("quantity", "sum"),
            revenue=("revenue", "sum"),
            average_price=("unit_price", "mean"),
            order_count=("invoice_id", "nunique"),
        )
        .sort_values("revenue", ascending=False)
        .head(limit)
    )

    return [
        TopProduct(
            stock_code=str(row["stock_code"]),
            description=str(row["description"]),
            units_sold=int(row["units_sold"]),
            revenue=round(float(row["revenue"]), 2),
            average_price=round(float(row["average_price"]), 2),
            order_count=int(row["order_count"]),
        )
        for _, row in grouped.iterrows()
    ]


def get_country_performance(
    start: str | None = None,
    end: str | None = None,
    limit: int = 20,
) -> list[CountryPerformance]:
    df = load_transactions()
    dataset_min, dataset_max = _dataset_bounds(df)
    range_ = resolve_range(start, end, dataset_min, dataset_max)
    filtered = _filter(df, range_, country=None)
    if filtered.empty:
        return []

    base = (
        filtered.groupby("country", as_index=False)
        .agg(
            revenue=("revenue", "sum"),
            orders=("invoice_id", "nunique"),
            units=("quantity", "sum"),
        )
    )
    # Pre-filter nulls for the unique-customer count — much faster than a lambda
    # inside groupby on multi-million-row datasets.
    customers = (
        filtered.dropna(subset=["customer_id"])
        .groupby("country", as_index=False)["customer_id"]
        .nunique()
        .rename(columns={"customer_id": "active_customers"})
    )
    grouped = (
        base.merge(customers, on="country", how="left")
        .fillna({"active_customers": 0})
        .sort_values("revenue", ascending=False)
        .head(limit)
    )

    return [
        CountryPerformance(
            country=str(row["country"]),
            revenue=round(float(row["revenue"]), 2),
            orders=int(row["orders"]),
            units=int(row["units"]),
            active_customers=int(row["active_customers"]),
        )
        for _, row in grouped.iterrows()
    ]
