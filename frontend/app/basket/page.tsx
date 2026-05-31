"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionH } from "@/components/layout/SectionH";
import { MetricCard } from "@/components/cards/MetricCard";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";
import { Pill } from "@/components/primitives/Pill";
import { apiGet } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/I18nProvider";
import type { AssociationRule, BasketSummary } from "@/types/api";

interface PageData {
  summary: BasketSummary;
  rules: AssociationRule[];
}

const LIFT_OPTIONS = [1, 2, 5, 10] as const;
const CONFIDENCE_OPTIONS = [0.3, 0.5, 0.7, 0.9] as const;

export default function BasketPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minLift, setMinLift] = useState<number>(1);
  const [minConfidence, setMinConfidence] = useState<number>(0.3);

  const load = useCallback(async (lift: number, conf: number) => {
    setLoading(true);
    setError(null);
    try {
      const [summary, rules] = await Promise.all([
        apiGet<BasketSummary>("/basket/summary"),
        apiGet<AssociationRule[]>("/basket/rules", {
          limit: 100,
          min_lift: lift,
          min_confidence: conf,
        }),
      ]);
      setData({ summary, rules });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(minLift, minConfidence);
  }, [load, minLift, minConfidence]);

  const columns: Column<AssociationRule>[] = useMemo(
    () => [
      {
        key: "antecedent",
        header: t("basket.col.antecedent"),
        render: (r) => <ItemList labels={r.antecedent_labels} codes={r.antecedents} />,
      },
      {
        key: "consequent",
        header: t("basket.col.consequent"),
        render: (r) => <ItemList labels={r.consequent_labels} codes={r.consequents} />,
      },
      {
        key: "support",
        header: t("basket.col.support"),
        align: "right",
        render: (r) => (
          <span className="font-mono tabular-nums" title={t("basket.support_hint")}>
            {(r.support * 100).toFixed(2)}%
          </span>
        ),
      },
      {
        key: "confidence",
        header: t("basket.col.confidence"),
        align: "right",
        render: (r) => (
          <span className="font-mono tabular-nums" title={t("basket.confidence_hint")}>
            {(r.confidence * 100).toFixed(1)}%
          </span>
        ),
      },
      {
        key: "lift",
        header: t("basket.col.lift"),
        align: "right",
        render: (r) => (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11.5px] font-semibold ${
              r.lift >= 2.5
                ? "border-accent-soft bg-accent-soft text-accent-ink"
                : "border-rule bg-surface-2 text-ink-muted"
            }`}
            title={t("basket.lift_hint")}
          >
            {r.lift.toFixed(2)}×
          </span>
        ),
      },
    ],
    [t],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("basket.title")}
        title={t("basket.headline")}
        description={t("basket.description")}
      />

      {loading && <LoadingState label={t("basket.loading")} />}
      {error && <ErrorState message={error} onRetry={() => load(minLift, minConfidence)} />}

      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MetricCard
              label={t("basket.kpi.transactions")}
              value={formatNumber(data.summary.transactions_analyzed)}
            />
            <MetricCard
              label={t("basket.kpi.items")}
              value={formatNumber(data.summary.unique_items_considered)}
            />
            <MetricCard
              label={t("basket.kpi.rules")}
              value={formatNumber(data.summary.rules_found)}
              hint={t("basket.kpi.thresholds_hint")}
            />
          </div>

          <div className="card p-4">
            <SectionH title={t("basket.reading")} />
            <div className="grid grid-cols-1 gap-2 text-[12.5px] text-ink-muted sm:grid-cols-3">
              <p>
                <span className="font-semibold text-ink">{t("basket.col.support")}:</span> {t("basket.support_def")}
              </p>
              <p>
                <span className="font-semibold text-ink">{t("basket.col.confidence")}:</span> {t("basket.confidence_def")}
              </p>
              <p>
                <span className="font-semibold text-ink">{t("basket.col.lift")}:</span> {t("basket.lift_def")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <FilterRow
              label={t("basket.filter.min_lift")}
              options={LIFT_OPTIONS.map((v) => ({ label: `${v}×`, value: v }))}
              value={minLift}
              onChange={setMinLift}
            />
            <FilterRow
              label={t("basket.filter.min_confidence")}
              options={CONFIDENCE_OPTIONS.map((v) => ({
                label: `${(v * 100).toFixed(0)}%`,
                value: v,
              }))}
              value={minConfidence}
              onChange={setMinConfidence}
            />
          </div>

          {data.rules.length === 0 ? (
            <EmptyState description={t("basket.empty")} />
          ) : (
            <div className="card overflow-hidden p-0">
              <div className="border-b border-rule px-[18px] py-3">
                <SectionH
                  title={t("basket.strongest")}
                  hint={t("basket.caption", { n: data.rules.length })}
                  className="mb-0"
                />
              </div>
              <DataTable
                rows={data.rules}
                rowKey={(r) =>
                  `${r.antecedents.join("|")}>${r.consequents.join("|")}`
                }
                columns={columns}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ItemList({ labels, codes }: { labels: string[]; codes: string[] }) {
  return (
    <div className="space-y-1">
      {labels.map((label, idx) => (
        <div key={codes[idx]} className="flex items-baseline gap-2">
          <span className="font-medium">{label}</span>
          <span className="font-mono text-[10px] text-ink-faint">{codes[idx]}</span>
        </div>
      ))}
    </div>
  );
}

interface FilterRowProps<T extends number> {
  label: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (next: T) => void;
}

function FilterRow<T extends number>({ label, options, value, onChange }: FilterRowProps<T>) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-ink-muted">{label}:</span>
      {options.map((opt) => (
        <Pill key={opt.value} active={value === opt.value} onClick={() => onChange(opt.value)}>
          {opt.label}
        </Pill>
      ))}
    </div>
  );
}
