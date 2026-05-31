// Display currency is USD. The Online Retail II dataset is in GBP, but
// values here are shown in USD notation without FX conversion – see
// docs/MODEL_CARD.md for context. Currency/number grouping stays en-US so
// the "$428,920" style is consistent; only DATES are localized (month names
// differ visibly between English and Indonesian).
const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const NUMBER = new Intl.NumberFormat("en-US");

// Locale-aware date formatter. The I18nProvider calls setFormatLocale() so
// dates render with the right month names ("Mar" vs "Mei", etc.).
let _dateLocale = "en-US";
let DATE = buildDateFormatter(_dateLocale);

function buildDateFormatter(locale: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function setFormatLocale(locale: "en" | "id"): void {
  _dateLocale = locale === "id" ? "id-ID" : "en-US";
  DATE = buildDateFormatter(_dateLocale);
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "–";
  return CURRENCY.format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "–";
  return NUMBER.format(value);
}

export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "–";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "–";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "–";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "–";
  return DATE.format(d);
}
