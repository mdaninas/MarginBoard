"""Load, standardize, and clean the Online Retail II dataset.

Responsibilities
----------------
* Locate a raw dataset file in `backend/data/raw/`.
* Map varying source column names to a stable internal schema.
* Coerce data types and drop rows the rest of the app cannot reason about.
* Calculate `revenue = quantity * unit_price`.
* Persist the cleaned frame as parquet under `backend/data/processed/` so
  subsequent process starts skip the heavy CSV parse.
* Hold the cleaned frame in an in-process cache so request handlers do not
  re-read the parquet on every call.

Negative quantities are intentionally preserved — they represent returns or
cancellations and are handled downstream (see PRD §14, §17.2).
"""

from __future__ import annotations

import logging
from pathlib import Path
from threading import Lock

import pandas as pd

from app.config import (
    PROCESSED_DATASET_FILE,
    PROCESSED_DIR,
    RAW_DATASET_CANDIDATES,
    RAW_DIR,
)

logger = logging.getLogger(__name__)

INTERNAL_COLUMNS = [
    "invoice_id",
    "stock_code",
    "description",
    "quantity",
    "invoice_date",
    "unit_price",
    "customer_id",
    "country",
    "revenue",
]

# Maps every accepted source column name to its internal name.
COLUMN_ALIASES: dict[str, str] = {
    "invoice": "invoice_id",
    "invoiceno": "invoice_id",
    "stockcode": "stock_code",
    "description": "description",
    "quantity": "quantity",
    "invoicedate": "invoice_date",
    "price": "unit_price",
    "unitprice": "unit_price",
    "customer id": "customer_id",
    "customerid": "customer_id",
    "country": "country",
}


_cache_lock = Lock()
_cached_frame: pd.DataFrame | None = None


def _normalize_key(name: str) -> str:
    return name.strip().lower()


def _find_raw_file() -> Path:
    for candidate in RAW_DATASET_CANDIDATES:
        path = RAW_DIR / candidate
        if path.exists():
            return path
    raise FileNotFoundError(
        f"No raw dataset found in {RAW_DIR}. Expected one of: "
        f"{', '.join(RAW_DATASET_CANDIDATES)}"
    )


def _read_raw(path: Path) -> pd.DataFrame:
    suffix = path.suffix.lower()
    if suffix == ".csv":
        return pd.read_csv(path, dtype={"Customer ID": "Float64"}, low_memory=False)
    if suffix in {".xlsx", ".xls"}:
        return pd.read_excel(path)
    if suffix == ".parquet":
        return pd.read_parquet(path)
    raise ValueError(f"Unsupported raw dataset format: {suffix}")


def _standardize_columns(df: pd.DataFrame) -> pd.DataFrame:
    rename_map: dict[str, str] = {}
    for source in df.columns:
        key = _normalize_key(str(source))
        internal = COLUMN_ALIASES.get(key)
        if internal is not None:
            rename_map[source] = internal

    df = df.rename(columns=rename_map)

    missing = [
        col
        for col in (
            "invoice_id",
            "stock_code",
            "description",
            "quantity",
            "invoice_date",
            "unit_price",
            "country",
        )
        if col not in df.columns
    ]
    if missing:
        raise ValueError(
            "Raw dataset is missing required columns after standardization: "
            f"{missing}. Got columns: {list(df.columns)}"
        )

    if "customer_id" not in df.columns:
        df["customer_id"] = pd.NA

    return df


def _clean(df: pd.DataFrame) -> pd.DataFrame:
    df["invoice_id"] = df["invoice_id"].astype("string").str.strip()
    df["stock_code"] = df["stock_code"].astype("string").str.strip()
    df["description"] = (
        df["description"].astype("string").str.strip().fillna("(no description)")
    )
    df["country"] = df["country"].astype("string").str.strip()

    df["invoice_date"] = pd.to_datetime(df["invoice_date"], errors="coerce")
    df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce")
    df["unit_price"] = pd.to_numeric(df["unit_price"], errors="coerce")
    df["customer_id"] = pd.to_numeric(df["customer_id"], errors="coerce").astype(
        "Int64"
    )

    before = len(df)
    df = df.dropna(subset=["invoice_id", "stock_code", "invoice_date", "quantity", "unit_price"])

    # Drop rows with negative unit_price (data entry errors / adjustments without
    # meaningful revenue). Zero-priced rows are kept — they contribute zero
    # revenue and do not skew aggregates.
    df = df[df["unit_price"] >= 0]
    dropped = before - len(df)
    if dropped:
        logger.info("Dropped %s rows during cleaning (invalid date/qty/price).", dropped)

    df["revenue"] = df["quantity"].astype(float) * df["unit_price"].astype(float)

    # Stable ordering helps downstream operations and parquet compression.
    df = df.sort_values("invoice_date").reset_index(drop=True)
    return df[INTERNAL_COLUMNS]


def _build_processed() -> pd.DataFrame:
    raw_path = _find_raw_file()
    logger.info("Building processed dataset from %s", raw_path)
    df = _read_raw(raw_path)
    df = _standardize_columns(df)
    df = _clean(df)

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    df.to_parquet(PROCESSED_DATASET_FILE, index=False)
    logger.info(
        "Processed dataset saved to %s (%s rows).",
        PROCESSED_DATASET_FILE,
        len(df),
    )
    return df


def load_transactions(force_rebuild: bool = False) -> pd.DataFrame:
    """Return the cleaned transactions frame.

    Uses an in-process cache after the first load. If the processed parquet file
    exists and `force_rebuild` is False, it is loaded directly. Otherwise the
    raw file is parsed end-to-end.
    """
    global _cached_frame

    with _cache_lock:
        if _cached_frame is not None and not force_rebuild:
            return _cached_frame

        if PROCESSED_DATASET_FILE.exists() and not force_rebuild:
            logger.info("Loading processed dataset from %s", PROCESSED_DATASET_FILE)
            df = pd.read_parquet(PROCESSED_DATASET_FILE)
        else:
            df = _build_processed()

        _cached_frame = df
        return _cached_frame


def reset_cache() -> None:
    """Drop the in-process cache. Mostly useful for tests."""
    global _cached_frame
    with _cache_lock:
        _cached_frame = None
