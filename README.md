# MarginBoard

[![backend ci](https://github.com/USER/marginboard-retail-ops/actions/workflows/backend.yml/badge.svg)](https://github.com/USER/marginboard-retail-ops/actions/workflows/backend.yml)
[![frontend ci](https://github.com/USER/marginboard-retail-ops/actions/workflows/frontend.yml/badge.svg)](https://github.com/USER/marginboard-retail-ops/actions/workflows/frontend.yml)
[![python](https://img.shields.io/badge/python-3.11%20%7C%203.13-blue.svg)](https://www.python.org/)
[![code style: ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff)
[![license: mit](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

> Turn retail transactions into revenue, inventory, and risk decisions.

MarginBoard is a full-stack retail operations dashboard built on the
**Online Retail II** dataset (UCI). It surfaces revenue KPIs, a 30-day
revenue forecast, simulated inventory risk, and transaction anomaly
monitoring — with transparent methodology and honest limitations.

<!-- Replace with a real screenshot once captured -->
<p align="center">
  <img src="docs/screenshots/01-overview.png" alt="Overview page" width="800"/>
</p>

---

## Why this project exists

Most "retail dashboard" portfolio projects are either:

1. **Static charts on top of a Kaggle notebook** — no real product surface.
2. **AI-buzzword wrappers** — "AI-powered insights" with no model accountability.

MarginBoard takes the opposite stance: every metric is reproducible from raw
data, every model has a validation window, every assumption is documented,
and the UI is restrained on purpose. The point is to show what a sober,
production-minded analytics product looks like — not to demo flashy AI.

---

## What's inside

| Capability | What it does | What it does NOT do |
|---|---|---|
| Revenue Overview | Total revenue, AOV, units, returns, active customers, with growth vs the previous period of equal length. | Real-time data. The dataset is historical (Dec 2009 – Dec 2011). |
| 30-day Forecast | GradientBoostingRegressor on lag + calendar features. Reports MAE and MAPE on a chronological 20% validation split. | External regressors (holidays, promotions, macro events). |
| Inventory Risk | Estimated demand, deterministic simulated stock per SKU, safety stock, recommended reorder, potential lost revenue, risk level. | Real inventory. Stock is simulated and clearly labeled. |
| Transaction Anomaly Monitoring | Hybrid: rule-based reason codes + IsolationForest score → Low / Medium / High risk. | Fraud confirmation. The dataset has no fraud labels; this is a review aid. |
| Methodology Page | In-app documentation of dataset, cleaning, formulas, model, and limitations. | Black-box "trust me bro" output. |

---

## Tech stack

**Backend** · Python 3.13 · FastAPI · Pandas · NumPy · scikit-learn · PyArrow

**Frontend** · Next.js 14 (App Router) · TypeScript · Tailwind CSS · Recharts

**Data** · Parquet cache built on first run from raw CSV; deterministic and reproducible.

**UI** · Light + dark mode (CSS variables, no `dark:` class spam). Bilingual interface (English + Bahasa Indonesia) via lightweight in-house i18n — no external library. User preference is persisted in `localStorage`.

> Note on currency: values are displayed in **USD notation** for portfolio
> readability. The source dataset is in GBP from a UK retailer; no FX
> conversion is applied. Treat figures as approximate USD-equivalent for
> display purposes only. This is documented in the Methodology page.

---

## Methodology highlights

> Full details on the in-app **Methodology** page and in [`docs/MODEL_CARD.md`](docs/MODEL_CARD.md).

### Revenue
`revenue = quantity × unit_price`. Negative quantities are preserved as
return/cancellation impact, not silently dropped. The growth column on every
KPI compares against an immediately preceding period of equal length.

### Forecasting
- **Aggregation** — Daily revenue, reindexed to a continuous date range
  (missing days filled as zero so lag features stay well-defined).
- **Features** — Day of week, month, week of year, weekend flag, lag 1 day,
  lag 7 day, rolling 7 / 14 / 30 day means.
- **Model** — `GradientBoostingRegressor(n_estimators=300, learning_rate=0.05, max_depth=3, random_state=42)`.
- **Validation** — Chronological 80/20 split. Metrics reported are MAE and
  MAPE on the held-out tail.
- **Inference** — Iterative one-step-ahead for 30 days. Each prediction
  feeds the lag features of the next step.

### Inventory (simulated)
- `estimated_demand = mean(daily units, last 90 days) × 30`
- `safety_stock = std(daily units) × 1.65` (≈ 95% service level)
- `simulated_stock = estimated_demand × coverage_ratio`, where
  `coverage_ratio ∈ [0.3, 2.0]` is derived deterministically from
  `sha256(stock_code)` so the same SKU always gets the same simulated stock.
- `recommended_reorder = max(0, demand + safety_stock − stock)`
- `risk_level` follows the gap rule (Low ≤ 0, Medium ≤ 30% of demand, High otherwise).

### Anomaly monitoring
Hybrid by design:

- **Rules** generate explainable reason codes (extreme quantity, extreme
  unit price, unusually high transaction value, negative quantity,
  cancellation pattern). Thresholds use the 99th percentile of the dataset.
- **IsolationForest** (`contamination=0.02`, 200 trees, trained on a 50K
  random subsample) provides a continuous score.
- The two are combined into a normalized `anomaly_score ∈ [0, 1]`. Risk
  level uses `≥ 0.85` → High, `≥ 0.60` → Medium.

This is **transaction anomaly monitoring**, not fraud detection. There are
no confirmed fraud labels in the source dataset, so the output is a review
aid only.

---

## Limitations (read before forming conclusions)

- **No real-time data.** Dataset is historical (Dec 2009 – Dec 2011).
- **No real stock levels.** Inventory is simulated; coverage ratios are
  deterministic per SKU but not empirically validated against ground truth.
- **No fraud labels.** Anomaly thresholds are heuristic; precision / recall
  cannot be measured without labeled data.
- **Single time series for forecasting.** Product-level forecasts would
  need per-SKU models or hierarchical reconciliation — out of v1 scope.
- **No external regressors.** Holidays, promotions, and macro events are
  not in the model. Real-world accuracy will likely be worse than the
  reported validation MAPE.
- **First-request latency.** Heavy services (forecast, inventory, anomaly)
  build artifacts on first request and cache in memory. A pre-trained
  artifact pipeline is planned (see [ROADMAP](docs/ROADMAP.md)).

---

## Run locally

### Prerequisites
- Python **3.11–3.13** (3.14 has no prebuilt wheels for pandas / sklearn yet)
- Node.js 18+
- The Online Retail II CSV at `backend/data/raw/online_retail_II.csv`
  ([download from UCI](https://archive.ics.uci.edu/dataset/502/online+retail+ii))

### Backend
```powershell
cd backend
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

API docs: <http://localhost:8000/docs>

### Frontend
```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

App: <http://localhost:3000>

### Pre-train artifacts (recommended)
The forecast model, anomaly scorer, and inventory table are precomputed once
and cached so the first HTTP request is fast.

```powershell
cd backend
python -m ml.train_all
```

This writes joblib bundles to `backend/data/processed/artifacts/`. The
service falls back to on-demand training if any artifact is missing, so
this step is optional for first-time runs.

### Quick start with sample data
The full CSV is ~94 MB. For a fast first run, generate a sample:

```powershell
cd backend
python scripts/build_sample.py
```

This writes a 5 000-row stratified subsample to `backend/data/sample/`.

### Run with Docker

```powershell
docker compose up --build
```

Brings up both backend (`:8000`) and frontend (`:3000`). The backend
container mounts `backend/data/raw` and `backend/data/processed` so
artifacts persist between restarts.

### Tests + lint

```powershell
cd backend
pip install -r requirements-dev.txt
pytest         # 50+ unit tests, ~6s
ruff check .
mypy app/ ml/  # informational
```

---

## Repository layout

```
marginboard-retail-ops/
├── README.md
├── LICENSE
├── PRD.md                      # Original product requirements
├── docs/
│   ├── ROADMAP.md              # What's planned next
│   ├── MODEL_CARD.md           # Forecast + anomaly model details
│   └── screenshots/            # README + page-by-page captures
├── notebooks/
│   └── 01_data_exploration.ipynb
├── backend/
│   ├── app/
│   │   ├── routes/             # FastAPI routers per module
│   │   ├── services/           # Business logic + ML
│   │   ├── schemas/            # Pydantic response models
│   │   └── utils/
│   ├── data/
│   │   ├── raw/                # Source CSV (gitignored)
│   │   ├── processed/          # Parquet cache (gitignored)
│   │   └── sample/             # Tiny CSV for demos
│   ├── scripts/
│   └── requirements.txt
└── frontend/
    ├── app/                    # Next.js App Router pages
    ├── components/
    │   ├── layout/             # AppShell, Sidebar, Topbar, PageHeader
    │   ├── cards/              # MetricCard
    │   ├── charts/             # TrendChart, ForecastChart (Recharts)
    │   ├── tables/             # DataTable
    │   ├── filters/            # FilterBar
    │   ├── states/             # Loading / Empty / Error
    │   └── badges/             # RiskBadge
    ├── lib/                    # api client, formatters, cn()
    └── types/                  # Mirrors of backend Pydantic shapes
```

---

## Documentation

| Doc | Purpose |
|-----|---------|
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | What's planned next, prioritized |
| [`docs/MODEL_CARD.md`](docs/MODEL_CARD.md) | Forecast + anomaly model details, limitations, failure modes |
| [`docs/adr/`](docs/adr/) | Architecture Decision Records — *why* the obvious-looking choices were made |
| [`CHANGELOG.md`](CHANGELOG.md) | Versioned history |

## Common dev commands

A `Makefile` is included for the common operations:

```bash
make install-dev   # backend deps
make test          # pytest
make lint          # ruff
make train         # rebuild model artifacts
make serve         # uvicorn dev server
make docker-up     # docker compose up --build
```

---

## License

[MIT](LICENSE).
