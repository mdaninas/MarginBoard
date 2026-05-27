"use client";

import { useTranslation } from "@/lib/i18n/I18nProvider";

interface Props {
  title?: string;
  description?: string;
}

export function EmptyState({ title, description }: Props) {
  const { t } = useTranslation();
  return (
    <div className="card p-8 text-center">
      <p className="font-medium">{title ?? t("common.no_data")}</p>
      <p className="text-sm text-ink-muted mt-1">
        {description ?? t("common.no_data_desc")}
      </p>
    </div>
  );
}
