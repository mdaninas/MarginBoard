"use client";

import { useEffect } from "react";
import { useTranslation } from "@/lib/i18n/I18nProvider";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    console.error("Unhandled page error", error);
  }, [error]);

  return (
    <div className="card p-8 max-w-xl">
      <p className="font-semibold text-danger">{t("common.something_wrong")}</p>
      <p className="text-sm text-ink-muted mt-2">{t("common.something_wrong_desc")}</p>
      {error.message && (
        <pre className="text-xs bg-background border border-border rounded-md p-3 mt-3 overflow-x-auto text-ink">
          {error.message}
        </pre>
      )}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="bg-accent text-white text-sm font-medium px-3 py-1.5 rounded-md hover:opacity-90"
        >
          {t("common.try_again")}
        </button>
        <a
          href="/overview"
          className="border border-border text-sm font-medium px-3 py-1.5 rounded-md hover:bg-background"
        >
          {t("common.back_to_overview")}
        </a>
      </div>
    </div>
  );
}
