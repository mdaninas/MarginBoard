"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/I18nProvider";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="card p-8 max-w-xl">
      <p className="font-semibold">{t("common.page_not_found")}</p>
      <p className="text-sm text-ink-muted mt-2">{t("common.page_not_found_desc")}</p>
      <Link
        href="/overview"
        className="inline-block mt-4 border border-border text-sm font-medium px-3 py-1.5 rounded-md hover:bg-background"
      >
        {t("common.back_to_overview")}
      </Link>
    </div>
  );
}
