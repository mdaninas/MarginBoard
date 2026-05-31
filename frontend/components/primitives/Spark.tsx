"use client";

import { useMemo } from "react";
import { useThemeColors } from "@/lib/theme/ThemeProvider";

interface Props {
  /** Numeric series. Length is free; we resample to fit the width. */
  data?: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  /** Use accent (coral) or muted ink. */
  tone?: "accent" | "ink";
  fill?: boolean;
  /** Show a dashed forecast tail after the actual data ends. */
  forecast?: number[];
}

/**
 * Minimal SVG sparkline that scales to its container. Used in MetricCards
 * and tables where Recharts would be overkill (and slow).
 */
export function Spark({
  data,
  width = 240,
  height = 60,
  strokeWidth = 2,
  tone = "accent",
  fill = false,
  forecast,
}: Props) {
  const colors = useThemeColors();
  const stroke = tone === "accent" ? colors.accent : colors.inkMuted;
  const fillColor = tone === "accent" ? colors.accentSoft : colors.surface2;

  const { actualPath, areaPath, forecastPath, splitX } = useMemo(
    () => layout(data ?? defaultSeries(width), forecast, width, height),
    [data, forecast, width, height],
  );

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      {fill && areaPath && <path d={areaPath} fill={fillColor} stroke="none" />}
      <path
        d={actualPath}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {forecastPath && splitX !== null && (
        <>
          <line
            x1={splitX}
            y1={4}
            x2={splitX}
            y2={height - 4}
            stroke={stroke}
            strokeDasharray="3 3"
            opacity={0.4}
          />
          <path
            d={forecastPath}
            fill="none"
            stroke={colors.accent}
            strokeWidth={strokeWidth}
            strokeDasharray="4 3"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

function layout(
  series: number[],
  forecast: number[] | undefined,
  width: number,
  height: number,
) {
  if (series.length === 0) {
    return { actualPath: "", areaPath: null, forecastPath: null, splitX: null as number | null };
  }

  const all = [...series, ...(forecast ?? [])];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const padY = height * 0.15;
  const innerH = height - padY * 2;
  const splitFraction = forecast && forecast.length > 0 ? 0.62 : 1;
  const splitX = forecast && forecast.length > 0 ? width * splitFraction : null;

  const actualWidth = splitX ?? width;
  const actualPoints = series.map((value, i) => {
    const x = (i / Math.max(series.length - 1, 1)) * actualWidth;
    const y = height - padY - ((value - min) / span) * innerH;
    return [x, y] as const;
  });
  const actualPath = polyline(actualPoints);
  const areaPath =
    actualPoints.length > 1
      ? `${actualPath} L ${actualPoints[actualPoints.length - 1][0].toFixed(1)},${height} L 0,${height} Z`
      : null;

  if (!forecast || splitX === null) {
    return { actualPath, areaPath, forecastPath: null, splitX: null };
  }

  const startY = actualPoints[actualPoints.length - 1][1];
  const forecastWidth = width - splitX;
  const forecastPoints = [
    [splitX, startY] as const,
    ...forecast.map((value, i) => {
      const x = splitX + ((i + 1) / forecast.length) * forecastWidth;
      const y = height - padY - ((value - min) / span) * innerH;
      return [x, y] as const;
    }),
  ];

  return {
    actualPath,
    areaPath,
    forecastPath: polyline(forecastPoints),
    splitX,
  };
}

function polyline(points: readonly (readonly [number, number])[]): string {
  if (points.length === 0) return "";
  return points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
}

/** Deterministic placeholder used when no data is supplied. */
function defaultSeries(width: number): number[] {
  const n = Math.max(20, Math.floor(width / 12));
  return Array.from({ length: n }, (_, i) => {
    const t = i / n;
    return 50 + Math.sin(i * 0.7) * 12 + Math.cos(i * 1.3) * 6 + t * 20;
  });
}
