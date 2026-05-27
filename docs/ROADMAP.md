# MarginBoard Roadmap

Living document. Items grouped by intent, not strict timeline.

---

## Phase 4 — Engineering hardening

Targets reviewer signals around production-readiness.

- [ ] **Pre-trained model artifacts.** `ml/train_forecast_model.py` and
      `ml/train_anomaly_model.py` save joblib files to `backend/data/processed/`.
      Inference loads at startup instead of training on first request.
- [ ] **pytest test suite.** ≥ 70% coverage on `services/`. Focus on:
      growth math, date range edges, lag feature construction, risk
      classification, reason-code rules.
- [ ] **GitHub Actions CI.** Lint (`ruff`, `eslint`), type check (`mypy`,
      `tsc --noEmit`), test (`pytest`, `vitest`), build (Next.js).
      Badges in README.
- [ ] **Dockerfile + docker-compose.yml.** Backend image, frontend image,
      shared network. Single `docker compose up`.
- [ ] **Pydantic Settings.** Replace module-level constants
      (`HIGH_THRESHOLD`, `DEMAND_WINDOW_DAYS`, `SAFETY_MULTIPLIER`) with a
      validated settings object loaded from env.
- [ ] **Structured logging.** `structlog` JSON output + request ID middleware.

---

## Phase 5 — Data science depth

Targets DS / MLE reviewer signals.

- [ ] **EDA notebook expanded.** Add cohort retention, basket co-occurrence,
      country-level seasonality, return-rate-by-SKU.
- [ ] **Forecast experimentation notebook.** Compare:
      - Naive (last value, last-week, last-30-day mean)
      - SARIMA
      - GradientBoosting (current)
      - LightGBM
      - Optional: Prophet
      Report MAE / MAPE / RMSE per model on the same chronological split.
- [ ] **Time-series cross-validation.** Replace single 80/20 split with
      `TimeSeriesSplit(n_splits=5)`. Report mean ± std per metric.
- [ ] **Forecast confidence interval.** Quantile gradient boosting or
      bootstrap residuals. Render as a shaded band in the chart.
- [ ] **Anomaly threshold justification.** Notebook with score
      distribution, false-positive sensitivity, threshold sweep table.
- [ ] **Model card.** `docs/MODEL_CARD.md` — intended use, training data,
      metrics, limitations, ethical considerations.

---

## Phase 6 — Production-ish features

Targets full-stack reviewer signals.

- [ ] **PostgreSQL backend.** SQLAlchemy 2.x async + Alembic migrations.
      Drop parquet for production path; keep for local dev.
- [ ] **URL state for filters.** `useSearchParams` so date range survives
      refresh and is shareable.
- [ ] **TanStack Query** on the frontend for caching + retry + stale-while-revalidate.
- [ ] **Pagination** on inventory and transactions tables.
- [ ] **CSV export** for tables.
- [ ] **Authentication demo.** Simple JWT with one demo user.

---

## Phase 7 — Polish

- [ ] Skeleton loaders instead of text loading state.
- [ ] Empty states with context-aware copy + relevant CTA.
- [ ] Favicon + OG image for sharing.
- [ ] Architecture diagram (Mermaid) in README.
- [ ] Demo video / GIF in README.
- [ ] ADRs (`docs/adr/`) for major decisions:
      forecast model choice, simulated-stock approach, hybrid anomaly design.

---

## Out of scope (do not build)

The following stay out of v1 / v2 per the original PRD intent:

- AI chatbot or "AI assistant".
- LLM-generated insights.
- Voice interface.
- Real-time streaming pipeline.
- Multi-tenant SaaS.
- Confirmed fraud classification (requires labeled data this dataset lacks).
- Real inventory system integration (would need a separate ERP source).
