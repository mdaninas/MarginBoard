# MarginBoard — Product Requirements Document

## 1. Project Identity

### Project Name

**MarginBoard**

### Repository Name

`marginboard-retail-ops`

### Product Type

Full-stack retail operations dashboard.

### One-Line Description

MarginBoard is a full-stack retail operations dashboard that transforms historical retail transaction data into revenue insights, demand forecasts, inventory risk indicators, and transaction anomaly monitoring.

### Tagline

Turn retail transactions into revenue, inventory, and risk decisions.

### Project Positioning

MarginBoard is not intended to be a generic AI dashboard, chatbot, or notebook-only machine learning project. It should feel like a serious B2B SaaS-style analytics product that could realistically be used by a retail operations, finance, or merchandising team.

The project should communicate that the builder understands:

- Data analytics
- Business metrics
- Machine learning basics
- Full-stack application structure
- Product thinking
- Clean UI/UX
- Realistic assumptions and limitations

---

## 2. Product Vision

MarginBoard helps retail teams understand business performance from transaction data.

The application should answer practical operational questions:

- How much revenue did the business generate?
- Which products drive the most revenue?
- Is revenue trending up or down?
- What might revenue look like over the next 30 days?
- Which products may be at risk of stock shortage?
- Which transactions look unusual and deserve review?
- What assumptions were made in the analysis?

The product should be polished enough to serve as a portfolio project for HR, recruiters, and technical interviewers.

---

## 3. Core Principle

The most important principle of this project:

> Build a believable data product, not an AI-generated demo.

MarginBoard should avoid signs of AI slop:

- No unnecessary chatbot.
- No fake “AI assistant”.
- No excessive gradients.
- No fake real-time alerts.
- No overclaiming.
- No vague “powered by AI” language.
- No generic filler text.
- No features that do not connect to the dataset.
- No claims of confirmed fraud detection.
- No claims of real inventory accuracy when inventory data is simulated.

The application should feel restrained, useful, and explainable.

---

## 4. Target Audience

### Primary Audience

This project is designed as a portfolio project to impress:

- HR recruiters
- Technical recruiters
- Hiring managers
- Data analyst reviewers
- Data scientist reviewers
- Junior ML engineer reviewers
- Full-stack developer reviewers
- Business intelligence reviewers

### Intended Hiring Signal

The project should signal that the candidate can:

- Turn raw data into a working product.
- Build a clean dashboard, not just a notebook.
- Explain business logic and model assumptions.
- Work with frontend, backend, and data pipelines.
- Understand realistic product scope.
- Deliver a polished portfolio-ready application.

---

## 5. Target User Persona

### Persona 1 — Retail Operations Manager

**Goal:** Monitor daily business performance and identify operational risks.

Needs:

- Revenue overview
- Product performance
- Country or market breakdown
- Inventory risk indicator
- Unusual transaction review

### Persona 2 — Finance / Business Analyst

**Goal:** Understand revenue patterns and forecast near-term performance.

Needs:

- Revenue trend
- Average order value
- Transaction volume
- Forecast accuracy
- Growth comparison

### Persona 3 — Portfolio Reviewer

**Goal:** Quickly understand the quality of the project.

Needs:

- Clean live demo
- Clear README
- Professional UI
- Transparent methodology
- Explainable model outputs
- Clear limitations

---

## 6. Dataset

### Primary Dataset

Use:

**Online Retail II UCI**

### Dataset Role

This dataset is used as the single source of truth for MarginBoard v1.

The dataset supports:

- Revenue analysis
- Product performance
- Country performance
- Time-series forecasting
- Return / cancellation monitoring
- Product demand estimation
- Simulated inventory risk
- Transaction anomaly monitoring

### Expected Columns

The dataset is expected to contain fields similar to:

| Column | Description |
|---|---|
| `Invoice` or `InvoiceNo` | Invoice or transaction identifier |
| `StockCode` | Product code |
| `Description` | Product name or description |
| `Quantity` | Number of units purchased |
| `InvoiceDate` | Transaction timestamp |
| `Price` or `UnitPrice` | Unit price |
| `Customer ID` or `CustomerID` | Customer identifier |
| `Country` | Customer country |

