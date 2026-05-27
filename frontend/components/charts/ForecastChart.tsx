"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo } from "react";
import type { ForecastPoint } from "@/types/api";
import { formatCompact, formatCurrency, formatDate } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/I18nProvider";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

interface Props {
  data: ForecastPoint[];
}

interface MergedPoint {
  date: string;
  historical?: number;
  forecast?: number;
}

export function ForecastChart({ data }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const merged = useMemo<MergedPoint[]>(() => {
    const map = new Map<string, MergedPoint>();
    for (const p of data) {
      const entry = map.get(p.date) ?? { date: p.date };
      if (p.type === "historical") entry.historical = p.revenue;
      else entry.forecast = p.revenue;
      map.set(p.date, entry);
    }
    const sorted = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    const firstForecastIdx = sorted.findIndex((p) => p.forecast !== undefined);
    if (firstForecastIdx > 0) {
      const lastHistorical = sorted[firstForecastIdx - 1];
      if (lastHistorical?.historical !== undefined) {
        lastHistorical.forecast = lastHistorical.historical;
      }
    }
    return sorted;
  }, [data]);

  return (
    <div className="card p-4 h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={merged} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: colors.inkMuted }}
            tickFormatter={(v) => formatDate(v)}
            minTickGap={40}
            stroke={colors.border}
          />
          <YAxis
            tick={{ fontSize: 11, fill: colors.inkMuted }}
            tickFormatter={(v) => formatCompact(v)}
            width={56}
            stroke={colors.border}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.surface,
              color: colors.ink,
              fontSize: 12,
            }}
            labelFormatter={(v) => formatDate(v as string)}
            formatter={(v: number, name) => [
              formatCurrency(v),
              name === "historical"
                ? t("forecasting.legend.historical")
                : t("forecasting.legend.forecast"),
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: colors.ink }}
            iconType="plainline"
            formatter={(value) =>
              value === "historical"
                ? t("forecasting.legend.historical")
                : t("forecasting.legend.forecast")
            }
          />
          <Line
            type="monotone"
            dataKey="historical"
            stroke={colors.ink}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke={colors.accent}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
