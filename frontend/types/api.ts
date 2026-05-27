// Mirror of backend Pydantic response shapes.

export type RiskLevel = "Low" | "Medium" | "High";

export interface OverviewMetrics {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  units_sold: number;
  return_count: number;
  active_customers: number;
  revenue_growth_pct: number | null;
  orders_growth_pct: number | null;
  period_start: string;
  period_end: string;
  previous_period_start: string;
  previous_period_end: string;
}

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
  orders: number;
  units: number;
}

export interface TopProduct {
  stock_code: string;
  description: string;
  units_sold: number;
  revenue: number;
  average_price: number;
  order_count: number;
}

export interface CountryPerformance {
  country: string;
  revenue: number;
  orders: number;
  units: number;
  active_customers: number;
}

export interface ForecastSummary {
  model: string;
  forecast_horizon_days: number;
  forecasted_revenue: number;
  previous_30_day_revenue: number;
  expected_growth_pct: number | null;
  mae: number;
  mape: number;
  training_period_start: string;
  training_period_end: string;
  validation_period_start: string;
  validation_period_end: string;
  features: string[];
}

export interface ForecastPoint {
  date: string;
  type: "historical" | "forecast";
  revenue: number;
}

export interface InventorySummary {
  products_at_risk: number;
  high_risk_products: number;
  medium_risk_products: number;
  low_risk_products: number;
  estimated_lost_revenue: number;
  recommended_reorder_units: number;
  horizon_days: number;
  note: string;
}

export interface InventoryProduct {
  stock_code: string;
  description: string;
  estimated_demand: number;
  simulated_stock: number;
  safety_stock: number;
  recommended_reorder: number;
  potential_lost_revenue: number;
  risk_level: RiskLevel;
  average_unit_price: number;
}

export interface TransactionSummary {
  transactions_reviewed: number;
  flagged_transactions: number;
  high_risk_transactions: number;
  medium_risk_transactions: number;
  return_count: number;
  average_anomaly_score: number;
  disclaimer: string;
}

export interface TransactionAnomaly {
  invoice_id: string;
  date: string;
  stock_code: string;
  description: string;
  country: string;
  quantity: number;
  unit_price: number;
  transaction_value: number;
  risk_level: RiskLevel;
  anomaly_score: number;
  reason_codes: string[];
}

export interface MethodologySection {
  title: string;
  body: string[];
}

export interface MethodologyResponse {
  dataset: MethodologySection;
  data_cleaning: MethodologySection;
  revenue: MethodologySection;
  forecasting: MethodologySection;
  inventory: MethodologySection;
  transactions: MethodologySection;
  limitations: MethodologySection;
}
