"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "@/lib/i18n/I18nProvider";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

interface Props {
  data: { name: string; importance: number }[];
}

/**
 * Horizontal bar chart of model feature importances. Isolated in its own
 * module so the Forecasting page can load Recharts lazily (next/dynamic).
 */
export function FeatureImportanceChart({ data }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: colors.inkFaint }}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            domain={[0, "dataMax"]}
            stroke={colors.border}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: colors.ink }}
            width={110}
            stroke={colors.border}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.surface,
              color: colors.ink,
              fontSize: 12,
            }}
            formatter={(value: number) => [
              `${(value * 100).toFixed(2)}%`,
              t("forecasting.col.importance"),
            ]}
          />
          <Bar dataKey="importance" fill={colors.accent} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
