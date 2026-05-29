import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface BarItem {
  label: string;
  value: number;
  /** Optional formatted display (overrides default "value" rendering). */
  display?: ReactNode;
}

interface Props {
  items: BarItem[];
  /** First bar uses accent, others use muted ink. */
  accentFirst?: boolean;
  /** Custom value formatter (when `display` is not provided). */
  format?: (value: number) => string;
  className?: string;
}

/**
 * Horizontal bar list — label · bar · value. Cheap visualisation when
 * a full chart would be overkill (country breakdown, segment share, etc.).
 */
export function BarList({
  items,
  accentFirst = true,
  format = (v) => v.toLocaleString(),
  className,
}: Props) {
  const max = items.reduce((m, i) => Math.max(m, i.value), 0) || 1;
  return (
    <div className={cn("flex flex-col gap-2 text-sm", className)}>
      {items.map((item, idx) => {
        const pct = (item.value / max) * 100;
        const barColor =
          accentFirst && idx === 0 ? "bg-accent" : "bg-ink-muted";
        return (
          <div key={item.label} className="flex items-center gap-3">
            <span className="w-28 truncate text-ink-muted">{item.label}</span>
            <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
              <span
                className={cn("absolute inset-y-0 left-0 rounded-full", barColor)}
                style={{ width: `${pct.toFixed(2)}%` }}
              />
            </span>
            <span className="w-16 text-right font-mono text-[11px] text-ink-muted tabular-nums">
              {item.display ?? format(item.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
