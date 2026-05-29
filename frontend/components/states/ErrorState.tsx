"use client";

import { useTranslation } from "@/lib/i18n/I18nProvider";

interface Props {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: Props) {
  const { t } = useTranslation();
  return (
    <div className="rounded-mb-3 border border-bad-soft bg-bad-soft/30 p-5 shadow-card">
      <p className="text-sm font-semibold text-bad">{t("common.failed_load")}</p>
      <p className="mt-1 text-[12.5px] text-ink-muted">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex items-center rounded-mb-1 border border-rule bg-surface px-3 py-1.5 text-sm hover:bg-surface-2"
        >
          {t("common.try_again")}
        </button>
      )}
    </div>
  );
}
