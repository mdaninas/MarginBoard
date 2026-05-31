import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "accent" | "good" | "warn" | "bad";

interface Props {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-muted border-rule",
  accent: "bg-accent-soft text-accent-ink border-accent-soft",
  good: "bg-good-soft text-good border-good-soft",
  warn: "bg-warn-soft text-warn border-warn-soft",
  bad: "bg-bad-soft text-bad border-bad-soft",
};

/**
 * Small monospace status chip for uppercased identifiers, percentages,
 * risk levels. Distinct from `Pill` (which is a button-style control).
 */
export function Tag({ tone = "neutral", children, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
