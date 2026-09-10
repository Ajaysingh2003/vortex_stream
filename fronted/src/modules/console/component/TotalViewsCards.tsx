"use client";

import React from "react";
import { Eye, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";

// Matching your stone / neutral UI palette with YouTube green/pink accent
const ACCENT_COLOR = "#0CC23D";

type DailyViewPoint = {
  date: string;
  views: number;
};

type TotalViewsCardProps = {
  totalViews?: number;
  percentageChange?: number; // e.g. +14.2% vs previous 28 days
  trendData?: DailyViewPoint[];
  periodLabel?: string;
  onViewDetails?: () => void;
};

// Fallback sample data representing a 28-day trajectory
const defaultTrend: DailyViewPoint[] = Array.from({ length: 28 }, (_, i) => ({
  date: `Day ${i + 1}`,
  views: Math.floor(1200 + Math.random() * 800 + (i > 18 ? i * 80 : 0)),
}));

export default function TotalViewsCard({
  totalViews = 48250,
  percentageChange = 14.8,
  trendData = defaultTrend,
  periodLabel = "Last 28 days",
  onViewDetails,
}: TotalViewsCardProps) {
  const isPositive = percentageChange >= 0;

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-stone-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:border-stone-300 hover:shadow-md">
      {/* Background Accent Glow */}
      <div
        className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20"
        style={{ backgroundColor: ACCENT_COLOR }}
      />

      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex size-9 items-center justify-center rounded-xl ring-1 ring-black/5"
            style={{
              backgroundColor: `${ACCENT_COLOR}15`,
              color: ACCENT_COLOR,
            }}
          >
            <Eye className="size-4" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-stone-900">
              Total Views
            </h3>
            <p className="text-[11px] text-stone-400">{periodLabel}</p>
          </div>
        </div>

        {/* Growth Badge */}
        <div
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            isPositive
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200/50"
              : "bg-rose-50 text-rose-600 border border-rose-200/50"
          }`}
        >
          {isPositive ? (
            <ArrowUpRight className="size-3.5" />
          ) : (
            <ArrowDownRight className="size-3.5" />
          )}
          <span>{Math.abs(percentageChange)}%</span>
        </div>
      </div>

      {/* Main KPI Stat */}
      <div className="mt-4 flex items-baseline justify-between">
        <div>
          <span className="text-2xl font-bold tracking-tight text-stone-900">
            {totalViews.toLocaleString()}
          </span>
          <span className="ml-1.5 text-xs text-stone-400">views</span>
        </div>
        <span className="text-[11px] font-medium text-stone-400">
          vs. previous period
        </span>
      </div>

      {/* Sparkline / Area Chart */}
      <div className="mt-3 h-16 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="viewGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACCENT_COLOR} stopOpacity={0.35} />
                <stop offset="100%" stopColor={ACCENT_COLOR} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-md border border-stone-200 bg-stone-900 px-2 py-1 text-[10px] text-white shadow-md">
                      <span className="font-semibold">
                        {payload[0].value?.toLocaleString()}
                      </span>{" "}
                      views
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke={ACCENT_COLOR}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#viewGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info & Action Link */}
      <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-xs">
        <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
          <TrendingUp className="size-3.5 text-emerald-500" />
          <span>Higher than usual activity</span>
        </div>

        {onViewDetails && (
          <button
            onClick={onViewDetails}
            style={{ color: ACCENT_COLOR }}
            className="group/btn flex items-center gap-1 font-semibold transition-opacity hover:opacity-80"
          >
            <span>Analytics</span>
            <ArrowUpRight className="size-3.5 transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
          </button>
        )}
      </div>
    </div>
  );
}