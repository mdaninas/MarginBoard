"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/I18nProvider";

export interface FilterValue {
  start: string;
  end: string;
  country: string;
}

interface Props {
  initial: FilterValue;
  countries?: string[];
  showCountry?: boolean;
  onApply: (value: FilterValue) => void;
}

export function FilterBar({ initial, countries = [], showCountry = true, onApply }: Props) {
  const [value, setValue] = useState<FilterValue>(initial);
  const { t } = useTranslation();

  useEffect(() => {
    setValue(initial);
  }, [initial.start, initial.end, initial.country]);

  return (
    <form
      className="card p-4 flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onApply(value);
      }}
    >
      <div className="flex flex-col">
        <label className="text-xs text-ink-muted mb-1">{t("common.from")}</label>
        <input
          type="date"
          value={value.start}
          onChange={(e) => setValue((v) => ({ ...v, start: e.target.value }))}
          className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface text-ink"
        />
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-ink-muted mb-1">{t("common.to")}</label>
        <input
          type="date"
          value={value.end}
          onChange={(e) => setValue((v) => ({ ...v, end: e.target.value }))}
          className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface text-ink"
        />
      </div>
      {showCountry && (
        <div className="flex flex-col">
          <label className="text-xs text-ink-muted mb-1">{t("common.country")}</label>
          <select
            value={value.country}
            onChange={(e) => setValue((v) => ({ ...v, country: e.target.value }))}
            className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface text-ink min-w-[10rem]"
          >
            <option value="">{t("common.all_countries")}</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}
      <button
        type="submit"
        className="bg-accent text-white text-sm font-medium px-3 py-1.5 rounded-md hover:opacity-90"
      >
        {t("common.apply")}
      </button>
      <button
        type="button"
        className="text-sm text-ink-muted hover:text-ink px-2"
        onClick={() => {
          const cleared = { start: "", end: "", country: "" };
          setValue(cleared);
          onApply(cleared);
        }}
      >
        {t("common.reset")}
      </button>
    </form>
  );
}
