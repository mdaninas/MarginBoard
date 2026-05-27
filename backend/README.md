# MarginBoard Backend

FastAPI backend that serves processed retail transaction metrics to the MarginBoard
dashboard.

## Setup

Requires **Python 3.11 – 3.13**. The pinned dependency versions (pandas 2.2.x,
scikit-learn 1.5.x, numpy 2.0.x) ship prebuilt wheels for these Pythons.
Python 3.14 currently has no wheels and will try to compile from source —
avoid it.

### Windows (PowerShell)

```powershell
cd backend
py -3.13 -m venv .venv
.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
```

If `Activate.ps1` is blocked, allow it for the current shell only:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### macOS / Linux

```bash
cd backend
python3.13 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

Place the Online Retail II CSV (or XLSX) at:

```
backend/data/raw/online_retail_II.csv
```

The first request will read the raw file, standardize columns, clean the data,
calculate revenue, and cache the result as a parquet file in
`backend/data/processed/`. Subsequent requests load the parquet directly.

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

The first request to `/api/forecasting/*`, `/api/inventory/*`, or
`/api/transactions/*` builds the processed parquet from the raw CSV and
trains the model. Expect 10–60 seconds depending on the machine. Subsequent
requests use the in-process cache.

API is mounted under `/api`. Interactive docs at `http://localhost:8000/docs`.

## Overview Endpoints (Phase 2)

| Method | Path                                  | Description                                  |
|--------|---------------------------------------|----------------------------------------------|
| GET    | `/api/overview/metrics`               | KPI cards + growth vs previous period        |
| GET    | `/api/overview/revenue-trend`         | Daily revenue, orders, units                 |
| GET    | `/api/overview/top-products`          | Top products by revenue                      |
| GET    | `/api/overview/country-performance`   | Revenue breakdown by country                 |

All endpoints accept optional `start` and `end` query parameters (ISO date,
`YYYY-MM-DD`). When omitted, the full dataset range is used. `country` filter is
also supported on every endpoint.

## Data Standardization

Raw column names are mapped to a stable internal schema:

| Raw                         | Internal       |
|-----------------------------|----------------|
| `Invoice` / `InvoiceNo`     | `invoice_id`   |
| `StockCode`                 | `stock_code`   |
| `Description`               | `description`  |
| `Quantity`                  | `quantity`     |
| `InvoiceDate`               | `invoice_date` |
| `Price` / `UnitPrice`       | `unit_price`   |
| `Customer ID` / `CustomerID`| `customer_id`  |
| `Country`                   | `country`      |
| (derived)                   | `revenue`      |

`revenue = quantity * unit_price`. Negative quantities are preserved and treated
as return / cancellation impact (per PRD §17.2).
