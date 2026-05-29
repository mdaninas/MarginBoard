import type { ReactNode } from "react";

interface Props {
  title: string;
  hint?: string;
  right?: ReactNode;
  className?: string;
}

/**
 * Subsection header used inside cards. Title + optional inline hint to its
 * right, plus a slot for actions on the far right.
 */
export function SectionH({ title, hint, right, className }: Props) {
  return (
    <div
      className={`mb-2.5 flex items-center justify-between gap-3 ${className ?? ""}`}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-[13.5px] font-semibold">{title}</span>
        {hint && <span className="text-[11px] text-ink-faint">{hint}</span>}
      </div>
      {right}
    </div>
  );
}