The implementation should support common variations of column names, especially:

- `Invoice` vs `InvoiceNo`
- `Price` vs `UnitPrice`
- `Customer ID` vs `CustomerID`

### Important Dataset Assumptions

The dataset does not include real current stock levels.

Therefore:

- Inventory risk should be simulated.
- Simulated inventory must be clearly labeled.
- The methodology page must explain that stock values are estimated or simulated.

The dataset does not include confirmed fraud labels.

Therefore:

- The product must not claim fraud detection.
- The feature should be called **Transaction Anomaly Monitoring**.
- The system may flag unusual transactions for review, but not classify them as confirmed fraud.

---

## 7. Product Scope

### Version 1 Scope

MarginBoard v1 should include five main pages:

1. Overview
2. Forecasting
3. Inventory Risk
4. Transactions
5. Methodology

### In Scope

The following features are required:

- Clean dashboard layout
- Revenue KPI cards
- Revenue trend chart
- Product performance table
- Country performance breakdown
- 30-day revenue forecast
- Forecast model metrics
- Simulated inventory risk table
- Recommended reorder quantity
- Potential lost revenue estimate
- Transaction anomaly monitoring
- Anomaly score
- Risk level
- Reason code
- Methodology documentation inside the app
- Responsive UI
- Loading states
- Empty states
- Error states
- README-ready architecture
- Clean folder structure

### Out of Scope for Version 1

Do not implement these in v1:

- AI chatbot
- AI assistant
- Voice interface
- Real-time streaming
- Payment integration
- User billing
- Multi-tenant SaaS system
- Complex authentication
- Confirmed fraud classification
- Real inventory system integration
- Overly animated landing page
- Heavy LLM-generated insights
- PDF export, unless core app is already complete

### Optional for Version 1.1

These can be added later after the core app works:

- Export CSV
- Authentication demo
- PDF report export
- Customer segmentation
- Scenario simulator
- Model retraining button
- PostgreSQL production database
- Dockerized deployment
- Unit tests
- CI/CD

---

## 8. Product Goals

### Goal 1 — Make Transaction Data Understandable

The app should transform raw transactions into clear business metrics.

Success criteria:

- User can see total revenue.
- User can see total orders.
- User can see average order value.
- User can see units sold.
- User can filter by date range.
- User can identify top products.

### Goal 2 — Provide Near-Term Forecasting

The app should provide a 30-day revenue forecast.

Success criteria:

- Forecast chart displays historical revenue and future forecast.
- Forecast includes model metrics.
- Forecast methodology is documented.
- The app does not overclaim accuracy.

### Goal 3 — Estimate Inventory Risk

The app should estimate which products may need restocking.

Success criteria:

- Product-level demand is calculated.
- Simulated stock is generated.
- Recommended reorder quantity is shown.
- Potential lost revenue is estimated.
- All simulated values are clearly labeled.

### Goal 4 — Surface Unusual Transactions

The app should flag transactions that look unusual.

Success criteria:

- Transactions have anomaly scores.
- Risk levels are visible.
- Reason codes explain why a transaction is flagged.
- The feature is presented as anomaly monitoring, not confirmed fraud detection.

### Goal 5 — Look Premium and Portfolio-Ready

The app should look like a serious B2B dashboard.

Success criteria:

- Clean light-mode UI.
- Consistent spacing.
- Professional typography.
- No clutter.
- No AI-slop visual style.
- No generic placeholder text.
- Screenshots look good in a GitHub README.

---

## 9. Non-Goals

MarginBoard is not:

- A production-ready retail ERP system.
- A confirmed fraud detection system.
- A real inventory management system.
- A financial auditing tool.
- A chatbot product.
- A generic AI wrapper.
- A Power BI clone.
- A Kaggle notebook with a UI pasted on top.

---

## 10. Recommended Tech Stack

### Frontend

Use:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts

Recommended frontend structure:

```txt
frontend/
├── app/
│   ├── page.tsx
│   ├── overview/
│   ├── forecasting/
│   ├── inventory/
│   ├── transactions/
│   └── methodology/
├── components/
│   ├── layout/
│   ├── cards/
│   ├── charts/
│   ├── tables/
│   ├── filters/
│   └── ui/
├── lib/
├── types/
└── package.json
```

