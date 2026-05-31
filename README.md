# MarginBoard

[![backend ci](https://github.com/mdaninas/MarginBoard/actions/workflows/backend.yml/badge.svg)](https://github.com/mdaninas/MarginBoard/actions/workflows/backend.yml)
[![frontend ci](https://github.com/mdaninas/MarginBoard/actions/workflows/frontend.yml/badge.svg)](https://github.com/mdaninas/MarginBoard/actions/workflows/frontend.yml)
[![python 3.11–3.13](https://img.shields.io/badge/python-3.11%E2%80%933.13-blue.svg)](https://www.python.org/)
[![license: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

> Turn historical retail transactions into revenue, customer, inventory, and risk decisions.

MarginBoard is a full-stack retail operations dashboard built on the
**Online Retail II** dataset (UCI) — roughly 1.07M cleaned transactions from a
UK online retailer, Dec 2009 to Dec 2011. It answers the questions a retail ops,
finance, or merchandising team actually asks: how much did we make, where is
revenue heading, who are the best customers, what sells together, which SKUs
carry the business, what might run out, and which transactions deserve a second
look.

The goal was not to build another "AI-powered" dashboard. Every number is
reproducible from the raw data, every model reports a validation window, and
every assumption that can't be backed by the data (simulated stock, anomaly
thresholds) is labelled as such in the UI.

---

## Pages

| Page | What it answers | Method |
|---|---|---|
| Overview | Revenue, orders, AOV, units, returns, active customers; growth vs the previous period of equal length. | Aggregation over the cleaned transaction frame. |
| Forecasting | Where is revenue heading over the next 30 days? | GradientBoostingRegressor on lag + calendar features, validated with 5-fold TimeSeriesSplit. |
| Customers | Who are the most valuable customers, and do they come back? | RFM segmentation + monthly cohort retention. |
| Cross-Sell | What products sell together? | Market basket analysis (FP-Growth), ranked by lift. |
| Products | Which SKUs drive revenue? | ABC classification + Pareto curve. |
| Inventory Risk | Which SKUs might run out? | Demand estimate vs. *simulated* stock cover. |
| Transactions | Which transactions look unusual? | Hybrid rule codes + IsolationForest anomaly score. |

The UI ships in **English and Bahasa Indonesia**, **light and dark**, with the
preference persisted client-side. No chatbot, no LLM-generated "insights" —
the one rule-based note on the Overview page is computed from the period
comparison, not generated.

---

## Tech stack

**Backend** — Python 3.13 · FastAPI · Pandas · NumPy · scikit-learn · mlxtend · PyArrow
**Frontend** — Next.js 14 (App Router) · TypeScript · Tailwind CSS · Recharts
**Tooling** — pytest + coverage · ruff · mypy · pre-commit · GitHub Actions · Docker

Cleaned data is cached as Parquet and trained models are persisted as joblib
artifacts, so only the first start pays the build cost — restarts load from disk.

---

## Methodology, in brief

Full write-up in [`docs/MODEL_CARD.md`](docs/MODEL_CARD.md). The short version:

**Revenue** — `revenue = quantity × unit_price`. Negative quantities are kept as
return/cancellation impact, not silently dropped. Growth compares the selected
period against an immediately preceding window of the same length.

**Forecasting** — Daily revenue, reindexed to a continuous range (missing days
zero-filled so lag features stay well-defined). Features: day of week, month,
week of year, weekend flag, lag-1, lag-7, rolling 7/14/30-day means. Validated
with **5-fold TimeSeriesSplit** — MAPE is reported as mean ± std across folds
because a single split hides how unstable this series actually is (per-fold MAPE
ranges from ~32% to ~84% on this data). The 30-day forecast is generated
iteratively. No external regressors.

**Customers** — RFM scoring into segments (Champions, Loyal, At Risk, …) plus a
cohort-retention matrix by first-purchase month.

**Cross-Sell** — FP-Growth over invoice baskets, pruned to the top 200 SKUs and
`min_support = 0.01`, surfacing rules by lift. Co-occurrence, not causation —
stated in the UI.

**Inventory (simulated)** — The dataset has no stock levels, so stock is
simulated deterministically: `coverage_ratio ∈ [0.3, 2.0]` derived from
`sha256(stock_code)`, so the same SKU always gets the same value. Demand,
safety stock (`std × 1.65`), reorder, and lost-revenue follow from there. Every
stock figure is labelled simulated.

**Transactions** — Hybrid scoring: transparent rule codes (extreme quantity,
extreme unit price, unusually high value, negative quantity, cancellation
pattern) at the 99th percentile, combined with an IsolationForest score into a
normalized 0–1 anomaly score. This is anomaly *monitoring*, not fraud
detection — the dataset has no fraud labels.

---

## Limitations

- The data is historical (Dec 2009 – Dec 2011); nothing here is real-time.
- Stock is simulated and not validated against ground truth.
- No fraud labels, so anomaly precision/recall can't be measured.
- Forecasting is a single business-level series; product-level forecasting is
  out of scope. Real-world accuracy will be worse than the validation MAPE.
- Currency is shown in USD notation for readability; the source is GBP and no FX
  conversion is applied.

---

## Run locally

**Prerequisites** — Python 3.11–3.13, Node 18+, and the Online Retail II CSV at
`backend/data/raw/online_retail_II.csv`
([download from UCI](https://archive.ics.uci.edu/dataset/502/online+retail+ii)).

### Backend

```powershell
cd backend
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

First start builds the Parquet cache and trains + persists the model artifacts
(forecast, inventory, anomaly). Subsequent starts load them from disk. API docs
at <http://localhost:8000/docs>.

### Frontend

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

App at <http://localhost:3000>.

### With Docker

```bash
docker compose up --build
```

---

## Development

```bash
make test     # pytest (backend, ~86% coverage)
make lint     # ruff
make train    # rebuild + persist model artifacts
```

CI runs lint, type check, tests, and the production frontend build on every
push (`.github/workflows/`).

---

## Repository layout

```
MarginBoard/
├── README.md
├── LICENSE
├── Makefile
├── docker-compose.yml
├── docs/
│   ├── MODEL_CARD.md        # forecast / anomaly / basket model details
│   ├── ROADMAP.md
│   └── adr/                 # architecture decision records
├── notebooks/
│   └── 01_data_exploration.ipynb
├── backend/
│   ├── app/
│   │   ├── routes/          # FastAPI routers per module
│   │   ├── services/        # business logic + ML
│   │   ├── schemas/         # Pydantic response models
│   │   ├── utils/
│   │   ├── main.py          # app + startup artifact prewarm
│   │   ├── config.py        # env-driven settings
│   │   └── logging_config.py
│   ├── ml/                  # offline training scripts + artifact paths
│   ├── tests/               # pytest suite
│   ├── data/{raw,processed,sample}/
│   ├── Dockerfile
│   └── requirements.txt
└── frontend/
    ├── app/                 # one route per page
    ├── components/          # layout, primitives, charts, tables
    ├── lib/                 # api client, i18n, theme, formatters
    ├── types/
    └── Dockerfile
```

---

## License

[MIT](LICENSE)
