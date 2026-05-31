"use client";

import dynamic from "next/dynamic";

/**
 * Lazy chart entry points. Recharts is ~50 kB gzipped; loading it through
 * next/dynamic with `ssr: false` keeps it out of each page's initial JS bundle
 * and fetches it as a separate chunk only when a chart actually mounts. The
 * loading fallbacks reserve the chart's height to avoid layout shift.
 */

export const ForecastChartLazy = dynamic(
  () => import("./ForecastChart").then((m) => m.ForecastChart),
  { ssr: false, loading: () => <div className="h-72" /> },
);

export const FeatureImportanceChartLazy = dynamic(
  () => import("./FeatureImportanceChart").then((m) => m.FeatureImportanceChart),
  { ssr: false, loading: () => <div className="h-56" /> },
);

export const SegmentShareChartLazy = dynamic(
  () => import("./SegmentShareChart").then((m) => m.SegmentShareChart),
  { ssr: false, loading: () => <div className="h-72" /> },
);

export const ParetoChartLazy = dynamic(
  () => import("./ParetoChart").then((m) => m.ParetoChart),
  { ssr: false, loading: () => <div className="h-24" /> },
);
