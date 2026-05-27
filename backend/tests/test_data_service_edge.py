"""Edge-case coverage for the data cleaning pipeline."""

import logging

import pandas as pd

from app.services.data_service import _clean, _standardize_columns


def test_strips_whitespace_in_description():
    raw = pd.DataFrame({
        "invoice_id": ["A"],
        "stock_code": ["X"],
        "description": ["  spaced out  "],
        "quantity": [1],
        "invoice_date": ["2011-01-01"],
        "unit_price": [1.0],
        "customer_id": [1],
        "country": [" UK "],
    })
    cleaned = _clean(raw)
    assert cleaned["description"].iloc[0] == "spaced out"
    assert cleaned["country"].iloc[0] == "UK"


def test_fills_missing_description():
    raw = pd.DataFrame({
        "invoice_id": ["A"],
        "stock_code": ["X"],
        "description": [None],
        "quantity": [1],
        "invoice_date": ["2011-01-01"],
        "unit_price": [1.0],
        "customer_id": [1],
        "country": ["UK"],
    })
    cleaned = _clean(raw)
    assert cleaned["description"].iloc[0] == "(no description)"


def test_drops_rows_with_unparsable_date():
    raw = pd.DataFrame({
        "invoice_id": ["A", "B"],
        "stock_code": ["X", "Y"],
        "description": ["a", "b"],
        "quantity": [1, 1],
        "invoice_date": ["2011-01-01", "not-a-date"],
        "unit_price": [1.0, 1.0],
        "customer_id": [1, 2],
        "country": ["UK", "UK"],
    })
    cleaned = _clean(raw)
    assert len(cleaned) == 1


def test_keeps_zero_priced_rows():
    """Promotional / freebie rows have price 0 — they're valid, just contribute zero revenue."""
    raw = pd.DataFrame({
        "invoice_id": ["A"],
        "stock_code": ["X"],
        "description": ["free sample"],
        "quantity": [1],
        "invoice_date": ["2011-01-01"],
        "unit_price": [0.0],
        "customer_id": [1],
        "country": ["UK"],
    })
    cleaned = _clean(raw)
    assert len(cleaned) == 1
    assert cleaned["revenue"].iloc[0] == 0


def test_sorts_by_invoice_date():
    raw = pd.DataFrame({
        "invoice_id": ["A", "B", "C"],
        "stock_code": ["X", "Y", "Z"],
        "description": ["a", "b", "c"],
        "quantity": [1, 1, 1],
        "invoice_date": ["2011-03-01", "2011-01-01", "2011-02-01"],
        "unit_price": [1.0, 1.0, 1.0],
        "customer_id": [1, 2, 3],
        "country": ["UK", "UK", "UK"],
    })
    cleaned = _clean(raw)
    assert cleaned["invoice_id"].tolist() == ["B", "C", "A"]


def test_warns_when_customer_id_column_missing(caplog):
    raw = pd.DataFrame({
        "Invoice": ["A"],
        "StockCode": ["X"],
        "Description": ["a"],
        "Quantity": [1],
        "InvoiceDate": ["2011-01-01"],
        "Price": [1.0],
        "Country": ["UK"],
    })
    with caplog.at_level(logging.WARNING):
        result = _standardize_columns(raw)
    assert "customer_id" in result.columns
    assert any("customer_id" in r.message for r in caplog.records)


def test_country_lowercase_column_added():
    raw = pd.DataFrame({
        "invoice_id": ["A"],
        "stock_code": ["X"],
        "description": ["a"],
        "quantity": [1],
        "invoice_date": ["2011-01-01"],
        "unit_price": [1.0],
        "customer_id": [1],
        "country": ["United Kingdom"],
    })
    cleaned = _clean(raw)
    assert "country_lc" in cleaned.columns
    assert cleaned["country_lc"].iloc[0] == "united kingdom"
