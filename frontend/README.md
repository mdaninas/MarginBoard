# MarginBoard Frontend

Next.js 14 (App Router) + TypeScript + Tailwind CSS + Recharts.

## Setup

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app expects the
MarginBoard backend running on the URL set in `NEXT_PUBLIC_API_URL` (defaults
to `http://localhost:8000/api`).

## Pages

| Path             | Description                                                  |
|------------------|--------------------------------------------------------------|
| `/overview`      | Revenue KPIs, daily trend, top products, country breakdown.  |
| `/forecasting`   | 30-day revenue forecast, model metrics, training window.     |
| `/inventory`     | Simulated inventory risk and recommended reorder quantities. |
| `/transactions`  | Anomaly monitoring with reason codes and risk levels.        |
