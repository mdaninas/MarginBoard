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

export interface FeatureImportance {
  name: string;
  importance: number;
}

export interface ForecastSummary {
  model: string;
  forecast_horizon_days: number;
  forecasted_revenue: number;
  previous_30_day_revenue: number;
  expected_growth_pct: number | null;
  mae: number;
  mae_std: number;
  mape: number;
  mape_std: number;
  cv_folds: number;
  training_period_start: string;
  training_period_end: string;
  validation_period_start: string;
  validation_period_end: string;
  features: string[];
  feature_importances: FeatureImportance[];
  dataset_last_date: string | null;
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

// Basket — association rules / cross-sell

export interface AssociationRule {
  antecedents: string[];
  antecedent_labels: string[];
  consequents: string[];
  consequent_labels: string[];
  support: number;
  confidence: number;
  lift: number;
  antecedent_support: number;
  consequent_support: number;
}

export interface BasketSummary {
  transactions_analyzed: number;
  unique_items_considered: number;
  rules_found: number;
  min_support: number;
  min_confidence: number;
  note: string;
}

// Analytics — cohort, ABC, RFM

export interface CohortRetentionRow {
  cohort_month: string;
  cohort_size: number;
  // Retention rates keyed by months-since-first-purchase ("0", "1", "2", …).
  retention: Record<string, number>;
}

export type ABCClass = "A" | "B" | "C";

export interface ABCClassificationRow {
  stock_code: string;
  description: string;
  revenue: number;
  cumulative_share_pct: number;
  abc_class: ABCClass;
}

export interface ABCSummary {
  a_count: number;
  b_count: number;
  c_count: number;
  a_revenue_share_pct: number;
  b_revenue_share_pct: number;
  c_revenue_share_pct: number;
}

export type RFMSegment =
  | "Champions"
  | "Loyal"
  | "Potential Loyalist"
  | "At Risk"
  | "Hibernating"
  | "Lost"
  | "New"
  | "Others";

export interface CustomerSegment {
  customer_id: number;
  recency_days: number;
  frequency: number;
  monetary: number;
  r_score: number;
  f_score: number;
  m_score: number;
  segment: RFMSegment;
}

export interface SegmentSummary {
  segment: RFMSegment;
  customer_count: number;
  revenue_share_pct: number;
}

