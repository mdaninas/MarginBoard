"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

interface Props {
  data: { rank: number; cumulative: number }[];
  /** "mini" is the compact hero strip; "full" is the labelled section chart. */
  variant?: "mini" | "full";
}

/**
 * Cumulative-revenue Pareto curve. Own module so the Products page can load
 * Recharts lazily (next/dynamic). The "mini" variant drops axes/labels for
 * the concentration hero; "full" shows the 80% / 95% reference lines.
 */
export function ParetoChart({ data, variant = "full" }: Props) {
  const colors = useThemeColors();

  if (variant === "mini") {
    return (
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
            <XAxis dataKey="rank" hide />
            <YAxis
              tick={{ fontSize: 10, fill: colors.inkFaint }}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
              width={32}
              stroke={colors.border}
            />
            <ReferenceLine y={80} stroke={colors.accentInk} strokeDasharray="3 3" />
            <Line type="monotone" dataKey="cumulative" stroke={colors.accent} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
          <XAxis dataKey="rank" tick={{ fontSize: 11, fill: colors.inkFaint }} stroke={colors.border} />
          <YAxis
            tick={{ fontSize: 11, fill: colors.inkFaint }}
            tickFormatter={(v) => `${v}%`}
            domain={[0, 100]}
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
            formatter={(v: number) => [`${v.toFixed(2)}%`, "Cumulative"]}
            labelFormatter={(v) => `Rank ${v}`}
          />
          <ReferenceLine
            y={80}
            stroke={colors.inkFaint}
            strokeDasharray="3 3"
            label={{ value: "80%", position: "right", fill: colors.inkFaint, fontSize: 10 }}
          />
          <ReferenceLine
            y={95}
            stroke={colors.inkFaint}
            strokeDasharray="3 3"
            label={{ value: "95%", position: "right", fill: colors.inkFaint, fontSize: 10 }}
          />
          <Line type="monotone" dataKey="cumulative" stroke={colors.accent} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