### Backend

Use:

- FastAPI
- Python
- Pandas
- Scikit-learn
- XGBoost or LightGBM
- Joblib

Recommended backend structure:

```txt
backend/
├── app/
│   ├── main.py
│   ├── routes/
│   │   ├── overview.py
│   │   ├── forecasting.py
│   │   ├── inventory.py
│   │   ├── transactions.py
│   │   └── methodology.py
│   ├── services/
│   │   ├── data_service.py
│   │   ├── metrics_service.py
│   │   ├── forecast_service.py
│   │   ├── inventory_service.py
│   │   └── anomaly_service.py
│   ├── schemas/
│   └── utils/
├── ml/
│   ├── train_forecast_model.py
│   ├── train_anomaly_model.py
│   └── inference.py
├── data/
│   ├── raw/
│   ├── processed/
│   └── sample/
└── requirements.txt
```

### Database

For v1:

- SQLite is acceptable.
- CSV/parquet processed files are acceptable for initial MVP.

For v1.1:

- PostgreSQL can be added.

The system should be structured so migration from SQLite or processed files to PostgreSQL is possible later.

---

## 11. Visual Design Requirements

### Visual Direction

MarginBoard should use a clean premium B2B SaaS style.

The UI should feel similar in quality to:

- Linear
- Stripe dashboard
- Vercel dashboard
- Attio
- Modern analytics tools

It should not look like:

- A student assignment dashboard
- A flashy crypto dashboard
- An AI-generated landing page
- A PowerPoint-style dashboard
- A dark cyberpunk dashboard

### Preferred Theme

Use a **light mode premium dashboard**.

### Color Palette

Use the following color direction:

| Purpose | Color |
|---|---|
| Background | `#F8FAFC` |
| Surface / Card | `#FFFFFF` |
| Primary Text | `#0F172A` |
| Muted Text | `#64748B` |
| Border | `#E2E8F0` |
| Primary Accent | `#2563EB` |
| Success | `#16A34A` |
| Warning | `#D97706` |
| Danger | `#DC2626` |

### Typography

Use:

- Inter
- Geist
- or a similar clean sans-serif font

### UI Rules

- Use consistent spacing.
- Use subtle borders.
- Use minimal shadows.
- Avoid large gradients.
- Avoid emoji-heavy UI.
- Avoid excessive animation.
- Keep charts readable.
- Keep tables clean.
- Show clear labels and units.
- Avoid fake “AI magic” language.

---

## 12. Information Architecture

### Main Navigation

Sidebar navigation should include:

1. Overview
2. Forecasting
3. Inventory Risk
4. Transactions
5. Methodology

### Global Header

The top section should include:

- Page title
- Short page description
- Date range filter
- Country filter
- Optional product/category filter

### Page Layout Pattern

Each page should follow a consistent structure:

```txt
Page title
Short description
Filters
KPI cards
Main chart / table
Supporting chart / table
Insight or notes panel
```

---

## 13. Page Requirements

### 13.1 Overview Page

#### Purpose

Give the user a high-level view of retail performance.

#### Required Components

##### KPI Cards

Show:

- Total Revenue
- Total Orders
- Average Order Value
- Units Sold
- Return / Cancellation Count
- Active Customers

Each KPI should ideally include:

- Current value
- Comparison to previous period
- Small positive/negative indicator

Example:

```txt
Total Revenue
£428,920
+8.4% vs previous period
```

##### Revenue Trend Chart

Show daily or weekly revenue over time.

Requirements:

- Use a clean line chart.
- Include tooltip.
- Allow date filter.
- Show revenue in proper currency format.

##### Top Products Table

Show top products by revenue.

Columns:

- Product
- Stock Code
- Units Sold
- Revenue
- Average Price
- Order Count

##### Country Performance

Show revenue by country.

Can be:

- Bar chart
- Table
- Horizontal ranking

##### Business Notes Panel

Add a small rule-based insight panel.

Example:

```txt
Revenue increased compared to the previous period, driven mainly by higher order volume.
```

Do not use fake LLM output.

