"use client";

import { useTranslation } from "@/lib/i18n/I18nProvider";

interface Props {
  title?: string;
  description?: string;
  glyph?: string;
}

export function EmptyState({ title, description, glyph = "◇" }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center text-ink-muted">
      <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full border border-rule bg-surface-2 text-lg text-ink-faint">
        {glyph}
      </span>
      <p className="text-sm font-semibold text-ink">{title ?? t("common.no_data")}</p>
      <p className="mt-1 max-w-xs text-[12px] leading-relaxed text-ink-muted">
        {description ?? t("common.no_data_desc")}
      </p>
    </div>
  );
}
