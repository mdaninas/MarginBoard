"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  DICTIONARIES,
  LOCALES,
  REASON_CODE_KEYS,
  type Locale,
} from "./dictionaries";
import { setFormatLocale } from "@/lib/format";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  tReason: (englishReason: string) => string;
  tRisk: (level: "Low" | "Medium" | "High") => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);
const STORAGE_KEY = "marginboard.locale";

function readInitialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (stored && LOCALES.includes(stored)) return stored;
  const browser = window.navigator.language?.slice(0, 2).toLowerCase();
  if (browser === "id") return "id";
  return DEFAULT_LOCALE;
}

function interpolate(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    values[key] !== undefined ? String(values[key]) : `{${key}}`,
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const initial = readInitialLocale();
    setLocaleState(initial);
    setFormatLocale(initial);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setFormatLocale(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.lang = next;
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string, values?: Record<string, string | number>) => {
      const dict = DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
      const template = dict[key] ?? DICTIONARIES[DEFAULT_LOCALE][key] ?? key;
      return interpolate(template, values);
    },
    [locale],
  );

  const tReason = useCallback(
    (englishReason: string) => {
      const key = REASON_CODE_KEYS[englishReason];
      return key ? t(key) : englishReason;
    },
    [t],
  );

  const tRisk = useCallback(
    (level: "Low" | "Medium" | "High") => t(`risk.${level.toLowerCase()}`),
    [t],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, tReason, tRisk }),
    [locale, setLocale, t, tReason, tRisk],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used inside I18nProvider");
  return ctx;
}