The insight should be generated from simple business logic.

---

### 13.2 Forecasting Page

#### Purpose

Show a 30-day revenue forecast based on historical transactions.

#### Required Components

##### Forecast Chart

Show:

- Historical revenue
- Forecasted revenue
- Forecast horizon: 30 days

Optional:

- Confidence band if available
- Training/validation split marker

##### Forecast KPI Cards

Show:

- Forecasted 30-day revenue
- Expected growth vs previous 30 days
- MAE
- MAPE
- Forecast horizon
- Last training period

##### Model Information Panel

Show:

- Model type
- Features used
- Training period
- Validation period
- Metrics
- Limitations

Example:

```txt
Model: Gradient Boosting Regressor
Forecast horizon: 30 days
Validation MAPE: 12.8%
Validation MAE: £1,240
```

#### Forecasting Method

Recommended initial method:

- Aggregate revenue by day.
- Create date-based features.
- Use lag features and rolling averages.
- Train a regression model.
- Predict next 30 days iteratively or using generated future features.

Potential models:

- XGBoost Regressor
- LightGBM Regressor
- Random Forest Regressor
- Gradient Boosting Regressor

For v1, prefer a model that is easy to explain and stable.

#### Suggested Features

Use:

- Day of week
- Month
- Week of year
- Is weekend
- Lag 1 day revenue
- Lag 7 day revenue
- Rolling 7-day average
- Rolling 14-day average
- Rolling 30-day average

#### Required Limitations

The page must explain:

- Forecasts are based on historical data only.
- External factors are not included.
- The model is not production-grade.
- Product-level sparse data may reduce accuracy.

---

### 13.3 Inventory Risk Page

#### Purpose

Estimate which products may be at risk of stock shortage based on historical demand.

#### Important Note

The Online Retail II dataset does not include actual current stock.

Therefore, this page must label stock as:

```txt
Simulated Stock
```

Do not present simulated stock as real inventory.

#### Required Components

##### Inventory Risk KPI Cards

Show:

- Products at Risk
- Estimated Lost Revenue
- Recommended Reorder Units
- High-Risk Products
- Medium-Risk Products

##### Inventory Risk Table

Columns:

- Product
- Stock Code
- Estimated Demand
- Simulated Stock
- Safety Stock
- Recommended Reorder Quantity
- Potential Lost Revenue
- Risk Level

##### Risk Levels

Use:

- Low
- Medium
- High

Suggested logic:

```txt
stock_gap = estimated_demand + safety_stock - simulated_stock

if stock_gap <= 0:
    risk = "Low"
elif stock_gap <= estimated_demand * 0.3:
    risk = "Medium"
else:
    risk = "High"
```

#### Inventory Logic

Recommended calculations:

```txt
estimated_demand = average daily units sold * forecast horizon
safety_stock = standard deviation of daily demand * safety multiplier
recommended_reorder = max(0, estimated_demand + safety_stock - simulated_stock)
potential_lost_revenue = max(0, estimated_demand - simulated_stock) * average_unit_price
```

#### Simulated Stock Logic

Because current stock is not available, simulate it transparently.

Possible simple approach:

```txt
simulated_stock = random or rule-based value derived from historical demand
```

Better approach:

```txt
simulated_stock = estimated_demand * stock_coverage_ratio
```

Where `stock_coverage_ratio` varies by product to simulate understock or overstock.

Example:

```txt
stock_coverage_ratio:
- 0.3 to 0.7 for high-risk products
- 0.8 to 1.2 for medium-risk products
- 1.3 to 2.0 for low-risk products
```

The methodology page must explain this.

---

### 13.4 Transactions Page

#### Purpose

Surface unusual transactions for review.

#### Naming Rule

Use:

```txt
Transaction Anomaly Monitoring
```

Do not use:

```txt
Fraud Detection
```

Unless a dedicated fraud-labeled dataset is added in a future version.

#### Required Components

##### Transaction Risk KPI Cards

Show:

- Total Transactions Reviewed
- Flagged Transactions
- High-Risk Transactions
- Return / Cancellation Count
- Average Anomaly Score

##### Anomaly Table

Columns:

