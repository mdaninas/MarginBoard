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
import { ForecastChart } from "@/components/charts/ForecastChart";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";
import { Pill } from "@/components/primitives/Pill";
import { Tag } from "@/components/primitives/Tag";
import { apiGet } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/I18nProvider";
import { useThemeColors } from "@/lib/theme/ThemeProvider";
import type { ForecastPoint, ForecastSummary } from "@/types/api";

interface PageData {
  summary: ForecastSummary;
  timeseries: ForecastPoint[];
}

export default function ForecastingPage() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summary, timeseries] = await Promise.all([
        apiGet<ForecastSummary>("/forecasting/summary"),
        apiGet<ForecastPoint[]>("/forecasting/timeseries"),
      ]);
      setData({ summary, timeseries });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const mapeLabel = data
    ? data.summary.mape_std > 0
      ? `${data.summary.mape.toFixed(2)}% ± ${data.summary.mape_std.toFixed(2)}%`
      : `${data.summary.mape.toFixed(2)}%`
    : "—";

  const importance = useMemo(
    () =>
      data?.summary.feature_importances.map((f) => ({
        name: f.name,
        importance: f.importance,
      })) ?? [],
    [data],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("forecasting.title")}
        title="Where is revenue heading?"
        description={t("forecasting.description")}
        actions={
          data && (
            <>
              <Pill>
                {t("forecasting.kpi.horizon_days", { n: data.summary.forecast_horizon_days })}
              </Pill>
              <Pill active>{data.summary.model}</Pill>
            </>
          )
        }
      />

      {loading && <LoadingState label={t("forecasting.loading")} />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && (
        <>
          {/* Hero card — big forecast number + chart side by side. */}
          <div className="card p-5">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr] md:gap-8">
              <div className="md:max-w-[320px]">
                <p className="text-[11px] font-medium text-ink-faint">
                  {t("forecasting.kpi.forecast_30d")}
                </p>
                <p className="mt-1 text-[42px] font-semibold leading-none tracking-[-1.6px]">
                  {formatCurrency(data.summary.forecasted_revenue)}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Tag tone="neutral">{`MAE ${formatCurrency(data.summary.mae)}`}</Tag>
                  <Tag tone={data.summary.mape < 20 ? "good" : "warn"}>
                    {`MAPE ${mapeLabel}`}
                  </Tag>
                </div>
                <p className="mt-3 text-[12.5px] leading-relaxed text-ink-muted">
                  <span className="font-semibold text-ink">Read as: </span>
                  expected revenue near {formatCurrency(data.summary.forecasted_revenue)},
                  with mean error of {mapeLabel} across {data.summary.cv_folds}-fold
                  TimeSeriesSplit on the held-out tail.
                </p>
              </div>

              <div>
                <div className="mb-2 flex justify-between text-[11px] text-ink-faint">
                  <span>
                    {formatDate(data.summary.training_period_start)} —{" "}
                    {formatDate(data.summary.validation_period_end)}
                  </span>
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-0.5 w-3.5 bg-ink" /> historical
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-0.5 w-3.5 bg-accent" /> forecast
                    </span>
                  </div>
                </div>
                {data.timeseries.length === 0 ? (
                  <EmptyState />
                ) : (
                  <ForecastChart data={data.timeseries} />
                )}
              </div>
            </div>
          </div>

          {/* Cut-off disclaimer */}
          {data.summary.dataset_last_date && data.summary.expected_growth_pct !== null && (
            <div className="card-soft p-3 text-[11.5px] text-ink-muted">
              {t("forecasting.disclaimer.cut_off", {
                date: formatDate(data.summary.dataset_last_date),
              })}
            </div>
          )}

          {/* Lower row: model details + feature importance + cv info */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="card p-[18px]">
              <SectionH title={t("forecasting.model.title")} hint="how this number was made" />
              <div className="flex flex-col gap-2 text-[12.5px]">
                {[
                  [t("forecasting.model.model_label"), data.summary.model],
                  [
                    t("forecasting.model.features_label"),
                    `${data.summary.features.length} cols`,
                  ],
                  [
                    "Training",
                    `${formatDate(data.summary.training_period_start)} → ${formatDate(
                      data.summary.training_period_end,
                    )}`,
                  ],
                  [
                    "Validation",
                    `${data.summary.cv_folds}-fold CV (TimeSeriesSplit)`,
                  ],
                  ["Validation MAPE", mapeLabel],
                ].map(([l, v]) => (
                  <div
                    key={l}
                    className="flex items-center justify-between gap-3 border-b border-rule py-1.5"
                  >
                    <span className="text-[11.5px] text-ink-faint">{l}</span>
                    <span className="text-right font-mono text-[11px]">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-[18px] lg:col-span-2">
              <SectionH
                title={t("forecasting.section.feature_importance")}
                hint="how strongly each feature shapes the model"
              />
              {importance.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={importance}
                      layout="vertical"
                      margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: colors.inkFaint }}
                        tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                        domain={[0, "dataMax"]}
                        stroke={colors.border}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
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
                        formatter={(value: number) => [
                          `${(value * 100).toFixed(2)}%`,
                          t("forecasting.col.importance"),
                        ]}
                      />
                      <Bar dataKey="importance" fill={colors.accent} radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="card-soft p-4 text-[12.5px] text-ink-muted">
            {t("forecasting.model.disclaimer")}
          </div>
        </>
      )}
    </div>
  );
}
