"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionH } from "@/components/layout/SectionH";
import { MetricCard } from "@/components/cards/MetricCard";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";
import { Pill } from "@/components/primitives/Pill";
import { Tag } from "@/components/primitives/Tag";
import { apiGet } from "@/lib/api";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/I18nProvider";
import type { RiskLevel, TransactionAnomaly, TransactionSummary } from "@/types/api";

interface PageData {
  summary: TransactionSummary;
  anomalies: TransactionAnomaly[];
}

const RISK_FILTERS: (RiskLevel | "")[] = ["", "High", "Medium"];

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
          limit: 50,
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

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("transactions.title")}
        title={t("transactions.headline")}
        description={t("transactions.description")}
        actions={
          data && (
            <>
              <Pill active={risk === ""} onClick={() => setRisk("")}>
                {t("common.all_flagged")} · {formatNumber(data.summary.flagged_transactions)}
              </Pill>
              <Pill active={risk === "High"} onClick={() => setRisk("High")}>
                {tRisk("High")} · {formatNumber(data.summary.high_risk_transactions)}
              </Pill>
              <Pill active={risk === "Medium"} onClick={() => setRisk("Medium")}>
                {tRisk("Medium")} · {formatNumber(data.summary.medium_risk_transactions)}
              </Pill>
            </>
          )
        }
      />

      {loading && <LoadingState label={t("transactions.loading")} />}
      {error && <ErrorState message={error} onRetry={() => load(risk)} />}

      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              label={t("transactions.kpi.reviewed")}
              value={formatNumber(data.summary.transactions_reviewed)}
            />
            <MetricCard
              label={t("transactions.kpi.flagged")}
              value={formatNumber(data.summary.flagged_transactions)}
              hint={t("transactions.pct_reviewed", {
                pct: data.summary.transactions_reviewed > 0
                  ? (
                      (data.summary.flagged_transactions /
                        data.summary.transactions_reviewed) *
                      100
                    ).toFixed(2)
                  : "0.00",
              })}
            />
            <MetricCard
              label={t("transactions.kpi.returns")}
              value={formatNumber(data.summary.return_count)}
            />
            <MetricCard
              label={t("transactions.kpi.avg_score")}
              value={data.summary.average_anomaly_score.toFixed(3)}
            />
          </div>

          {data.anomalies.length === 0 ? (
            <EmptyState description={t("transactions.empty_filtered")} />
          ) : (
            <div className="card overflow-hidden p-0">
              <div className="border-b border-rule px-[18px] py-3">
                <SectionH
                  title={t("transactions.open_queue")}
                  hint={t("transactions.caption_top100")}
                  className="mb-0"
                />
              </div>
              <div>
                {data.anomalies.map((row, idx) => (
                  <AnomalyRow
                    key={`${row.invoice_id}-${row.stock_code}-${row.date}`}
                    row={row}
                    first={idx === 0}
                    tRisk={tRisk}
                    tReason={tReason}
                    tUnits={t("common.units")}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AnomalyRow({
  row,
  first,
  tRisk,
  tReason,
  tUnits,
}: {
  row: TransactionAnomaly;
  first: boolean;
  tRisk: (level: "Low" | "Medium" | "High") => string;
  tReason: (key: string) => string;
  tUnits: string;
}) {
  const railColor =
    row.risk_level === "High" ? "bg-bad" : row.risk_level === "Medium" ? "bg-warn" : "bg-ink-faint";
  const tone =
    row.risk_level === "High" ? "bad" : row.risk_level === "Medium" ? "warn" : "neutral";

  return (
    <div
      className={`grid grid-cols-[6px_1fr_auto_auto] items-center gap-3 px-[18px] py-3 ${
        first ? "" : "border-t border-rule"
      }`}
      style={
        first
          ? {
              background:
                "color-mix(in srgb, var(--color-accent-soft) 30%, var(--color-surface))",
            }
          : undefined
      }
    >
      <span className={`h-full self-stretch rounded-full ${railColor}`} />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[13px] font-semibold">{row.invoice_id}</span>
          <Tag tone={tone}>{tRisk(row.risk_level)}</Tag>
          <span className="font-mono text-[11px] text-ink-faint">{formatDate(row.date)}</span>
        </div>
        <div className="mt-0.5 truncate text-[12.5px] text-ink-muted">
          <span className="font-medium text-ink">{row.description}</span>{" "}
          · <span className="font-mono">{row.stock_code}</span> · {row.country}
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          {row.reason_codes.map((code) => (
            <Tag key={code} tone="neutral">
              {tReason(code)}
            </Tag>
          ))}
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono text-[13px] font-semibold">
          {formatCurrency(row.transaction_value)}
        </div>
        <div className="font-mono text-[10px] text-ink-faint">
          {row.quantity > 0 ? "+" : ""}
          {row.quantity} {tUnits} · {formatCurrency(row.unit_price)}/u
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-1 w-12 overflow-hidden rounded-full bg-surface-3">
          <span
            className={`block h-full rounded-full ${
              row.risk_level === "High"
                ? "bg-bad"
                : row.risk_level === "Medium"
                ? "bg-warn"
                : "bg-ink-muted"
            }`}
            style={{ width: `${row.anomaly_score * 100}%` }}
          />
        </span>
        <span className="w-10 text-right font-mono text-[12px] font-semibold">
          {row.anomaly_score.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