- Invoice
- Date
- Product
- Country
- Quantity
- Unit Price
- Transaction Value
- Risk Level
- Anomaly Score
- Reason Code

##### Reason Codes

Each flagged transaction must include one or more reason codes.

Possible reason codes:

- Unusually high transaction value
- Unusually high quantity
- Negative quantity / return
- Extreme unit price
- Invoice cancellation pattern
- Product demand outlier
- Country-level revenue outlier

#### Anomaly Detection Method

Use a transparent approach.

Options:

1. Rule-based scoring
2. Isolation Forest
3. Hybrid: rule-based reason codes + model score

Recommended for v1:

```txt
Use a hybrid approach.
```

Reason:

- Rule-based codes make outputs explainable.
- Isolation Forest provides anomaly scoring.
- The product remains understandable.

#### Risk Level Mapping

Example:

```txt
if anomaly_score >= 0.85:
    risk = "High"
elif anomaly_score >= 0.60:
    risk = "Medium"
else:
    risk = "Low"
```

The exact threshold can be adjusted after data inspection.

#### Important Disclaimer

Add this text somewhere in the Methodology page:

```txt
Transaction anomaly monitoring identifies unusual transaction patterns based on historical data. It does not confirm fraud and should be treated as a review aid only.
```

---

### 13.5 Methodology Page

#### Purpose

Show how the project works and prove that it is not a black-box demo.

This page is very important for portfolio quality.

#### Required Sections

##### Dataset

Explain:

- Dataset name
- Dataset purpose
- Key columns
- Time period if available
- What the dataset does and does not include

##### Data Cleaning

Explain cleaning steps:

- Standardize column names.
- Convert invoice date to datetime.
- Handle missing customer IDs.
- Calculate revenue.
- Identify returns or cancellations.
- Remove or handle invalid prices.
- Handle negative quantities.
- Aggregate daily revenue for forecasting.

##### Revenue Calculation

Formula:

```txt
Revenue = Quantity × Unit Price
```

Important:

- Negative quantity may produce negative revenue.
- Negative revenue should be interpreted as return/cancellation impact.
- The approach must be documented.

##### Forecasting

Explain:

- Aggregation level
- Model type
- Features used
- Evaluation metrics
- Forecast horizon
- Limitations

##### Inventory Risk

Explain:

- Dataset does not include actual stock.
- Stock is simulated.
- Demand is estimated from historical sales.
- Safety stock is calculated from demand variation.
- Reorder recommendation is estimated.

##### Transaction Monitoring

Explain:

- Dataset does not include fraud labels.
- The app identifies anomalies only.
- Anomalies are not confirmed fraud.
- Reason codes are generated using transparent rules.

##### Limitations

Must include:

- No real-time data.
- No actual stock level.
- No confirmed fraud label.
- Forecast does not include external factors.
- Model accuracy may vary.
- Dataset is historical and not current.

---

## 14. Data Processing Requirements

### 14.1 Raw Data Ingestion

The backend should support loading raw dataset files from:

```txt
backend/data/raw/
```

Acceptable formats:

- CSV
- XLSX
- Parquet

The processed version should be saved to:

```txt
backend/data/processed/
```

### 14.2 Column Standardization

Standardize columns internally to:

```txt
invoice_id
stock_code
description
quantity
invoice_date
unit_price
customer_id
country
revenue
```

### 14.3 Revenue Calculation

```txt
revenue = quantity * unit_price
```

### 14.4 Invoice-Level Aggregation

For some metrics, aggregate by invoice:

```txt
invoice_revenue = sum(revenue)
invoice_quantity = sum(quantity)
invoice_item_count = count(items)
```

### 14.5 Daily Revenue Aggregation

For forecasting:

```txt
daily_revenue = sum(revenue by invoice_date day)
daily_orders = count(unique invoices)
daily_units = sum(quantity)
daily_aov = revenue / orders
```

### 14.6 Product-Level Aggregation

For product and inventory pages:

```txt
product_revenue = sum(revenue)
product_units = sum(quantity)
product_order_count = count(unique invoices)
average_unit_price = mean(unit_price)
daily_demand = daily quantity sold per product
```

---

## 15. API Requirements

