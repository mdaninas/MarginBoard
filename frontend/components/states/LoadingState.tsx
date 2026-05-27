"use client";

import { useTranslation } from "@/lib/i18n/I18nProvider";

interface Props {
  label?: string;
}

export function LoadingState({ label }: Props) {
  const { t } = useTranslation();
  return (
    <div className="card p-6 flex items-center gap-3 text-sm text-ink-muted">
      <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse" />
      {label ?? t("common.loading")}
    </div>
  );
}
