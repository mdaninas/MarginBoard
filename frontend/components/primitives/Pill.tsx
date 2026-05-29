import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  tone?: "default" | "primary" | "ghost";
  children: ReactNode;
}

/**
 * Tab/chip-style button used in topbars, filter rows, and section headers.
 * "Active" reads as a dark ink fill; "primary" is the call-to-action variant.
 */
export function Pill({
  active = false,
  tone = "default",
  className,
  children,
  ...rest
}: Props) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs whitespace-nowrap transition-colors";
  const variants =
    tone === "primary"
      ? "bg-ink text-surface border border-ink font-medium hover:opacity-90"
      : tone === "ghost"
      ? "text-ink-muted hover:text-ink"
      : active
      ? "bg-ink text-surface border border-ink font-medium"
      : "bg-transparent text-ink-muted border border-rule hover:text-ink";
  return (
    <button type="button" className={cn(base, variants, className)} {...rest}>
      {children}
    </button>
  );
}