The backend should expose clean API endpoints.

Base URL:

```txt
/api
```

### 15.1 Overview Endpoints

#### `GET /api/overview/metrics`

Returns KPI metrics.

Response example:

```json
{
  "total_revenue": 428920.52,
  "total_orders": 18240,
  "average_order_value": 23.51,
  "units_sold": 384200,
  "return_count": 1240,
  "active_customers": 3920,
  "revenue_growth_pct": 8.4,
  "orders_growth_pct": 5.1
}
```

#### `GET /api/overview/revenue-trend`

Returns time-series revenue.

Response example:

```json
[
  {
    "date": "2011-01-01",
    "revenue": 12450.2,
    "orders": 280
  }
]
```

#### `GET /api/overview/top-products`

Returns ranked products.

Response example:

```json
[
  {
    "stock_code": "85123A",
    "description": "WHITE HANGING HEART T-LIGHT HOLDER",
    "units_sold": 1200,
    "revenue": 15240.5,
    "order_count": 320
  }
]
```

#### `GET /api/overview/country-performance`

Returns country-level metrics.

---

### 15.2 Forecasting Endpoints

#### `GET /api/forecasting/summary`

Returns forecast summary.

Example:

```json
{
  "forecast_horizon_days": 30,
  "forecasted_revenue": 128400.5,
  "previous_30_day_revenue": 117200.1,
  "expected_growth_pct": 9.56,
  "model": "GradientBoostingRegressor",
  "mae": 1240.2,
  "mape": 12.8
}
```

#### `GET /api/forecasting/timeseries`

Returns historical + forecast data.

Example:

```json
[
  {
    "date": "2011-12-01",
    "type": "historical",
    "revenue": 15200.4
  },
  {
    "date": "2011-12-10",
    "type": "forecast",
    "revenue": 16800.7
  }
]
```

---

### 15.3 Inventory Endpoints

#### `GET /api/inventory/summary`

Returns inventory risk summary.

Example:

```json
{
  "products_at_risk": 42,
  "high_risk_products": 12,
  "medium_risk_products": 30,
  "estimated_lost_revenue": 84200.5,
  "recommended_reorder_units": 18200
}
```

#### `GET /api/inventory/products`

Returns product inventory risk table.

Example:

```json
[
  {
    "stock_code": "85123A",
    "description": "WHITE HANGING HEART T-LIGHT HOLDER",
    "estimated_demand": 320,
    "simulated_stock": 120,
    "safety_stock": 40,
    "recommended_reorder": 240,
    "potential_lost_revenue": 8200.5,
    "risk_level": "High"
  }
]
```

---

### 15.4 Transaction Endpoints

#### `GET /api/transactions/summary`

Returns transaction monitoring summary.

Example:

```json
{
  "transactions_reviewed": 18240,
  "flagged_transactions": 420,
  "high_risk_transactions": 60,
  "average_anomaly_score": 0.31,
  "return_count": 1240
}
```

#### `GET /api/transactions/anomalies`

Returns anomaly table.

Example:

```json
[
  {
    "invoice_id": "536365",
    "date": "2011-01-02",
    "stock_code": "85123A",
    "description": "WHITE HANGING HEART T-LIGHT HOLDER",
    "country": "United Kingdom",
    "quantity": 1200,
    "unit_price": 2.55,
    "transaction_value": 3060.0,
    "risk_level": "High",
    "anomaly_score": 0.91,
    "reason_codes": [
      "Unusually high quantity",
      "Unusually high transaction value"
    ]
  }
]
```

---

### 15.5 Methodology Endpoint

#### `GET /api/methodology`

Returns methodology metadata used by the app.

This endpoint is optional. Static frontend content is acceptable.

---

## 16. Frontend Requirements

### 16.1 Components

Required reusable components:

```txt
AppShell
Sidebar
Topbar
PageHeader
MetricCard
TrendChart
ForecastChart
DataTable
RiskBadge
FilterBar
EmptyState
LoadingState
ErrorState
MethodologySection
```

### 16.2 State Handling

Each page must handle:

- Loading state
- API error state
- Empty data state
- Successful data state

### 16.3 Formatting

Currency:

