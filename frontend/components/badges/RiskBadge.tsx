"use client";

import { cn } from "@/lib/cn";
import { useTranslation } from "@/lib/i18n/I18nProvider";
import type { RiskLevel } from "@/types/api";

const STYLES: Record<RiskLevel, string> = {
  Low: "bg-success/10 text-success border-success/20",
  Medium: "bg-warning/10 text-warning border-warning/20",
  High: "bg-danger/10 text-danger border-danger/20",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const { tRisk } = useTranslation();
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-medium border rounded-md",
        STYLES[level],
      )}
    >
      {tRisk(level)}
    </span>
  );
}
