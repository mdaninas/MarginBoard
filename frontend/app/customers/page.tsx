"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionH } from "@/components/layout/SectionH";
import { MetricCard } from "@/components/cards/MetricCard";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { CohortHeatmap } from "@/components/charts/CohortHeatmap";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";
import { Tag } from "@/components/primitives/Tag";
import { apiGet } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/I18nProvider";
import { useThemeColors } from "@/lib/theme/ThemeProvider";
import type {
  CohortRetentionRow,
  CustomerSegment,
  RFMSegment,
  SegmentSummary,
} from "@/types/api";

interface PageData {
  segments: SegmentSummary[];
  customers: CustomerSegment[];
  cohort: CohortRetentionRow[];
}

export default function CustomersPage() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [segments, customers, cohort] = await Promise.all([
        apiGet<SegmentSummary[]>("/analytics/segment-summary"),
        apiGet<CustomerSegment[]>("/analytics/customer-segments", { limit: 100 }),
        apiGet<CohortRetentionRow[]>("/analytics/cohort-retention"),
      ]);
      setData({ segments, customers, cohort });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const segmentLabel = useCallback(
    (s: RFMSegment) => t(`segment.${s}`),
    [t],
  );

  const kpis = useMemo(() => {
    if (!data) return null;
    const champions = data.segments.find((s) => s.segment === "Champions");
    const loyal = data.segments.find((s) => s.segment === "Loyal");
    const atRisk = data.segments.find((s) => s.segment === "At Risk");
    const total = data.segments.reduce((sum, s) => sum + s.customer_count, 0);
    return { total, champions, loyal, atRisk };
  }, [data]);

  const segmentChartData = useMemo(
    () =>
      data?.segments.map((s) => ({
        segment: segmentLabel(s.segment),
        revenue_share: s.revenue_share_pct,
        customers: s.customer_count,
      })) ?? [],
    [data, segmentLabel],
  );

  const customerColumns: Column<CustomerSegment>[] = useMemo(
    () => [
      {
        key: "customer_id",
        header: t("customers.col.customer_id"),
        render: (r) => <span className="font-mono text-xs font-semibold">{r.customer_id}</span>,
      },
      {
        key: "segment",
        header: t("customers.col.segment"),
        render: (r) => <SegmentTag segment={r.segment} label={segmentLabel(r.segment)} />,
      },
      {
        key: "recency_days",
        header: t("customers.col.recency"),
        align: "right",
        render: (r) => <span className="font-mono">{formatNumber(r.recency_days)}</span>,
      },
      {
        key: "frequency",
        header: t("customers.col.frequency"),
        align: "right",
        render: (r) => <span className="font-mono">{formatNumber(r.frequency)}</span>,
      },
      {
        key: "monetary",
        header: t("customers.col.monetary"),
        align: "right",
        render: (r) => <span className="font-mono font-semibold">{formatCurrency(r.monetary)}</span>,
      },
      {
        key: "rfm",
        header: t("customers.col.rfm_score"),
        align: "right",
        render: (r) => (
          <span className="font-mono text-[11px] tabular-nums text-ink-faint">
            {r.r_score}-{r.f_score}-{r.m_score}
          </span>
        ),
      },
    ],
    [t, segmentLabel],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("customers.title")}
        title="Who are our most valuable customers?"
        description={t("customers.description")}
      />

      {loading && <LoadingState label={t("customers.loading")} />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && kpis && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard label={t("customers.kpi.active")} value={formatNumber(kpis.total)} />
            <MetricCard
              label={t("customers.kpi.champions")}
              value={formatNumber(kpis.champions?.customer_count ?? 0)}
              hint={`${(kpis.champions?.revenue_share_pct ?? 0).toFixed(1)}% revenue`}
            />
            <MetricCard
              label="Loyal"
              value={formatNumber(kpis.loyal?.customer_count ?? 0)}
              hint={`${(kpis.loyal?.revenue_share_pct ?? 0).toFixed(1)}% revenue`}
            />
            <MetricCard
              label={t("customers.kpi.at_risk")}
              value={formatNumber(kpis.atRisk?.customer_count ?? 0)}
              hint={t("customers.kpi.at_risk")}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_1fr]">
            {/* Top customers table */}
            <div className="card overflow-hidden p-0">
              <div className="border-b border-rule px-[18px] py-3">
                <SectionH title={t("customers.section.top_customers")} hint="by spend · 12mo" className="mb-0" />
              </div>
              {data.customers.length === 0 ? (
                <EmptyState description={t("customers.empty.no_customers")} />
              ) : (
                <DataTable
                  rows={data.customers}
                  rowKey={(r) => String(r.customer_id)}
                  columns={customerColumns}
                />
              )}
            </div>

            {/* Segment distribution */}
            <div className="card p-[18px]">
              <SectionH title={t("customers.section.segments")} hint="% of revenue" />
              {segmentChartData.length === 0 ? (
                <EmptyState description={t("customers.empty.no_customers")} />
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={segmentChartData}
                      layout="vertical"
                      margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: colors.inkFaint }}
                        tickFormatter={(v) => `${v}%`}
                        stroke={colors.border}
                      />
                      <YAxis
                        type="category"
                        dataKey="segment"
                        tick={{ fontSize: 11, fill: colors.ink }}
                        width={110}
                        stroke={colors.border}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: `1px solid ${colors.border}`,
                          backgroundColor: colors.surface,
                          color: colors.ink,
                          fontSize: 12,
                        }}
                        formatter={(value: number, key) =>
                          key === "revenue_share"
                            ? [`${value.toFixed(1)}%`, t("customers.col.revenue_share")]
                            : [formatNumber(value), t("customers.col.customer_count")]
                        }
                      />
                      <Bar dataKey="revenue_share" fill={colors.accent} radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="card p-[18px]">
            <SectionH title={t("customers.section.cohort")} hint="rows = first-purchase month · cols = months later" />
            {data.cohort.length === 0 ? (
              <EmptyState description={t("customers.empty.no_customers")} />
            ) : (
              <CohortHeatmap data={data.cohort} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

const SEGMENT_TONES: Record<RFMSegment, "accent" | "good" | "warn" | "bad" | "neutral"> = {
  Champions: "good",
  Loyal: "accent",
  "Potential Loyalist": "accent",
  "At Risk": "warn",
  Hibernating: "neutral",
  Lost: "bad",
  New: "good",
  Others: "neutral",
};

function SegmentTag({ segment, label }: { segment: RFMSegment; label: string }) {
  return <Tag tone={SEGMENT_TONES[segment] ?? "neutral"}>{label}</Tag>;
}
