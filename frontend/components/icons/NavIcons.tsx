import type { SVGProps } from "react";

/**
 * Minimal line-icon set (lucide-style, 24px grid, currentColor stroke).
 * Used in the sidebar nav and a few inline affordances. Kept in one file so
 * the icon vocabulary stays small and consistent.
 */

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function OverviewIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </Base>
  );
}

export function ForecastingIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 17l5-5 3 3 7-7" />
      <path d="M16 8h5v5" />
    </Base>
  );
}

export function CustomersIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
      <circle cx="9" cy="7" r="3" />
      <path d="M22 19v-1a4 4 0 0 0-3-3.87" />
      <path d="M16 4.13a4 4 0 0 1 0 7.75" />
    </Base>
  );
}

export function BasketIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 9h14l-1.2 9.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 9Z" />
      <path d="M9 9 12 3l3 6" />
      <path d="M9.5 13v3M14.5 13v3" />
    </Base>
  );
}

export function ProductsIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z" />
      <path d="M3 7l9 5 9-5" />
      <path d="M12 12v10" />
    </Base>
  );
}

export function InventoryIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 8 12 3l9 5-9 5-9-5Z" />
      <path d="M3 12l9 5 9-5" />
      <path d="M3 16l9 5 9-5" />
    </Base>
  );
}

export function TransactionsIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 12h4l2 5 4-12 2 7h6" />
    </Base>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </Base>
  );
}
