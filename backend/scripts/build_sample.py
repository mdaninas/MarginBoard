"""Build a small sample CSV for quick demos.

Reads `backend/data/raw/online_retail_II.csv` and writes a stratified random
subsample to `backend/data/sample/online_retail_II_sample.csv`. The sample
keeps roughly the same country mix as the source.

Run from the backend directory with the venv active:

    python scripts/build_sample.py [--rows 5000]
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

BACKEND_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BACKEND_DIR / "data" / "raw"
SAMPLE_DIR = BACKEND_DIR / "data" / "sample"

RAW_CANDIDATES = ("online_retail_II.csv", "online_retail_II.xlsx", "online_retail_II.parquet")
SAMPLE_OUT = SAMPLE_DIR / "online_retail_II_sample.csv"


def find_raw() -> Path:
    for name in RAW_CANDIDATES:
        candidate = RAW_DIR / name
        if candidate.exists():
            return candidate
    raise SystemExit(
        f"No raw dataset found in {RAW_DIR}. Place the Online Retail II file "
        f"there first."
    )


def read_raw(path: Path) -> pd.DataFrame:
    if path.suffix.lower() == ".csv":
        return pd.read_csv(path, low_memory=False)
    if path.suffix.lower() in {".xlsx", ".xls"}:
        return pd.read_excel(path)
    return pd.read_parquet(path)


def stratified_sample(df: pd.DataFrame, n_rows: int, seed: int = 42) -> pd.DataFrame:
    if len(df) <= n_rows:
        return df

    country_col = next(
        (c for c in df.columns if c.strip().lower() == "country"), None
    )
    if country_col is None:
        return df.sample(n=n_rows, random_state=seed)

    counts = df[country_col].value_counts(normalize=True)
    parts: list[pd.DataFrame] = []
    for country, share in counts.items():
        per_country = max(1, int(round(n_rows * share)))
        bucket = df[df[country_col] == country]
        parts.append(bucket.sample(n=min(per_country, len(bucket)), random_state=seed))

    return pd.concat(parts).sample(frac=1, random_state=seed).reset_index(drop=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--rows", type=int, default=5000, help="Sample size (default 5000).")
    args = parser.parse_args()

    raw_path = find_raw()
    print(f"Reading {raw_path} …")
    df = read_raw(raw_path)
    print(f"Source rows: {len(df):,}")

    sampled = stratified_sample(df, n_rows=args.rows)
    SAMPLE_DIR.mkdir(parents=True, exist_ok=True)
    sampled.to_csv(SAMPLE_OUT, index=False)
    print(f"Wrote {len(sampled):,} rows to {SAMPLE_OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
