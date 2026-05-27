"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/cards/MetricCard";
import { TrendChart } from "@/components/charts/TrendChart";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { FilterBar, type FilterValue } from "@/components/filters/FilterBar";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";
import { apiGet } from "@/lib/api";
import { formatCompact, formatCurrency, formatNumber } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/I18nProvider";
import type {
  CountryPerformance,
  OverviewMetrics,
  RevenueTrendPoint,
  TopProduct,
} from "@/types/api";

const EMPTY_FILTER: FilterValue = { start: "", end: "", country: "" };

interface PageData {
  metrics: OverviewMetrics;
  trend: RevenueTrendPoint[];
  products: TopProduct[];
  countries: CountryPerformance[];
}

function buildInsight(
  metrics: OverviewMetrics | undefined,
  t: ReturnType<typeof useTranslation>["t"],
): string | null {
  if (!metrics) return null;
  const rev = metrics.revenue_growth_pct;
  const ord = metrics.orders_growth_pct;
  if (rev === null && ord === null) {
    return t("overview.insight.no_comparison");
  }
  if (rev === null) return null;
  if (rev > 0) {
    const driver =
      ord !== null && ord > rev
        ? t("overview.insight.driver_orders")
        : t("overview.insight.driver_stable");
    return t("overview.insight.increase", { pct: rev.toFixed(1), driver });
  }
  if (rev < 0) {
    return t("overview.insight.decrease", { pct: Math.abs(rev).toFixed(1) });
  }
  return t("overview.insight.flat");
}

export default function OverviewPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterValue>(EMPTY_FILTER);
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (f: FilterValue) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        start: f.start || undefined,
        end: f.end || undefined,
        country: f.country || undefined,
      };
      const [metrics, trend, products, countries] = await Promise.all([
        apiGet<OverviewMetrics>("/overview/metrics", params),
        apiGet<RevenueTrendPoint[]>("/overview/revenue-trend", params),
        apiGet<TopProduct[]>("/overview/top-products", { ...params, limit: 10 }),
        apiGet<CountryPerformance[]>("/overview/country-performance", {
          start: params.start,
          end: params.end,
          limit: 10,
        }),
      ]);
      setData({ metrics, trend, products, countries });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filter);
  }, [load, filter]);

  const countryOptions = useMemo(() => data?.countries.map((c) => c.country) ?? [], [data]);
  const insight = useMemo(() => buildInsight(data?.metrics, t), [data, t]);

  const productColumns: Column<TopProduct>[] = useMemo(
    () => [
      { key: "description", header: t("overview.col.product"), render: (r) => <span className="font-medium">{r.description}</span> },
      { key: "stock_code", header: t("overview.col.stock_code"), render: (r) => <span className="text-ink-muted">{r.stock_code}</span> },
      { key: "units_sold", header: t("overview.col.units_sold"), align: "right", render: (r) => formatNumber(r.units_sold) },
      { key: "revenue", header: t("overview.col.revenue"), align: "right", render: (r) => formatCurrency(r.revenue) },
      { key: "average_price", header: t("overview.col.avg_price"), align: "right", render: (r) => formatCurrency(r.average_price) },
      { key: "order_count", header: t("overview.col.orders"), align: "right", render: (r) => formatNumber(r.order_count) },
    ],
    [t],
  );

  const countryColumns: Column<CountryPerformance>[] = useMemo(
    () => [
      { key: "country", header: t("overview.col.country"), render: (r) => <span className="font-medium">{r.country}</span> },
      { key: "revenue", header: t("overview.col.revenue"), align: "right", render: (r) => formatCurrency(r.revenue) },
      { key: "orders", header: t("overview.col.orders"), align: "right", render: (r) => formatNumber(r.orders) },
      { key: "units", header: t("overview.col.units"), align: "right", render: (r) => formatCompact(r.units) },
      { key: "active_customers", header: t("overview.col.customers"), align: "right", render: (r) => formatNumber(r.active_customers) },
    ],
    [t],
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t("overview.title")} description={t("overview.description")} />

      <FilterBar
        initial={filter}
        countries={countryOptions}
        onApply={(v) => setFilter(v)}
      />

      {loading && <LoadingState label={t("overview.loading")} />}
      {error && <ErrorState message={error} onRetry={() => load(filter)} />}

      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              label={t("overview.kpi.total_revenue")}
              value={formatCurrency(data.metrics.total_revenue)}
              delta={data.metrics.revenue_growth_pct}
              deltaLabel={t("common.vs_previous_period")}
            />
            <MetricCard
              label={t("overview.kpi.total_orders")}
              value={formatNumber(data.metrics.total_orders)}
              delta={data.metrics.orders_growth_pct}
              deltaLabel={t("common.vs_previous_period")}
            />
            <MetricCard
              label={t("overview.kpi.average_order_value")}
              value={formatCurrency(data.metrics.average_order_value)}
            />
            <MetricCard
              label={t("overview.kpi.units_sold")}
              value={formatCompact(data.metrics.units_sold)}
            />
            <MetricCard
              label={t("overview.kpi.returns")}
              value={formatNumber(data.metrics.return_count)}
              hint={t("overview.kpi.returns_hint")}
            />
            <MetricCard
              label={t("overview.kpi.active_customers")}
              value={formatNumber(data.metrics.active_customers)}
              hint={t("overview.kpi.customers_hint")}
            />
          </div>

          {insight && (
            <div className="card p-4 text-sm">
              <p className="font-medium mb-1">{t("common.notes")}</p>
              <p className="text-ink-muted">{insight}</p>
            </div>
          )}

          <section>
            <h2 className="text-sm font-medium uppercase tracking-wide text-ink-muted mb-3">
              {t("overview.section.revenue_trend")}
            </h2>
            {data.trend.length === 0 ? (
              <EmptyState description={t("overview.empty.no_transactions")} />
            ) : (
              <TrendChart data={data.trend} />
            )}
          </section>

          <section>
            <h2 className="text-sm font-medium uppercase tracking-wide text-ink-muted mb-3">
              {t("overview.section.top_products")}
            </h2>
            {data.products.length === 0 ? (
              <EmptyState />
            ) : (
              <DataTable
                rows={data.products}
                rowKey={(r) => r.stock_code + r.description}
                columns={productColumns}
              />
            )}
          </section>

          <section>
            <h2 className="text-sm font-medium uppercase tracking-wide text-ink-muted mb-3">
              {t("overview.section.country_performance")}
            </h2>
            {data.countries.length === 0 ? (
              <EmptyState />
            ) : (
              <DataTable
                rows={data.countries}
                rowKey={(r) => r.country}
                columns={countryColumns}
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}
