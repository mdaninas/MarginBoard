# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning: [SemVer](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Forecast confidence interval (quantile regression or bootstrap residuals).
- API integration tests with `httpx.TestClient`.
- Live demo deployment.

---

## [0.3.0] — 2026-05-27

### Added
- Pydantic Settings for env-driven config (`CORS_ORIGINS`, `LOG_LEVEL`, `LOG_FORMAT`, `ADMIN_TOKEN`, `PREWARM_ON_STARTUP`).
- `structlog` with JSON / console renderers and a request-id middleware.
- FastAPI lifespan startup pre-warms caches so the first request is fast.
- `POST /api/admin/refresh` (bearer-token guarded) to drop in-process caches without restarting.
- Deeper `/health` payload: dataset readiness + per-module artifact presence.
- Forecast experimentation notebook (baselines, SARIMA, GradientBoosting, RandomForest, LightGBM, residual diagnostics, drift simulation).
- Anomaly threshold-sweep notebook with reason-code distribution and top-50 manual review.

### Fixed
- Inventory demand estimate now divides by full window length (90 days) rather than only days with sales — slow-moving SKUs no longer over-estimate.
- Forecast `training_period` in summary reflects the full training range; the last CV fold's window is reported separately as the validation window.
- `customer_id` missing from source dataset now logs a warning instead of silently producing zero active customers.
- Removed redundant `try/except ValueError` blocks from routes that don't accept user date input.
- Pre-computed `country_lc` to avoid per-request casefolding on hot path.

---

## [0.2.0] — 2026-05-26

### Added
- Pre-trained model artifact pipeline (`backend/ml/train_forecast`, `train_inventory`, `train_anomaly`, `train_all`). Services load joblib at startup and fall back to on-demand computation.
- TimeSeriesSplit cross-validation (5 folds) for the forecast; summary reports MAE / MAPE mean ± std.
- pytest suite (53 tests) covering data cleaning, metrics math, risk classification, anomaly rules, and forecast features.
- `requirements-dev.txt` + ruff + mypy via `pyproject.toml`.
- GitHub Actions workflows: backend (lint + test on Python 3.11 and 3.13) + frontend (typecheck + build).
- Dockerfile (multi-stage, non-root) and `docker-compose.yml` for backend + frontend.

### Changed
- Double-checked locking on all service caches — concurrent requests no longer block on first compute.
- `IsolationForest(n_jobs=1)` to avoid Windows / uvicorn-reload deadlocks.
- Forecast iterative inference uses a flat numpy buffer instead of `pd.concat` per step.

---

## [0.1.0] — 2026-05-26

### Added
- Phase 1 data foundation: column standardization, type coercion, revenue calculation, parquet cache.
- Phase 2 overview endpoints: KPI metrics, revenue trend, top products, country performance.
- Phase 2 forecasting / inventory / anomaly / methodology endpoints.
- Phase 3 frontend: Next.js 14 App Router, Tailwind, Recharts.
- Five dashboard pages with loading / empty / error states.
- Dark mode (CSS variables + `ThemeProvider`).
- Bilingual UI (English + Bahasa Indonesia) via lightweight in-house i18n.
- Methodology page sourced from `/api/methodology?lang=`.
