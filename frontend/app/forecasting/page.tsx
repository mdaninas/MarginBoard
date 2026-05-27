"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/cards/MetricCard";
import { ForecastChart } from "@/components/charts/ForecastChart";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";
import { apiGet } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/I18nProvider";
import type { ForecastPoint, ForecastSummary } from "@/types/api";

interface PageData {
  summary: ForecastSummary;
  timeseries: ForecastPoint[];
}

export default function ForecastingPage() {
  const { t } = useTranslation();
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

  return (
    <div className="space-y-6">
      <PageHeader title={t("forecasting.title")} description={t("forecasting.description")} />

      {loading && <LoadingState label={t("forecasting.loading")} />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              label={t("forecasting.kpi.forecast_30d")}
              value={formatCurrency(data.summary.forecasted_revenue)}
              delta={data.summary.expected_growth_pct}
              deltaLabel={t("common.vs_previous_30d")}
            />
            <MetricCard
              label={t("forecasting.kpi.previous_30d")}
              value={formatCurrency(data.summary.previous_30_day_revenue)}
            />
            <MetricCard
              label={t("forecasting.kpi.validation_mape")}
              value={`${data.summary.mape.toFixed(2)}%`}
              hint={t("forecasting.kpi.mae_hint", { value: formatCurrency(data.summary.mae) })}
            />
            <MetricCard
              label={t("forecasting.kpi.horizon")}
              value={t("forecasting.kpi.horizon_days", { n: data.summary.forecast_horizon_days })}
            />
            <MetricCard
              label={t("forecasting.kpi.training_window")}
              value={
                <span className="text-base font-medium">
                  {formatDate(data.summary.training_period_start)} – {formatDate(data.summary.training_period_end)}
                </span>
              }
            />
            <MetricCard
              label={t("forecasting.kpi.validation_window")}
              value={
                <span className="text-base font-medium">
                  {formatDate(data.summary.validation_period_start)} – {formatDate(data.summary.validation_period_end)}
                </span>
              }
            />
          </div>

          <section>
            <h2 className="text-sm font-medium uppercase tracking-wide text-ink-muted mb-3">
              {t("forecasting.section.chart")}
            </h2>
            {data.timeseries.length === 0 ? (
              <EmptyState />
            ) : (
              <ForecastChart data={data.timeseries} />
            )}
          </section>

          <section className="card p-5 text-sm">
            <h3 className="font-medium mb-2">{t("forecasting.model.title")}</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-ink-muted">
              <div>
                <dt className="text-xs uppercase tracking-wide">{t("forecasting.model.model_label")}</dt>
                <dd className="text-ink">{data.summary.model}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide">{t("forecasting.model.features_label")}</dt>
                <dd className="text-ink">{data.summary.features.join(", ")}</dd>
              </div>
            </dl>
            <p className="mt-4 text-ink-muted">{t("forecasting.model.disclaimer")}</p>
          </section>
        </>
      )}
    </div>
  );
}
