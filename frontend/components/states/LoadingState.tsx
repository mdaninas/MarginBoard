"use client";

import { useTranslation } from "@/lib/i18n/I18nProvider";

interface Props {
  label?: string;
}

export function LoadingState({ label }: Props) {
  const { t } = useTranslation();
  return (
    <div className="card-soft flex items-center gap-3 p-5 text-sm text-ink-muted">
      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
      {label ?? t("common.loading")}
    </div>
  );
}
