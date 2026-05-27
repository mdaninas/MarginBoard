"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/cards/MetricCard";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { RiskBadge } from "@/components/badges/RiskBadge";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";
import { apiGet } from "@/lib/api";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/I18nProvider";
import type { RiskLevel, TransactionAnomaly, TransactionSummary } from "@/types/api";

interface PageData {
  summary: TransactionSummary;
  anomalies: TransactionAnomaly[];
}

export default function TransactionsPage() {
  const { t, tRisk, tReason } = useTranslation();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [risk, setRisk] = useState<RiskLevel | "">("");

  const load = useCallback(async (currentRisk: RiskLevel | "") => {
    setLoading(true);
    setError(null);
    try {
      const [summary, anomalies] = await Promise.all([
        apiGet<TransactionSummary>("/transactions/summary"),
        apiGet<TransactionAnomaly[]>("/transactions/anomalies", {
          limit: 100,
          risk: currentRisk || undefined,
        }),
      ]);
      setData({ summary, anomalies });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(risk);
  }, [load, risk]);

  const RISK_OPTIONS: { label: string; value: RiskLevel | "" }[] = useMemo(
    () => [
      { label: t("common.all_flagged"), value: "" },
      { label: tRisk("High"), value: "High" },
      { label: tRisk("Medium"), value: "Medium" },
    ],
    [t, tRisk],
  );

  const columns: Column<TransactionAnomaly>[] = useMemo(
    () => [
      { key: "invoice_id", header: t("transactions.col.invoice"), render: (r) => <span className="font-mono text-xs">{r.invoice_id}</span> },
      { key: "date", header: t("transactions.col.date"), render: (r) => formatDate(r.date) },
      { key: "description", header: t("transactions.col.product"), render: (r) => <span className="font-medium">{r.description}</span> },
      { key: "country", header: t("transactions.col.country"), render: (r) => r.country },
      { key: "quantity", header: t("transactions.col.qty"), align: "right", render: (r) => formatNumber(r.quantity) },
      { key: "unit_price", header: t("transactions.col.unit_price"), align: "right", render: (r) => formatCurrency(r.unit_price) },
      { key: "transaction_value", header: t("transactions.col.value"), align: "right", render: (r) => formatCurrency(r.transaction_value) },
      { key: "risk_level", header: t("transactions.col.risk"), render: (r) => <RiskBadge level={r.risk_level} /> },
      {
        key: "anomaly_score",
        header: t("transactions.col.score"),
        align: "right",
        render: (r) => r.anomaly_score.toFixed(3),
      },
      {
        key: "reason_codes",
        header: t("transactions.col.reason"),
        render: (r) => (
          <div className="flex flex-wrap gap-1">
            {r.reason_codes.map((code) => (
              <span
                key={code}
                className="px-1.5 py-0.5 text-xs bg-background border border-border rounded-md text-ink"
              >
                {tReason(code)}
              </span>
            ))}
          </div>
        ),
      },
    ],
    [t, tReason],
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t("transactions.title")} description={t("transactions.description")} />

      {loading && <LoadingState label={t("transactions.loading")} />}
      {error && <ErrorState message={error} onRetry={() => load(risk)} />}

      {!loading && !error && data && (
        <>
          <div className="card p-3 text-xs text-ink-muted">{data.summary.disclaimer}</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard label={t("transactions.kpi.reviewed")} value={formatNumber(data.summary.transactions_reviewed)} />
            <MetricCard label={t("transactions.kpi.flagged")} value={formatNumber(data.summary.flagged_transactions)} />
            <MetricCard label={t("transactions.kpi.high_risk")} value={formatNumber(data.summary.high_risk_transactions)} />
            <MetricCard label={t("transactions.kpi.medium_risk")} value={formatNumber(data.summary.medium_risk_transactions)} />
            <MetricCard label={t("transactions.kpi.returns")} value={formatNumber(data.summary.return_count)} />
            <MetricCard label={t("transactions.kpi.avg_score")} value={data.summary.average_anomaly_score.toFixed(3)} />
          </div>

          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="text-ink-muted">{t("common.filter")}:</span>
            {RISK_OPTIONS.map((opt) => (
              <button
                key={opt.value || "all"}
                type="button"
                onClick={() => setRisk(opt.value)}
                className={`px-3 py-1 rounded-md border ${
                  risk === opt.value
                    ? "border-accent text-accent bg-accent/5"
                    : "border-border text-ink-muted hover:text-ink"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {data.anomalies.length === 0 ? (
            <EmptyState description={t("transactions.empty_filtered")} />
          ) : (
            <DataTable
              rows={data.anomalies}
              rowKey={(r) => `${r.invoice_id}-${r.stock_code}-${r.date}`}
              columns={columns}
              caption={t("transactions.caption_top100")}
            />
          )}
        </>
      )}
    </div>
  );
}
