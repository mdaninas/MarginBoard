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
import { formatCurrency, formatNumber } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/I18nProvider";
import type { InventoryProduct, InventorySummary, RiskLevel } from "@/types/api";

interface PageData {
  summary: InventorySummary;
  products: InventoryProduct[];
}

export default function InventoryPage() {
  const { t, tRisk } = useTranslation();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [risk, setRisk] = useState<RiskLevel | "">("");

  const load = useCallback(async (currentRisk: RiskLevel | "") => {
    setLoading(true);
    setError(null);
    try {
      const [summary, products] = await Promise.all([
        apiGet<InventorySummary>("/inventory/summary"),
        apiGet<InventoryProduct[]>("/inventory/products", {
          limit: 100,
          risk: currentRisk || undefined,
        }),
      ]);
      setData({ summary, products });
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
      { label: t("common.all"), value: "" },
      { label: tRisk("High"), value: "High" },
      { label: tRisk("Medium"), value: "Medium" },
      { label: tRisk("Low"), value: "Low" },
    ],
    [t, tRisk],
  );

  const columns: Column<InventoryProduct>[] = useMemo(
    () => [
      { key: "description", header: t("inventory.col.product"), render: (r) => <span className="font-medium">{r.description}</span> },
      { key: "stock_code", header: t("inventory.col.stock_code"), render: (r) => <span className="text-ink-muted">{r.stock_code}</span> },
      { key: "estimated_demand", header: t("inventory.col.estimated_demand"), align: "right", render: (r) => formatNumber(r.estimated_demand) },
      {
        key: "simulated_stock",
        header: t("inventory.col.simulated_stock"),
        align: "right",
        render: (r) => <span title={t("inventory.simulated_tooltip")}>{formatNumber(r.simulated_stock)}</span>,
      },
      { key: "safety_stock", header: t("inventory.col.safety_stock"), align: "right", render: (r) => formatNumber(r.safety_stock) },
      { key: "recommended_reorder", header: t("inventory.col.reorder"), align: "right", render: (r) => formatNumber(r.recommended_reorder) },
      { key: "potential_lost_revenue", header: t("inventory.col.lost_revenue"), align: "right", render: (r) => formatCurrency(r.potential_lost_revenue) },
      { key: "risk_level", header: t("inventory.col.risk"), render: (r) => <RiskBadge level={r.risk_level} /> },
    ],
    [t],
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t("inventory.title")} description={t("inventory.description")} />

      <div className="card p-3 text-xs text-ink-muted border-warning/30">
        <span className="font-medium text-warning">{t("inventory.banner_note_label")}</span>{" "}
        {t("inventory.simulated_banner")}
      </div>

      {loading && <LoadingState label={t("inventory.loading")} />}
      {error && <ErrorState message={error} onRetry={() => load(risk)} />}

      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              label={t("inventory.kpi.products_at_risk")}
              value={formatNumber(data.summary.products_at_risk)}
              hint={t("inventory.kpi.horizon_hint", { n: data.summary.horizon_days })}
            />
            <MetricCard label={t("inventory.kpi.high_risk")} value={formatNumber(data.summary.high_risk_products)} />
            <MetricCard label={t("inventory.kpi.medium_risk")} value={formatNumber(data.summary.medium_risk_products)} />
            <MetricCard
              label={t("inventory.kpi.lost_revenue")}
              value={formatCurrency(data.summary.estimated_lost_revenue)}
            />
            <MetricCard
              label={t("inventory.kpi.reorder_units")}
              value={formatNumber(data.summary.recommended_reorder_units)}
            />
            <MetricCard label={t("inventory.kpi.low_risk")} value={formatNumber(data.summary.low_risk_products)} />
          </div>

          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="text-ink-muted">{t("common.filter_by_risk")}:</span>
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

          {data.products.length === 0 ? (
            <EmptyState />
          ) : (
            <DataTable
              rows={data.products}
              rowKey={(r) => r.stock_code}
              columns={columns}
              caption={t("inventory.caption_top100")}
            />
          )}
        </>
      )}
    </div>
  );
}
