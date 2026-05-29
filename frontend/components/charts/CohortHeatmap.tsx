"use client";

import { useMemo } from "react";
import { useTranslation } from "@/lib/i18n/I18nProvider";
import type { CohortRetentionRow } from "@/types/api";

interface Props {
  data: CohortRetentionRow[];
}

/**
 * Renders a cohort × month-offset heatmap with the accent color faded by
 * retention strength. I picked CSS Grid over Recharts because:
 *   - Recharts doesn't have a heatmap primitive, and a treemap or scatter
 *     hack would obscure the rectangular structure that makes cohort
 *     charts readable.
 *   - The cell count is small (max ~24 cohorts × 12 offsets) so plain divs
 *     are fine on render performance.
 */
export function CohortHeatmap({ data }: Props) {
  const { t } = useTranslation();

  const { columns, rows } = useMemo(() => {
    if (data.length === 0) return { columns: [] as number[], rows: data };
    // Offsets vary slightly across cohorts (newer ones have fewer months
    // observed). Take the union so the grid stays rectangular.
    const offsets = new Set<number>();
    for (const row of data) {
      for (const key of Object.keys(row.retention)) offsets.add(Number(key));
    }
    return {
      columns: Array.from(offsets).sort((a, b) => a - b),
      rows: data,
    };
  }, [data]);

  if (rows.length === 0 || columns.length === 0) return null;

  return (
    <div className="card p-4 overflow-x-auto">
      <div className="min-w-fit">
        <div
          className="grid gap-1 text-xs"
          style={{
            gridTemplateColumns: `minmax(110px, max-content) max-content repeat(${columns.length}, minmax(40px, 1fr))`,
          }}
        >
          <div className="text-ink-muted font-medium uppercase tracking-wide pr-2">
            {t("customers.cohort.cohort_label")}
          </div>
          <div className="text-ink-muted font-medium uppercase tracking-wide text-right pr-2">
            {t("customers.col.cohort_size")}
          </div>
          {columns.map((offset) => (
            <div
              key={offset}
              className="text-ink-muted font-medium text-center"
              title={t("customers.cohort.month_offset")}
            >
              {offset}
            </div>
          ))}

          {rows.map((row) => (
            <Row key={row.cohort_month} row={row} columns={columns} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ row, columns }: { row: CohortRetentionRow; columns: number[] }) {
  return (
    <>
      <div className="font-medium pr-2 py-1">{row.cohort_month}</div>
      <div className="text-ink-muted text-right pr-2 py-1 tabular-nums">{row.cohort_size}</div>
      {columns.map((offset) => {
        const value = row.retention[String(offset)];
        return <Cell key={offset} value={value} />;
      })}
    </>
  );
}

function Cell({ value }: { value: number | undefined }) {
  if (value === undefined) {
    return <div className="bg-background border border-border rounded-sm" />;
  }
  // Cohort offset 0 is always 100% (the cohort itself). Scale alpha against
  // 100, but clamp the floor so very low retention is still visible.
  const intensity = Math.max(0.06, Math.min(1, value / 100));
  return (
    <div
      className="rounded-sm text-center py-1 px-1 tabular-nums text-[11px]"
      style={{
        backgroundColor: `color-mix(in srgb, var(--color-accent) ${Math.round(
          intensity * 100,
        )}%, transparent)`,
        color: intensity > 0.45 ? "#fff" : "var(--color-ink)",
      }}
      title={`${value.toFixed(1)}%`}
    >
      {value.toFixed(0)}
    </div>
  );
}
