"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionH } from "@/components/layout/SectionH";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";
import { Pill } from "@/components/primitives/Pill";
import { Tag } from "@/components/primitives/Tag";
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
      {
        key: "description",
        header: t("inventory.col.product"),
        render: (r) => (
          <div>
            <div className="font-medium">{r.description}</div>
            <div className="font-mono text-[10px] text-ink-faint">{r.stock_code}</div>
          </div>
        ),
      },
      {
        key: "estimated_demand",
        header: t("inventory.col.estimated_demand"),
        align: "right",
        render: (r) => <span className="font-mono">{formatNumber(r.estimated_demand)}</span>,
      },
      {
        key: "simulated_stock",
        header: t("inventory.col.simulated_stock"),
        align: "right",
        render: (r) => (
          <span className="font-mono" title={t("inventory.simulated_tooltip")}>
            {formatNumber(r.simulated_stock)}
          </span>
        ),
      },
      {
        key: "cover",
        header: "Cover",
        render: (r) => <CoverBar product={r} />,
      },
      {
        key: "risk_level",
        header: t("inventory.col.risk"),
        render: (r) => (
          <Tag tone={r.risk_level === "High" ? "bad" : r.risk_level === "Medium" ? "warn" : "good"}>
            {tRisk(r.risk_level)}
          </Tag>
        ),
      },
      {
        key: "reorder",
        header: t("inventory.col.reorder"),
        align: "right",
        render: (r) =>
          r.risk_level === "Low" ? (
            <span className="font-mono text-ink-faint">—</span>
          ) : (
            <span className="rounded-full bg-ink px-2.5 py-0.5 font-mono text-[11px] font-semibold text-surface">
              +{formatNumber(r.recommended_reorder)}
            </span>
          ),
      },
    ],
    [t, tRisk],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("inventory.title")}
        title="Which SKUs might run out?"
        description={t("inventory.description")}
      />

      {loading && <LoadingState label={t("inventory.loading")} />}
      {error && <ErrorState message={error} onRetry={() => load(risk)} />}

      {!loading && !error && data && (
        <>
          {/* Simulated stock callout — uses the warning palette and an icon-bubble
              left rail, matching the design's caveat card. */}
          <div
            className="rounded-mb-3 border p-4 shadow-card"
            style={{
              background: "color-mix(in srgb, var(--color-warn-soft) 40%, var(--color-surface))",
              borderColor: "var(--color-warn-soft)",
            }}
          >
            <div className="flex items-start gap-3">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warn-soft text-[13px] font-bold text-warn">
                !
              </span>
              <div>
                <p className="text-[13px] font-semibold">Stock figures are simulated</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-ink-muted">
                  {t("inventory.simulated_banner")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <RiskCard
              label={t("inventory.kpi.high_risk")}
              value={data.summary.high_risk_products}
              tone="bad"
              hint="≤ 7 days cover"
            />
            <RiskCard
              label={t("inventory.kpi.medium_risk")}
              value={data.summary.medium_risk_products}
              tone="warn"
              hint="≤ 30% of demand"
            />
            <RiskCard
              label={t("inventory.kpi.lost_revenue")}
              value={formatCurrency(data.summary.estimated_lost_revenue)}
              hint="if nothing reorders"
            />
            <RiskCard
              label={t("inventory.kpi.reorder_units")}
              value={formatNumber(data.summary.recommended_reorder_units)}
              hint={`across ${data.summary.products_at_risk} SKUs`}
            />
          </div>

          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-ink-muted">{t("common.filter_by_risk")}:</span>
            {RISK_OPTIONS.map((opt) => (
              <Pill key={opt.value || "all"} active={risk === opt.value} onClick={() => setRisk(opt.value)}>
                {opt.label}
              </Pill>
            ))}
          </div>

          {data.products.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="card overflow-hidden p-0">
              <div className="border-b border-rule px-[18px] py-3">
                <SectionH
                  title="SKUs by risk"
                  hint="sorted: potential lost revenue ↓"
                  className="mb-0"
                />
              </div>
              <DataTable
                rows={data.products}
                rowKey={(r) => r.stock_code}
                columns={columns}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RiskCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "bad" | "warn";
}) {
  const valueColor =
    tone === "bad" ? "text-bad" : tone === "warn" ? "text-warn" : "text-ink";
  return (
    <div className="card p-4">
      <p className="text-[11px] font-medium text-ink-faint">{label}</p>
      <p className={`mt-1 text-[28px] font-semibold leading-tight tracking-[-1px] ${valueColor}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-[11.5px] text-ink-muted">{hint}</p>}
    </div>
  );
}

function CoverBar({ product }: { product: InventoryProduct }) {
  const ratio = product.estimated_demand
    ? Math.max(0, Math.min(1.5, product.simulated_stock / product.estimated_demand))
    : 0;
  const pct = Math.min(100, (ratio / 1.5) * 100);
  const color =
    product.risk_level === "High"
      ? "bg-bad"
      : product.risk_level === "Medium"
      ? "bg-warn"
      : "bg-good";
  return (
    <div className="flex items-center gap-2">
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
        <span
          className={`block h-full rounded-full ${color}`}
          style={{ width: `${pct.toFixed(1)}%` }}
        />
      </span>
      <span className="w-16 text-right font-mono text-[11px] tabular-nums text-ink-muted">
        {(ratio * 100).toFixed(0)}% cover
      </span>
    </div>
  );
}
