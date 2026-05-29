import type { ReactNode } from "react";
import { Delta } from "@/components/primitives/Delta";

interface Props {
  label: string;
  value: ReactNode;
  delta?: number | null;
  deltaLabel?: string;
  hint?: ReactNode;
  /** Larger value typography for hero metrics. */
  big?: boolean;
}

/**
 * Card-shaped KPI block. Used in 4–6 column grids on every page. The big
 * variant is reserved for the single hero metric per page.
 */
export function MetricCard({ label, value, delta, deltaLabel, hint, big = false }: Props) {
  return (
    <div className="card p-4 md:p-[18px]">
      <p className="text-[11px] font-medium text-ink-faint">{label}</p>
      <p
        className={
          big
            ? "mt-1 text-[34px] font-semibold leading-tight tracking-[-1.2px]"
            : "mt-1 text-[24px] font-semibold leading-tight tracking-[-0.6px]"
        }
      >
        {value}
      </p>
      {delta !== undefined && delta !== null && (
        <div className="mt-1.5 flex items-center gap-2">
          <Delta value={`${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`} up={delta > 0} />
          {deltaLabel && <span className="text-[11px] text-ink-faint">{deltaLabel}</span>}
        </div>
      )}
      {hint && (
        <p className="mt-1.5 font-mono text-[11px] text-ink-faint">{hint}</p>
      )}
    </div>
  );
}
