"use client";

import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n/dictionaries";
import { useTranslation } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/cn";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useTranslation();

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      aria-label={t("language.label")}
      className={cn(
        "rounded-mb-1 border border-rule bg-surface px-2 py-1.5 text-xs text-ink-muted transition-colors hover:text-ink",
        className,
      )}
    >
      {LOCALES.map((code) => (
        <option key={code} value={code}>
          {LOCALE_LABELS[code]}
        </option>
      ))}
    </select>
  );
}
