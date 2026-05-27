"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompact, formatCurrency, formatDate } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/I18nProvider";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

interface Point {
  date: string;
  revenue: number;
}

export function TrendChart({ data }: { data: Point[] }) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <div className="card p-4 h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: colors.inkMuted }}
            tickFormatter={(v) => formatDate(v)}
            minTickGap={32}
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
            formatter={(v: number) => [formatCurrency(v), t("overview.col.revenue")]}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke={colors.accent}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
