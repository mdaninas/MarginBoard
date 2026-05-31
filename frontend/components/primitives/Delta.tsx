import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Props {
  value: ReactNode;
  /** If omitted, sign is inferred from the rendered string. */
  up?: boolean;
  tone?: "auto" | "muted";
  className?: string;
}

/**
 * Inline ▲/▼ pill, green for up and red for down. Use to label growth
 * percentages next to a metric.
 */
export function Delta({ value, up, tone = "auto", className }: Props) {
  const stringValue = typeof value === "string" ? value : String(value);
  const isUp = up !== undefined ? up : !stringValue.startsWith("-") && !stringValue.startsWith("−");

  if (tone === "muted") {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs text-ink-faint", className)}>
        <span className="text-[10px]">{isUp ? "↗" : "↘"}</span>
        {value}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        isUp ? "bg-good-soft text-good" : "bg-bad-soft text-bad",
        className,
      )}
    >
      <span className="text-[10px]">{isUp ? "↗" : "↘"}</span>
      {value}
    </span>
  );
}