```txt
£428,920
```

Percent:

```txt
+8.4%
```

Dates:

```txt
Jan 12, 2011
```

Large numbers:

```txt
384.2K
```

### 16.4 Responsive Design

The app should be usable on:

- Desktop
- Laptop
- Tablet

Mobile support is nice to have but not the main priority.

---

## 17. Business Logic Requirements

### 17.1 Previous Period Comparison

For selected date range:

```txt
current_period = selected date range
previous_period = same length immediately before current period
```

Calculate:

```txt
growth_pct = ((current_value - previous_value) / previous_value) * 100
```

If previous value is zero, handle safely.

### 17.2 Return / Cancellation Logic

Negative quantity should be treated as return or cancellation indicator.

Do not silently delete negative quantities.

The app may show:

- Gross sales
- Return impact
- Net revenue

At minimum, document how negative quantities are handled.

### 17.3 Revenue

Main revenue formula:

```txt
revenue = quantity * unit_price
```

If quantity is negative, revenue becomes negative.

This is acceptable if clearly explained.

---

## 18. UX Copy Requirements

Use clear, professional language.

Avoid:

```txt
AI-powered magic
Revolutionary insights
Next-gen AI engine
Unlock hidden potential with AI
Fraud detected
Guaranteed forecast
```

Prefer:

```txt
Revenue forecast
Transaction anomaly
Inventory risk
Estimated demand
Simulated stock
Model output
Review recommended
```

### Example Page Descriptions

Overview:

```txt
Track revenue, order volume, product performance, and market distribution from historical retail transactions.
```

Forecasting:

```txt
Review historical revenue patterns and a 30-day forecast generated from transaction-level sales data.
```

Inventory Risk:

```txt
Estimate product-level stock risk using historical demand patterns and simulated inventory levels.
```

Transactions:

```txt
Surface unusual transaction patterns for review using transparent anomaly scoring and reason codes.
```

Methodology:

```txt
Understand how the dataset was processed, how metrics were calculated, and where assumptions were made.
```

---

## 19. Portfolio Requirements

The project must be presentable on GitHub.

### 19.1 README Requirements

The README should include:

- Project title
- Screenshot
- Live demo link
- Problem statement
- Features
- Tech stack
- Dataset
- Architecture
- Methodology summary
- How to run locally
- Folder structure
- Limitations
- Future improvements

### 19.2 Screenshots

Include screenshots of:

- Overview page
- Forecasting page
- Inventory Risk page
- Transactions page
- Methodology page

Store screenshots in:

```txt
docs/screenshots/
```

### 19.3 Demo Data

If the full dataset is too large, include a smaller sample file.

Store sample data in:

```txt
backend/data/sample/
```

Do not commit huge raw files if unnecessary.

---

## 20. Repository Structure

Recommended final structure:

```txt
marginboard-retail-ops/
├── CLAUDE.md
├── README.md
├── docs/
│   ├── PRD.md
│   ├── METHODOLOGY.md
│   ├── UI_GUIDELINES.md
│   ├── TECHNICAL_SPEC.md
│   ├── ROADMAP.md
│   └── screenshots/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── types/
│   ├── public/
│   └── package.json
├── backend/
│   ├── app/
│   ├── ml/
│   ├── data/
│   │   ├── raw/
│   │   ├── processed/
│   │   └── sample/
│   ├── requirements.txt
│   └── README.md
├── notebooks/
│   ├── 01_data_exploration.ipynb
│   ├── 02_forecasting_experiment.ipynb
│   └── 03_anomaly_inventory_logic.ipynb
├── scripts/
├── docker-compose.yml
└── .gitignore
```

---

## 21. Development Phases

### Phase 1 — Data Foundation

Deliverables:

- Load dataset
- Standardize columns
- Clean dates and numeric fields
- Calculate revenue
- Create processed dataset
- Create basic EDA notebook
- Document cleaning rules

Acceptance criteria:

- Processed dataset can be generated reliably.
- Revenue metrics are reproducible.
- Negative quantities are handled intentionally.
- Data assumptions are documented.

---

### Phase 2 — Backend MVP

Deliverables:

