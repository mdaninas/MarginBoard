import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Props {
  label: string;
  value: ReactNode;
  delta?: number | null;
  deltaLabel?: string;
  hint?: string;
}

function formatDelta(delta: number) {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}%`;
}

export function MetricCard({ label, value, delta, deltaLabel, hint }: Props) {
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wide text-ink-muted font-medium">{label}</p>
      <p className="text-2xl font-semibold mt-2">{value}</p>
      {delta !== undefined && delta !== null && (
        <p
          className={cn(
            "text-xs mt-2",
            delta > 0 ? "text-success" : delta < 0 ? "text-danger" : "text-ink-muted",
          )}
        >
          {formatDelta(delta)}
          {deltaLabel && <span className="text-ink-muted"> {deltaLabel}</span>}
        </p>
      )}
      {hint && <p className="text-xs text-ink-muted mt-2">{hint}</p>}
    </div>
  );
}
