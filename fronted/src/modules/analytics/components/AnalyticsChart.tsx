"use client";

import React, { useId, useMemo, useState } from "react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  LineChart,
  Table2,
} from "lucide-react";

import { formatDuration, formatNumber, formatPercent } from "../lib/format";
import { cn } from "@/lib/utils";

export interface DataPoint {
  key: string;
  value: number;
  label?: string;
  comparisonValue?: number;
}

interface AnalyticsChartProps {
  title: string;
  description?: string;
  data: DataPoint[];
  unit?: "number" | "duration" | "percent";
  type?: "line" | "bar";
  height?: number;
  metricLabel?: string;
  comparisonLabel?: string;
  actions?: React.ReactNode;
  className?: string;
}

type ViewMode = "line" | "bar" | "table";

interface TooltipPayloadItem {
  value?: number | string;
  name?: string;
  dataKey?: string;
  payload?: DataPoint;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  metricLabel: string;
  comparisonLabel: string;
  formatValue: (value: number) => string;
  formatLabel: (value: string) => string;
}

function ChartTooltip({
  active,
  payload,
  label,
  metricLabel,
  comparisonLabel,
  formatValue,
  formatLabel,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const current = payload.find((item) => item.dataKey === "value");
  const comparison = payload.find((item) => item.dataKey === "comparisonValue");

  const currentValue =
    current?.value !== undefined ? Number(current.value) : undefined;

  const comparisonValue =
    comparison?.value !== undefined ? Number(comparison.value) : undefined;

  const difference =
    currentValue !== undefined &&
    comparisonValue !== undefined &&
    comparisonValue !== 0
      ? ((currentValue - comparisonValue) / comparisonValue) * 100
      : null;

  return (
    <div className="min-w-[210px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#111214]/95 text-white shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-3.5 py-2.5">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
          {formatLabel(String(label ?? ""))}
        </p>

        {difference !== null && (
          <div
            className={cn(
              "flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold",
              difference >= 0
                ? "bg-[#d1ff46]/10 text-[#d1ff46]"
                : "bg-red-400/10 text-red-300",
            )}
          >
            {difference >= 0 ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {Math.abs(difference).toFixed(1)}%
          </div>
        )}
      </div>

      <div className="space-y-2.5 px-3.5 py-3">
        {currentValue !== undefined && (
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#7667ff]" />
              <span className="text-xs font-medium text-white/65">
                {metricLabel}
              </span>
            </div>

            <span className="font-mono text-xs font-semibold tabular-nums text-white">
              {formatValue(currentValue)}
            </span>
          </div>
        )}

        {comparisonValue !== undefined && (
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#2dd4bf]" />
              <span className="text-xs font-medium text-white/45">
                {comparisonLabel}
              </span>
            </div>

            <span className="font-mono text-xs tabular-nums text-white/55">
              {formatValue(comparisonValue)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
  accent,
  isLast,
}: {
  label: string;
  value: string;
  helper?: React.ReactNode;
  accent?: "violet" | "teal" | "lime" | "neutral";
  isLast?: boolean;
}) {
  const accentClass = {
    violet: "bg-[#7667ff]",
    teal: "bg-[#2dd4bf]",
    lime: "bg-[#d1ff46]",
    neutral: "bg-neutral-300 dark:bg-neutral-700",
  }[accent ?? "neutral"];

  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-col justify-between px-4 py-3.5 sm:px-5 sm:py-4",
        "border-b border-black/[0.055] dark:border-white/[0.07]",
        "sm:border-b-0",
        !isLast && "border-r border-black/[0.055] dark:border-white/[0.07]",
      )}
    >
      <span
        className={cn(
          "absolute left-0 top-0 h-[2px] w-full opacity-0 transition-opacity duration-200 group-hover:opacity-100",
          accentClass,
        )}
      />

      <div className="flex items-center gap-2">
        {/* <span className={cn("size-1.5 shrink-0 rounded-full", accentClass)} /> */}
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500">
          {label}
        </p>
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2">
        <p className="truncate font-mono text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl dark:text-white">
          {value}
        </p>
        {helper && <div className="shrink-0">{helper}</div>}
      </div>
    </div>
  );
}

function ViewSwitcher({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}) {
  const items = [
    { value: "line" as const, label: "Trend", icon: LineChart },
    { value: "bar" as const, label: "Bars", icon: BarChart3 },
    { value: "table" as const, label: "Table", icon: Table2 },
  ];

  return (
    <div className="flex items-center rounded-lg border border-black/[0.07] bg-neutral-100/80 p-0.5 dark:border-white/[0.08] dark:bg-white/[0.04]">
      {items.map((item) => {
        const Icon = item.icon;
        const active = value === item.value;

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition-all",
              active
                ? "bg-white text-neutral-950 shadow-xs dark:bg-white/[0.1] dark:text-white"
                : "text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-neutral-200",
            )}
          >
            <Icon className="size-3.5" />
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function AnalyticsChart({
  title,
  description,
  data,
  unit = "number",
  type: defaultType = "line",
  height = 320,
  metricLabel = "Current",
  comparisonLabel,
  actions,
  className,
}: AnalyticsChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultType);
  const id = useId().replace(/:/g, "");

  const currentGradientId = `current-gradient-${id}`;
  const comparisonGradientId = `comparison-gradient-${id}`;

  const hasComparison = useMemo(
    () => data.some((point) => point.comparisonValue !== undefined),
    [data],
  );

  const previousLabel = comparisonLabel || "Previous";

  const formatTickValue = (value: number) => {
    if (unit === "percent") return `${value}%`;
    if (unit === "duration") return formatDuration(value);
    if (Math.abs(value) >= 1_000_000)
      return `${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
    return formatNumber(value);
  };

  const formatTooltipValue = (value: number) => {
    if (unit === "percent") return formatPercent(value);
    if (unit === "duration") return formatDuration(value);
    return formatNumber(value);
  };

  const formatXAxisLabel = (tick: string) => {
    if (!tick) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(tick)) {
      const [, month, day] = tick.split("-");
      return `${month}/${day}`;
    }
    if (tick.includes("T")) {
      const date = new Date(tick);
      if (!Number.isNaN(date.getTime())) {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        if (hours !== 0 || minutes !== 0 || seconds !== 0) {
          return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
        }
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }
    }
    return tick;
  };

  const formatTooltipLabel = (tick: string) => {
    if (!tick) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(tick)) {
      const [, month, day] = tick.split("-");
      return `${month}/${day}`;
    }
    if (tick.includes("T")) {
      const date = new Date(tick);
      if (!Number.isNaN(date.getTime())) {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        if (hours !== 0 || minutes !== 0 || seconds !== 0) {
          return `${date.getMonth() + 1}/${date.getDate()} ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
        }
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }
    }
    return tick;
  };

  const stats = useMemo(() => {
    if (!data.length) {
      return { total: 0, average: 0, peak: 0, latest: 0, delta: 0 };
    }

    const values = data.map((point) => Number(point.value) || 0);
    const total = values.reduce((sum, value) => sum + value, 0);
    const average = total / values.length;
    const peak = Math.max(...values);
    const latest = values[values.length - 1];
    const previous = values.length > 1 ? values[values.length - 2] : values[0];
    const delta = previous !== 0 ? ((latest - previous) / previous) * 100 : 0;

    return { total, average, peak, latest, delta };
  }, [data]);

  const empty = data.length === 0;

  return (
    <section
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl",
        "border border-black/[0.08] bg-white dark:border-white/[0.08] dark:bg-[#0c0d0f]",
        "shadow-xs",
        className,
      )}
    >
      {/* Top Accent Strip */}
      <div className="absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-[#7667ff]/70 to-transparent" />

      {/* Header */}
      <header className="flex flex-col gap-3.5 border-b border-black/[0.055] px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#7667ff]/20 bg-[#7667ff]/10 text-[#6657ef] dark:text-[#9e94ff]">
            <Activity className="size-4" />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold tracking-tight text-neutral-950 dark:text-white">
              {title}
            </h3>
            {description && (
              <p className="truncate text-xs text-neutral-500">{description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5">
          {actions && <div className="flex items-center gap-2">{actions}</div>}
          <ViewSwitcher value={viewMode} onChange={setViewMode} />
        </div>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 border-b border-black/[0.055] sm:grid-cols-4 dark:border-white/[0.07]">
        <MetricCard
          label="Latest"
          value={formatTooltipValue(stats.latest)}
          accent="violet"
        />
        <MetricCard
          label="Average"
          value={formatTooltipValue(stats.average)}
          accent="teal"
        />
        <MetricCard
          label="Peak"
          value={formatTooltipValue(stats.peak)}
          accent="neutral"
        />
        <MetricCard
          label="Change"
          value={`${Math.abs(stats.delta).toFixed(1)}%`}
          accent={stats.delta >= 0 ? "lime" : "neutral"}
          isLast
          helper={
            <div
              className={cn(
                "flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                stats.delta >= 0
                  ? "bg-[#d1ff46]/20 text-[#4c6300] dark:text-[#d1ff46]"
                  : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
              )}
            >
              {stats.delta >= 0 ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              <span>{Math.abs(stats.delta).toFixed(1)}%</span>
            </div>
          }
        />
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-5">
        {empty ? (
          <div
            style={{ height }}
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-black/[0.08] text-center dark:border-white/[0.08]"
          >
            <BarChart3 className="size-5 text-neutral-400" />
            <p className="mt-2 text-xs font-medium text-neutral-700 dark:text-neutral-300">
              No data available
            </p>
          </div>
        ) : viewMode === "table" ? (
          /* Table View */
          <div
            style={{ height }}
            className="overflow-hidden rounded-xl border border-black/[0.06] bg-neutral-50/50 dark:border-white/[0.07] dark:bg-white/[0.01]"
          >
            <div className="h-full overflow-auto">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 border-b border-black/[0.06] bg-white/95 backdrop-blur-sm dark:border-white/[0.07] dark:bg-[#0c0d0f]/95">
                  <tr>
                    <th className="px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                      Timestamp
                    </th>
                    <th className="px-4 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                      {metricLabel}
                    </th>
                    {hasComparison && (
                      <>
                        <th className="px-4 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                          {previousLabel}
                        </th>
                        <th className="px-4 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                          Diff
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {data.map((point, index) => {
                    const comparison =
                      point.comparisonValue !== undefined
                        ? Number(point.comparisonValue)
                        : undefined;
                    const diff =
                      comparison !== undefined && comparison !== 0
                        ? ((point.value - comparison) / comparison) * 100
                        : null;

                    return (
                      <tr
                        key={`${point.key}-${index}`}
                        className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-2 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                          {point.label || formatXAxisLabel(point.key)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-xs font-semibold tabular-nums text-neutral-950 dark:text-white">
                          {formatTooltipValue(point.value)}
                        </td>
                        {hasComparison && (
                          <>
                            <td className="px-4 py-2 text-right font-mono text-xs tabular-nums text-neutral-500">
                              {comparison !== undefined
                                ? formatTooltipValue(comparison)
                                : "—"}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {diff !== null ? (
                                <span
                                  className={cn(
                                    "font-mono text-[10px] font-semibold",
                                    diff >= 0
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-red-500",
                                  )}
                                >
                                  {diff >= 0 ? "+" : ""}
                                  {diff.toFixed(1)}%
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Graph Views */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#7667ff]" />
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    {metricLabel}
                  </span>
                </div>
                {hasComparison && (
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#2dd4bf]" />
                    <span className="font-medium text-neutral-500">
                      {previousLabel}
                    </span>
                  </div>
                )}
              </div>

              <span className="font-mono text-[11px] text-neutral-400">
                {data.length} records
              </span>
            </div>

            <div style={{ height }} className="w-full">
              <ResponsiveContainer width="100%" height="100%">
                {viewMode === "bar" ? (
                  <BarChart
                    data={data}
                    margin={{ top: 8, right: 0, bottom: 0, left: -14 }}
                    barGap={4}
                    barCategoryGap="28%"
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="currentColor"
                      strokeOpacity={0.07}
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="key"
                      tickFormatter={formatXAxisLabel}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={28}
                      dy={6}
                      tick={{
                        fill: "#a3a3a3",
                        fontSize: 10,
                        fontFamily: "monospace",
                      }}
                    />
                    <YAxis
                      tickFormatter={formatTickValue}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                      tick={{
                        fill: "#a3a3a3",
                        fontSize: 10,
                        fontFamily: "monospace",
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(118, 103, 255, 0.04)" }}
                      wrapperStyle={{ outline: "none" }}
                      content={
                        <ChartTooltip
                          metricLabel={metricLabel}
                          comparisonLabel={previousLabel}
                          formatValue={formatTooltipValue}
                          formatLabel={formatTooltipLabel}
                        />
                      }
                    />
                    {hasComparison && (
                      <Bar
                        dataKey="comparisonValue"
                        fill="#2dd4bf"
                        fillOpacity={0.25}
                        radius={[3, 3, 0, 0]}
                        maxBarSize={28}
                      />
                    )}
                    <Bar
                      dataKey="value"
                      fill="#7667ff"
                      radius={[3, 3, 0, 0]}
                      maxBarSize={28}
                    />
                  </BarChart>
                ) : (
                  <AreaChart
                    data={data}
                    margin={{ top: 8, right: 0, bottom: 0, left: -14 }}
                  >
                    <defs>
                      <linearGradient
                        id={currentGradientId}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#7667ff"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="60%"
                          stopColor="#7667ff"
                          stopOpacity={0.04}
                        />
                        <stop
                          offset="100%"
                          stopColor="#7667ff"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id={comparisonGradientId}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#2dd4bf"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="100%"
                          stopColor="#2dd4bf"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      vertical={false}
                      stroke="currentColor"
                      strokeOpacity={0.07}
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="key"
                      tickFormatter={formatXAxisLabel}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={28}
                      dy={6}
                      tick={{
                        fill: "#a3a3a3",
                        fontSize: 10,
                        fontFamily: "monospace",
                      }}
                    />
                    <YAxis
                      tickFormatter={formatTickValue}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                      tick={{
                        fill: "#a3a3a3",
                        fontSize: 10,
                        fontFamily: "monospace",
                      }}
                    />
                    <Tooltip
                      cursor={{
                        stroke: "#7667ff",
                        strokeOpacity: 0.25,
                        strokeWidth: 1,
                        strokeDasharray: "3 3",
                      }}
                      wrapperStyle={{ outline: "none" }}
                      content={
                        <ChartTooltip
                          metricLabel={metricLabel}
                          comparisonLabel={previousLabel}
                          formatValue={formatTooltipValue}
                          formatLabel={formatTooltipLabel}
                        />
                      }
                    />
                    {hasComparison && (
                      <Area
                        type="monotone"
                        dataKey="comparisonValue"
                        stroke="#2dd4bf"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        fill={`url(#${comparisonGradientId})`}
                        dot={false}
                        connectNulls
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#7667ff"
                      strokeWidth={2}
                      fill={`url(#${currentGradientId})`}
                      dot={false}
                      connectNulls
                      activeDot={{
                        r: 4,
                        fill: "#d1ff46",
                        stroke: "#7667ff",
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
