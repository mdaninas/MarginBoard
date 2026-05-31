import { cn } from "@/lib/cn";

interface Props {
  size?: number;
  className?: string;
}

/**
 * MarginBoard mark: a ring enclosing an upward revenue trendline with an
 * endpoint dot. Colors resolve to theme CSS variables so the mark flips with
 * light/dark mode automatically:
 *   ring + dot  → --color-ink      (warm near-black / cream)
 *   ring fill   → --color-surface  (white / warm dark)
 *   trendline   → --color-accent   (coral)
 *
 * Mirrors the favicon at public/icon.svg / icon-dark.svg.
 */
export function Logo({ size = 30, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="MarginBoard logo"
    >
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="var(--color-surface)"
        stroke="var(--color-ink)"
        strokeWidth="3.5"
      />
      <polyline
        points="26,64 40,64 50,40 60,58 74,30"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="74" cy="30" r="5" fill="var(--color-ink)" />
    </svg>
  );
}
