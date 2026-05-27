"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { apiGet } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/I18nProvider";
import type { MethodologyResponse, MethodologySection } from "@/types/api";

export default function MethodologyPage() {
  const { t, locale } = useTranslation();
  const [data, setData] = useState<MethodologyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiGet<MethodologyResponse>("/methodology", { lang: locale });
      setData(resp);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("methodology.title")} description={t("methodology.description")} />

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Section data={data.dataset} />
          <Section data={data.data_cleaning} />
          <Section data={data.revenue} />
          <Section data={data.forecasting} />
          <Section data={data.inventory} />
          <Section data={data.transactions} />
          <div className="lg:col-span-2">
            <Section data={data.limitations} />
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ data }: { data: MethodologySection }) {
  return (
    <section className="card p-5">
      <h2 className="font-semibold mb-3">{data.title}</h2>
      <ul className="space-y-2 text-sm text-ink-muted list-disc list-outside pl-5">
        {data.body.map((line, idx) => (
          <li key={idx}>{line}</li>
        ))}
      </ul>
    </section>
  );
}
