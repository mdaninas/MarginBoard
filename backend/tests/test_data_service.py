import pandas as pd
import pytest

from app.services.data_service import (
    COLUMN_ALIASES,
    INTERNAL_COLUMNS,
    _clean,
    _standardize_columns,
)


def test_aliases_cover_known_variants():
    # The PRD explicitly calls out these source column variants.
    expected = {
        "invoice", "invoiceno", "stockcode", "description", "quantity",
        "invoicedate", "price", "unitprice", "customer id", "customerid",
        "country",
    }
    assert expected.issubset(set(COLUMN_ALIASES.keys()))


def test_standardize_handles_alternative_column_names():
    raw = pd.DataFrame({
        "InvoiceNo": ["1"],
        "StockCode": ["X"],
        "Description": ["Item"],
        "Quantity": [1],
        "InvoiceDate": ["2011-01-01"],
        "UnitPrice": [1.0],
        "CustomerID": [1234.0],
        "Country": ["UK"],
    })
    out = _standardize_columns(raw)
    assert "invoice_id" in out.columns
    assert "unit_price" in out.columns
    assert "customer_id" in out.columns


def test_standardize_raises_when_required_columns_missing():
    raw = pd.DataFrame({"Invoice": ["1"], "Country": ["UK"]})
    with pytest.raises(ValueError, match="missing required columns"):
        _standardize_columns(raw)


def test_clean_preserves_negative_quantities():
    raw = pd.DataFrame({
        "invoice_id": ["A", "B"],
        "stock_code": ["X", "Y"],
        "description": ["a", "b"],
        "quantity": [5, -3],
        "invoice_date": ["2011-01-01", "2011-01-02"],
        "unit_price": [1.0, 2.0],
        "customer_id": [1, 2],
        "country": ["UK", "UK"],
    })
    cleaned = _clean(raw)
    assert (cleaned["quantity"] < 0).sum() == 1, "returns must be kept"


def test_clean_drops_negative_unit_price():
    raw = pd.DataFrame({
        "invoice_id": ["A", "B"],
        "stock_code": ["X", "Y"],
        "description": ["a", "b"],
        "quantity": [5, 5],
        "invoice_date": ["2011-01-01", "2011-01-02"],
        "unit_price": [1.0, -1.0],
        "customer_id": [1, 2],
        "country": ["UK", "UK"],
    })
    cleaned = _clean(raw)
    assert len(cleaned) == 1


def test_clean_computes_revenue():
    raw = pd.DataFrame({
        "invoice_id": ["A"],
        "stock_code": ["X"],
        "description": ["a"],
        "quantity": [4],
        "invoice_date": ["2011-01-01"],
        "unit_price": [2.5],
        "customer_id": [1],
        "country": ["UK"],
    })
    cleaned = _clean(raw)
    assert cleaned["revenue"].iloc[0] == pytest.approx(10.0)


def test_clean_preserves_internal_column_order():
    raw = pd.DataFrame({
        "invoice_id": ["A"],
        "stock_code": ["X"],
        "description": ["a"],
        "quantity": [1],
        "invoice_date": ["2011-01-01"],
        "unit_price": [1.0],
        "customer_id": [1],
        "country": ["UK"],
    })
    cleaned = _clean(raw)
    # Internal columns must lead the frame; downstream auxiliary columns
    # (e.g. country_lc) follow.
    assert list(cleaned.columns)[: len(INTERNAL_COLUMNS)] == INTERNAL_COLUMNS
