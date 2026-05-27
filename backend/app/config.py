"""Application config. Env-driven where it matters, sensible defaults otherwise.

I keep the existing module-level constants exposed because services import
them directly — switching to a settings object without breaking the import
graph would be a bigger refactor than it's worth right now.
"""

from __future__ import annotations

from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BACKEND_DIR / "data"
DEFAULT_RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
SAMPLE_DIR = DATA_DIR / "sample"


class Settings(BaseSettings):
    """Env-loaded config. Prefix: `MB_`. Reads .env if present."""

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        env_prefix="",
        extra="ignore",
    )

    cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"],
        description="Allowed origins for CORS. Comma-separated in env.",
    )
    raw_data_dir: Path = Field(default=DEFAULT_RAW_DIR)
    log_level: str = Field(default="INFO")
    log_format: str = Field(default="console", description="'console' or 'json'.")
    admin_token: str | None = Field(
        default=None,
        description="Bearer token for /admin/* endpoints. Disabled when None.",
    )
    prewarm_on_startup: bool = Field(
        default=True,
        description="If True, load cached artifacts during startup so the first request is fast.",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_csv(cls, v: object) -> list[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v  # type: ignore[return-value]


settings = Settings()


# ---- Backward-compatible module constants -----------------------------------

RAW_DIR: Path = settings.raw_data_dir
CORS_ORIGINS: tuple[str, ...] = tuple(settings.cors_origins)
API_PREFIX = "/api"

RAW_DATASET_CANDIDATES = (
    "online_retail_II.csv",
    "online_retail_II.xlsx",
    "online_retail_II.parquet",
)

PROCESSED_DATASET_FILE = PROCESSED_DIR / "transactions.parquet"
