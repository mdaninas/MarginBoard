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
import { formatNumber } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/I18nProvider";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

interface Props {
  data: { segment: string; revenue_share: number; customers: number }[];
}

/**
 * Revenue-share-by-segment bars. Own module so the Customers page can load
 * Recharts lazily (next/dynamic).
 */
export function SegmentShareChart({ data }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: colors.inkFaint }}
            tickFormatter={(v) => `${v}%`}
            stroke={colors.border}
          />
          <YAxis
            type="category"
            dataKey="segment"
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
            formatter={(value: number, key) =>
              key === "revenue_share"
                ? [`${value.toFixed(1)}%`, t("customers.col.revenue_share")]
                : [formatNumber(value), t("customers.col.customer_count")]
            }
          />
          <Bar dataKey="revenue_share" fill={colors.accent} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
