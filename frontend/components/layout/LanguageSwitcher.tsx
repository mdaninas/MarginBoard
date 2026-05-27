"use client";

import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n/dictionaries";
import { useTranslation } from "@/lib/i18n/I18nProvider";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <label className="flex items-center gap-1.5 text-xs text-ink-muted">
      <span className="sr-only">{t("language.label")}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="bg-surface border border-border rounded-md px-2 py-1 text-xs text-ink hover:bg-background"
        aria-label={t("language.label")}
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_LABELS[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
