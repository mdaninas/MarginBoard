import type { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

/**
 * Page-level header. Eyebrow runs above as a small uppercase label; the
 * title is the dominant element, and the description sits below at body
 * weight. Actions float right (filters, share button, etc.).
 */
export function PageHeader({ eyebrow, title, description, actions }: Props) {
  return (
    <div className="mb-5 flex flex-col gap-3 md:mb-6 md:flex-row md:items-end md:justify-between md:gap-6">
      <div>
        {eyebrow && (
          <div className="text-[11px] text-ink-faint">{eyebrow}</div>
        )}
        <h1 className="mt-0.5 text-[24px] font-semibold leading-tight tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-[13px] text-ink-muted">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-1.5">{actions}</div>}
    </div>
  );
}