- FastAPI app
- Overview endpoints
- Forecasting endpoints
- Inventory endpoints
- Transaction endpoints
- Basic service layer

Acceptance criteria:

- Backend runs locally.
- API returns clean JSON.
- No hardcoded frontend-only data.
- API errors are handled cleanly.

---

### Phase 3 — Frontend MVP

Deliverables:

- Next.js app
- Dashboard layout
- Sidebar navigation
- Overview page
- Forecasting page
- Inventory page
- Transactions page
- Methodology page

Acceptance criteria:

- Frontend fetches from backend.
- UI is consistent and clean.
- Charts render correctly.
- Tables are readable.
- Loading and error states exist.

---

### Phase 4 — ML and Business Logic

Deliverables:

- Forecast model
- Forecast metrics
- Inventory risk scoring
- Transaction anomaly scoring
- Reason codes

Acceptance criteria:

- Forecast output is generated from processed data.
- Model metrics are visible.
- Inventory logic is explainable.
- Transaction anomaly logic is explainable.
- Limitations are displayed.

---

### Phase 5 — Polish and Portfolio

Deliverables:

- Final UI polish
- README
- Screenshots
- Demo deployment
- Clean repo
- Documentation

Acceptance criteria:

- App looks professional.
- README is recruiter-friendly.
- Methodology is clear.
- Project can be run locally.
- Demo link works.
- No obvious placeholder content remains.

---

## 22. Acceptance Criteria

The project is considered complete when:

### Product

- User can open the app and understand its purpose within 10 seconds.
- User can navigate all five main pages.
- User can view revenue, forecast, inventory risk, and anomalies.
- User can understand assumptions via Methodology page.

### Design

- UI feels premium and restrained.
- Layout is consistent.
- Charts and tables are readable.
- No visual clutter.
- No AI-slop styling.

### Data

- Dataset is processed reproducibly.
- Metrics are calculated from real processed data.
- Simulated values are labeled.
- Limitations are documented.

### Engineering

- Frontend and backend are separated cleanly.
- Code is organized.
- Components are reusable.
- API responses are typed or documented.
- Project has a clear folder structure.

### Portfolio

- README is complete.
- Screenshots are included.
- Demo is deployable.
- Project can be explained in an interview.

---

## 23. Known Risks

### Risk 1 — Dataset Size

Online Retail II may be large.

Mitigation:

- Use processed parquet files.
- Use sample data for demo.
- Cache aggregated metrics.

### Risk 2 — Inventory Is Simulated

The dataset does not contain actual stock.

Mitigation:

- Label all stock values as simulated.
- Explain assumptions clearly.
- Do not overclaim.

### Risk 3 — No Fraud Label

The dataset does not contain confirmed fraud labels.

Mitigation:

- Use anomaly monitoring.
- Provide reason codes.
- Avoid the term “fraud detection” in v1.

### Risk 4 — Scope Creep

Too many features may make the project unfinished.

Mitigation:

- Prioritize five pages only.
- Do not add chatbot or complex auth in v1.
- Polish the core experience.

### Risk 5 — UI Looks Like a Template

The project may look generic if styling is not controlled.

Mitigation:

- Use restrained B2B visual style.
- Use consistent spacing and copy.
- Avoid generic AI language.
- Customize components thoughtfully.

---

## 24. Future Improvements

Potential v1.1 or v2 features:

- PostgreSQL database
- Authentication
- CSV export
- PDF reporting
- Customer segmentation
- Product category classification
- Scenario simulator
- Dedicated fraud-labeled dataset
- Docker deployment
- Automated model training pipeline
- Unit tests
- CI/CD
- Admin settings page

---

## 25. Final Product Summary

MarginBoard should be a polished, realistic, portfolio-grade retail operations dashboard.

It should demonstrate:

- Product thinking
- Data cleaning
- Analytics engineering
- Machine learning
- Business logic
- Full-stack development
- UI/UX judgment
- Honest documentation

The final result should not look like a generic AI-generated dashboard. It should look like a carefully built internal analytics product for retail teams.

The core message of the project:

> MarginBoard turns historical retail transaction data into practical business decisions across revenue, forecasting, inventory risk, and transaction monitoring.
