"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionH } from "@/components/layout/SectionH";
import { MetricCard } from "@/components/cards/MetricCard";
import { FilterBar, type FilterValue } from "@/components/filters/FilterBar";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";
import { Pill } from "@/components/primitives/Pill";
import { Tag } from "@/components/primitives/Tag";
import { Delta } from "@/components/primitives/Delta";
import { Spark } from "@/components/primitives/Spark";
import { BarList } from "@/components/primitives/BarList";
import { apiGet } from "@/lib/api";
import { formatCompact, formatCurrency, formatDate, formatNumber } from "@/lib/format";
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
  countryList: string[];
}

function buildInsight(
  metrics: OverviewMetrics | undefined,
  t: ReturnType<typeof useTranslation>["t"],
): string | null {
  if (!metrics) return null;
  const rev = metrics.revenue_growth_pct;
  const ord = metrics.orders_growth_pct;
  if (rev === null && ord === null) return t("overview.insight.no_comparison");
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
      const [metrics, trend, products, countries, countryList] = await Promise.all([
        apiGet<OverviewMetrics>("/overview/metrics", params),
        apiGet<RevenueTrendPoint[]>("/overview/revenue-trend", params),
        apiGet<TopProduct[]>("/overview/top-products", { ...params, limit: 5 }),
        apiGet<CountryPerformance[]>("/overview/country-performance", {
          start: params.start,
          end: params.end,
          limit: 6,
        }),
        apiGet<string[]>("/overview/countries"),
      ]);
      setData({ metrics, trend, products, countries, countryList });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filter);
  }, [load, filter]);

  const countryOptions = data?.countryList ?? [];
  const datasetEnd =
    !filter.start && !filter.end ? data?.metrics.period_end : undefined;
  const insight = useMemo(() => buildInsight(data?.metrics, t), [data, t]);
  const trendSeries = useMemo(
    () => data?.trend.map((p) => p.revenue) ?? [],
    [data],
  );
  const eyebrow = data
    ? `${formatDate(data.metrics.period_start)} – ${formatDate(data.metrics.period_end)}`
    : undefined;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={eyebrow}
        title={t("overview.title")}
        description={t("overview.description")}
        actions={
          data?.metrics.period_end ? (
            <span className="font-mono text-[11px] text-ink-faint">
              {t("overview.kpi.active_customers")}: {formatNumber(data.metrics.active_customers)}
            </span>
          ) : null
        }
      />

      <FilterBar
        initial={filter}
        countries={countryOptions}
        datasetEnd={datasetEnd}
        onApply={setFilter}
      />

      {loading && <LoadingState label={t("overview.loading")} />}
      {error && <ErrorState message={error} onRetry={() => load(filter)} />}

      {!loading && !error && data && (
        <>
          {/* Hero strip: big revenue + 2 supporting KPIs. */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.6fr_1fr_1fr]">
            <div className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium text-ink-faint">
                    {t("overview.kpi.total_revenue")} · {t("common.vs_previous_period")}
                  </p>
                  <p className="mt-1 text-[36px] font-semibold leading-tight tracking-[-1.2px]">
                    {formatCurrency(data.metrics.total_revenue)}
                  </p>
                  {data.metrics.revenue_growth_pct !== null && (
                    <div className="mt-1.5">
                      <Delta
                        value={`${data.metrics.revenue_growth_pct > 0 ? "+" : ""}${data.metrics.revenue_growth_pct.toFixed(1)}% vs prev. period`}
                        up={data.metrics.revenue_growth_pct > 0}
                      />
                    </div>
                  )}
                </div>
              </div>
              {trendSeries.length > 1 && (
                <div className="mt-3">
                  <Spark data={trendSeries} width={620} height={90} fill />
                </div>
              )}
            </div>

            <MetricCard
              label={t("overview.kpi.total_orders")}
              value={formatNumber(data.metrics.total_orders)}
              delta={data.metrics.orders_growth_pct}
              deltaLabel={t("common.vs_previous_period")}
            />
            <MetricCard
              label={t("overview.kpi.average_order_value")}
              value={formatCurrency(data.metrics.average_order_value)}
              hint={`${formatCompact(data.metrics.units_sold)} ${t("overview.kpi.units_sold").toLowerCase()}`}
            />
          </div>

          {insight && (
            <div className="card p-4 text-sm">
              <p className="font-medium">{t("common.notes")}</p>
              <p className="mt-1 text-ink-muted">{insight}</p>
            </div>
          )}

          {/* Two-column body: top products list (left, wider) + country bars + returns hint (right). */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_1fr]">
            <div className="card flex flex-col overflow-hidden p-[18px]">
              <SectionH
                title={t("overview.section.top_products")}
                hint={`${t("common.vs_previous_period")}`}
                right={<Pill>{t("common.all")}</Pill>}
              />
              {data.products.length === 0 ? (
                <EmptyState description={t("overview.empty.no_transactions")} />
              ) : (
                <div className="flex flex-col gap-2.5">
                  {data.products.map((p, i) => (
                    <div key={p.stock_code} className="flex items-center gap-3">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-mb-1 border border-rule font-mono text-[10.5px] font-semibold ${
                          i === 0
                            ? "bg-accent-soft text-accent-ink"
                            : "bg-surface-2 text-ink-muted"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12.5px] font-medium">{p.description}</div>
                        <div className="font-mono text-[10px] text-ink-faint">
                          {p.stock_code} · {formatNumber(p.units_sold)} units
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[13px] font-semibold">
                          {formatCurrency(p.revenue)}
                        </div>
                        <div className="font-mono text-[10px] text-ink-faint">
                          {formatCurrency(p.average_price)} avg
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div className="card p-4">
                <SectionH
                  title={t("overview.section.country_performance")}
                  hint={t("common.vs_previous_period")}
                />
                {data.countries.length === 0 ? (
                  <EmptyState />
                ) : (
                  <BarList
                    items={data.countries.map((c) => ({
                      label: c.country,
                      value: c.revenue,
                      display: formatCurrency(c.revenue),
                    }))}
                  />
                )}
              </div>

              {/* Returns / quality panel — uses the same gradient pattern as
                  the design's "Needs review" but reframed for our data shape. */}
              <div
                className="rounded-mb-3 border border-accent-soft p-4 shadow-card"
                style={{
                  background:
                    "linear-gradient(180deg, color-mix(in srgb, var(--color-accent-soft) 60%, var(--color-surface)) 0%, var(--color-surface) 100%)",
                }}
              >
                <SectionH
                  title={t("overview.kpi.returns")}
                  right={<Tag tone="accent">{formatNumber(data.metrics.return_count)}</Tag>}
                />
                <p className="text-[11.5px] text-ink-muted">
                  {t("overview.kpi.returns_hint")}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
