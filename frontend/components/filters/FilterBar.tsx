"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/I18nProvider";
import { Pill } from "@/components/primitives/Pill";

export interface FilterValue {
  start: string;
  end: string;
  country: string;
}

interface Props {
  initial: FilterValue;
  countries?: string[];
  showCountry?: boolean;
  datasetEnd?: string;
  onApply: (value: FilterValue) => void;
}

export function FilterBar({
  initial,
  countries = [],
  showCountry = true,
  datasetEnd,
  onApply,
}: Props) {
  const [value, setValue] = useState<FilterValue>(initial);
  const { t } = useTranslation();

  useEffect(() => {
    setValue(initial);
  }, [initial.start, initial.end, initial.country]);

  const applyPreset = (start: string, end: string) => {
    const next = { ...value, start, end };
    setValue(next);
    onApply(next);
  };

  return (
    <div className="card flex flex-wrap items-end gap-3 p-4">
      <Field label={t("common.from")}>
        <input
          type="date"
          value={value.start}
          onChange={(e) => setValue((v) => ({ ...v, start: e.target.value }))}
          className="rounded-mb-1 border border-rule bg-surface px-2.5 py-1.5 text-sm text-ink"
        />
      </Field>
      <Field label={t("common.to")}>
        <input
          type="date"
          value={value.end}
          onChange={(e) => setValue((v) => ({ ...v, end: e.target.value }))}
          className="rounded-mb-1 border border-rule bg-surface px-2.5 py-1.5 text-sm text-ink"
        />
      </Field>
      {showCountry && (
        <Field label={t("common.country")}>
          <select
            value={value.country}
            onChange={(e) => setValue((v) => ({ ...v, country: e.target.value }))}
            className="min-w-[12rem] rounded-mb-1 border border-rule bg-surface px-2.5 py-1.5 text-sm text-ink"
          >
            <option value="">{t("common.all_countries")}</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      )}

      <button
        type="button"
        onClick={() => onApply(value)}
        className="rounded-mb-1 bg-ink px-3 py-1.5 text-sm font-medium text-surface hover:opacity-90"
      >
        {t("common.apply")}
      </button>
      <button
        type="button"
        className="px-2 text-sm text-ink-muted hover:text-ink"
        onClick={() => {
          const cleared = { start: "", end: "", country: "" };
          setValue(cleared);
          onApply(cleared);
        }}
      >
        {t("common.reset")}
      </button>

      {datasetEnd && (
        <div className="flex w-full flex-wrap items-center gap-1.5 border-t border-rule pt-3 text-xs">
          <span className="text-ink-faint">Quick range:</span>
          {presetsFor(datasetEnd).map((preset) => (
            <Pill
              key={preset.key}
              onClick={() => applyPreset(preset.start, preset.end)}
            >
              {t(preset.label)}
            </Pill>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <label className="mb-1 text-[11px] text-ink-faint">{label}</label>
      {children}
    </div>
  );
}

interface Preset {
  key: string;
  label: string;
  start: string;
  end: string;
}

function presetsFor(datasetEndISO: string): Preset[] {
  const end = new Date(datasetEndISO);
  if (Number.isNaN(end.getTime())) return [];

  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const back = (days: number) => {
    const d = new Date(end);
    d.setDate(d.getDate() - days);
    return iso(d);
  };
  const ytdStart = `${end.getFullYear()}-01-01`;

  return [
    { key: "30d", label: "common.preset.30d", start: back(29), end: iso(end) },
    { key: "90d", label: "common.preset.90d", start: back(89), end: iso(end) },
    { key: "ytd", label: "common.preset.ytd", start: ytdStart, end: iso(end) },
    { key: "all", label: "common.preset.all", start: "", end: "" },
  ];
}
