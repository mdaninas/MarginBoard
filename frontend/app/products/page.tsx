"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionH } from "@/components/layout/SectionH";
import { MetricCard } from "@/components/cards/MetricCard";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";
import { Pill } from "@/components/primitives/Pill";
import { Tag } from "@/components/primitives/Tag";
import { apiGet } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/I18nProvider";
import { useThemeColors } from "@/lib/theme/ThemeProvider";
import type { ABCClass, ABCClassificationRow, ABCSummary } from "@/types/api";

const PARETO_LIMIT = 500;
const PAGE_SIZE = 25;

interface PageData {
  summary: ABCSummary;
  rows: ABCClassificationRow[];
}

export default function ProductsPage() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState<ABCClass | "">("");
  const [page, setPage] = useState(1);

  // Reset to the first page whenever the class filter narrows the set.
  useEffect(() => {
    setPage(1);
  }, [classFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summary, rows] = await Promise.all([
        apiGet<ABCSummary>("/analytics/abc-summary"),
        apiGet<ABCClassificationRow[]>("/analytics/abc-classification", {
          limit: PARETO_LIMIT,
        }),
      ]);
      setData({ summary, rows });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const paretoChart = useMemo(
    () =>
      data?.rows.map((row, idx) => ({
        rank: idx + 1,
        cumulative: row.cumulative_share_pct,
      })) ?? [],
    [data],
  );

  const tableRows = useMemo(() => {
    if (!data) return [];
    if (!classFilter) return data.rows;
    return data.rows.filter((r) => r.abc_class === classFilter);
  }, [data, classFilter]);

  const totalSkus = data ? data.summary.a_count + data.summary.b_count + data.summary.c_count : 0;

  const columns: Column<ABCClassificationRow & { rank?: number }>[] = useMemo(
    () => [
      {
        key: "rank",
        header: t("products.col.rank"),
        align: "right",
        render: (r) => (
          <span className="font-mono text-[11px] tabular-nums text-ink-faint">{r.rank ?? ""}</span>
        ),
      },
      {
        key: "description",
        header: t("products.col.product"),
        render: (r) => <span className="font-medium">{r.description}</span>,
      },
      {
        key: "stock_code",
        header: t("products.col.stock_code"),
        render: (r) => <span className="font-mono text-[10px] text-ink-faint">{r.stock_code}</span>,
      },
      {
        key: "revenue",
        header: t("products.col.revenue"),
        align: "right",
        render: (r) => <span className="font-mono font-semibold">{formatCurrency(r.revenue)}</span>,
      },
      {
        key: "cumulative",
        header: t("products.col.cumulative"),
        align: "right",
        render: (r) => (
          <span className="font-mono text-[11px]">{r.cumulative_share_pct.toFixed(2)}%</span>
        ),
      },
      {
        key: "class",
        header: t("products.col.class"),
        render: (r) => <ClassBadge cls={r.abc_class} />,
      },
    ],
    [t],
  );

  const rankedRows = useMemo(
    () => tableRows.map((r) => ({ ...r, rank: (data?.rows.indexOf(r) ?? -1) + 1 })),
    [tableRows, data],
  );

  const pageCount = Math.max(1, Math.ceil(rankedRows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pagedRows = useMemo(
    () => rankedRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [rankedRows, safePage],
  );
  const rangeFrom = rankedRows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(safePage * PAGE_SIZE, rankedRows.length);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("products.title")}
        title="Which SKUs drive revenue?"
        description={t("products.description")}
      />

      {loading && <LoadingState label={t("products.loading")} />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && (
        <>
          {/* Concentration hero */}
          <div
            className="rounded-mb-3 border border-accent-soft p-5 shadow-card"
            style={{
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--color-accent-soft) 60%, var(--color-surface)) 0%, var(--color-surface) 100%)",
            }}
          >
            <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_2fr]">
              <div>
                <p className="text-[11px] font-medium text-ink-faint">Concentration</p>
                <p className="mt-1 text-[28px] font-semibold leading-tight tracking-[-0.8px]">
                  Top {data.summary.a_count.toLocaleString()} SKUs ={" "}
                  <span className="text-accent-ink">
                    {data.summary.a_revenue_share_pct.toFixed(1)}%
                  </span>{" "}
                  of revenue
                </p>
                <p className="mt-1 text-[12.5px] text-ink-muted">
                  Long-tail share is just {data.summary.c_revenue_share_pct.toFixed(1)}% spread across {data.summary.c_count.toLocaleString()} C-class SKUs.
                </p>
              </div>
              {paretoChart.length > 0 && (
                <div className="h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={paretoChart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                      <XAxis dataKey="rank" hide />
                      <YAxis tick={{ fontSize: 10, fill: colors.inkFaint }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} width={32} stroke={colors.border} />
                      <ReferenceLine y={80} stroke={colors.accentInk} strokeDasharray="3 3" />
                      <Line type="monotone" dataKey="cumulative" stroke={colors.accent} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard label={t("products.kpi.total_skus")} value={formatNumber(totalSkus)} />
            <MetricCard
              label={t("products.kpi.a_class")}
              value={formatNumber(data.summary.a_count)}
              hint={`${data.summary.a_revenue_share_pct.toFixed(1)}% revenue`}
            />
            <MetricCard
              label={t("products.kpi.b_class")}
              value={formatNumber(data.summary.b_count)}
              hint={`${data.summary.b_revenue_share_pct.toFixed(1)}% revenue`}
            />
            <MetricCard
              label={t("products.kpi.c_class")}
              value={formatNumber(data.summary.c_count)}
              hint={`${data.summary.c_revenue_share_pct.toFixed(1)}% revenue`}
            />
          </div>

          {paretoChart.length > 0 && (
            <div className="card p-[18px]">
              <SectionH
                title={t("products.section.pareto")}
                hint={`Top ${PARETO_LIMIT} SKUs · ranked by revenue`}
              />
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={paretoChart} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                    <XAxis
                      dataKey="rank"
                      tick={{ fontSize: 11, fill: colors.inkFaint }}
                      stroke={colors.border}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: colors.inkFaint }}
                      tickFormatter={(v) => `${v}%`}
                      domain={[0, 100]}
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
                      formatter={(v: number) => [`${v.toFixed(2)}%`, "Cumulative"]}
                      labelFormatter={(v) => `Rank ${v}`}
                    />
                    <ReferenceLine
                      y={80}
                      stroke={colors.inkFaint}
                      strokeDasharray="3 3"
                      label={{ value: "80%", position: "right", fill: colors.inkFaint, fontSize: 10 }}
                    />
                    <ReferenceLine
                      y={95}
                      stroke={colors.inkFaint}
                      strokeDasharray="3 3"
                      label={{ value: "95%", position: "right", fill: colors.inkFaint, fontSize: 10 }}
                    />
                    <Line type="monotone" dataKey="cumulative" stroke={colors.accent} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-ink-muted">{t("products.filter_class")}:</span>
            {(["", "A", "B", "C"] as const).map((cls) => (
              <Pill key={cls || "all"} active={classFilter === cls} onClick={() => setClassFilter(cls)}>
                {cls === "" ? t("common.all") : t(`products.classes.${cls}`)}
              </Pill>
            ))}
          </div>

          {rankedRows.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="card overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-rule px-[18px] py-3">
                <SectionH
                  title={t("products.section.table")}
                  hint={`${totalSkus.toLocaleString()} SKUs total`}
                  className="mb-0"
                />
              </div>
              <DataTable
                rows={pagedRows}
                rowKey={(r) => r.stock_code}
                columns={columns}
              />
              <div className="flex items-center justify-between border-t border-rule bg-surface-2 px-[18px] py-2.5">
                <span className="font-mono text-[11px] text-ink-faint">
                  {t("common.showing", {
                    from: rangeFrom,
                    to: rangeTo,
                    total: rankedRows.length,
                  })}
                </span>
                <div className="flex items-center gap-1.5">
                  <Pill
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-disabled={safePage <= 1}
                    className={safePage <= 1 ? "pointer-events-none opacity-40" : ""}
                  >
                    ‹ {t("common.prev")}
                  </Pill>
                  <span className="px-1 font-mono text-[11px] text-ink-muted tabular-nums">
                    {safePage} / {pageCount}
                  </span>
                  <Pill
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    aria-disabled={safePage >= pageCount}
                    className={safePage >= pageCount ? "pointer-events-none opacity-40" : ""}
                  >
                    {t("common.next")} ›
                  </Pill>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ClassBadge({ cls }: { cls: ABCClass }) {
  const tone = cls === "A" ? "good" : cls === "B" ? "accent" : "neutral";
  return <Tag tone={tone}>{cls}</Tag>;
}
