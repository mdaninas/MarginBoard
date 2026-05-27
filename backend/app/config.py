import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BACKEND_DIR / "data"
RAW_DIR = Path(os.getenv("RAW_DATA_DIR", DATA_DIR / "raw"))
PROCESSED_DIR = DATA_DIR / "processed"
SAMPLE_DIR = DATA_DIR / "sample"

RAW_DATASET_CANDIDATES = (
    "online_retail_II.csv",
    "online_retail_II.xlsx",
    "online_retail_II.parquet",
)

PROCESSED_DATASET_FILE = PROCESSED_DIR / "transactions.parquet"

API_PREFIX = "/api"


def _parse_cors_origins() -> tuple[str, ...]:
    raw = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    return tuple(origin.strip() for origin in raw.split(",") if origin.strip())


CORS_ORIGINS = _parse_cors_origins()
