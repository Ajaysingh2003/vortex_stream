"use client";

import React, { useMemo } from "react";
import { Activity } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type BandwidthCardProps = {
  usedBytes?: number;
  limitGb?: number;
  dailyData?: { date: string; gb: number }[];
  periodStart?: string;
  periodEnd?: string;
};

function formatBandwidth(bytes: number) {
  if (!bytes || bytes <= 0) return "0.0 GB";
  const gb = bytes / 1024 ** 3;
  if (gb >= 1000) return `${(gb / 1024).toFixed(1)} TB`;
  return `${gb.toFixed(1)} GB`;
}

export default function BandwidthCard({
  usedBytes = 0,
  limitGb = 1000,
  dailyData = [],
  periodStart = "Current Month",
}: BandwidthCardProps) {
  const isUnlimited = limitGb === -1;

  const metrics = useMemo(() => {
    const usedFormatted = formatBandwidth(usedBytes);
    const limitFormatted = isUnlimited ? "Unlimited" : `${limitGb} GB`;

    let percentage = 0;
    if (!isUnlimited && limitGb > 0) {
      const limitBytes = limitGb * 1024 ** 3;
      percentage = Math.min(Math.round((usedBytes / limitBytes) * 100), 100);
    }

    return {
      used: usedFormatted,
      limit: limitFormatted,
      percentage,
    };
  }, [usedBytes, limitGb, isUnlimited]);

  const chartData = dailyData;

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-stone-200/80 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Activity className="size-4" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-stone-900">
              Monthly Bandwidth
            </h3>
            <p className="text-[11px] text-stone-400">{periodStart} Cycle</p>
          </div>
        </div>

        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-600">
          Limit: {metrics.limit}
        </span>
      </div>

      {/* Metrics */}
      <div className="mt-4 flex items-baseline justify-between">
        <div>
          <span className="text-2xl font-bold tracking-tight text-stone-900">
            {metrics.used}
          </span>
          <span className="ml-1.5 text-xs text-stone-400">used this month</span>
        </div>

        {!isUnlimited && (
          <span className="text-xs font-semibold text-stone-700">
            {metrics.percentage}% of quota
          </span>
        )}
      </div>

      {/* 30-Day Trend Chart - Set explicit height */}
      <div className="mt-4 h-32 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="bandwidthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: "#a8a29e" }}
              interval={0}
              tickFormatter={(value: string) => {
                const date = new Date(`${value}T00:00:00Z`);
                const nextDate = new Date(date);
                nextDate.setUTCDate(date.getUTCDate() + 1);

                // Keep every day in the line, but label only Sundays and
                // the final calendar day of the month.
                if (
                  date.getUTCDay() !== 0 &&
                  nextDate.getUTCMonth() === date.getUTCMonth()
                ) {
                  return "";
                }

                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                  timeZone: "UTC",
                });
              }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: "#a8a29e" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1c1917",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "12px",
              }}
              formatter={(value: unknown) => [`${Number(value ?? 0)} GB`, "Daily Usage"]}
            />
            <Area
              type="monotone"
              dataKey="gb"
              stroke="#2563eb"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#bandwidthGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
