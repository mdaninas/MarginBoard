"use client";

import { useTranslation } from "@/lib/i18n/I18nProvider";

interface Props {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: Props) {
  const { t } = useTranslation();
  return (
    <div className="card p-6 border-danger/30">
      <p className="font-medium text-danger">{t("common.failed_load")}</p>
      <p className="text-sm text-ink-muted mt-1">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm hover:bg-background"
        >
          {t("common.try_again")}
        </button>
      )}
    </div>
  );
}
