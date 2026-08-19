"use client";

import React, { useMemo } from "react";
import { HardDrive, ArrowUpRight, Sparkles } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

type StorageCardProps = {
  usedBytes: number;
  limitGb: number;
  onUpgrade?: () => void;
};

function formatStorage(bytes: number) {
  if (!bytes || bytes <= 0) return "0 MB";
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(gb >= 10 ? 0 : 1)} GB`;
  return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
}

function StorageCard({ usedBytes = 0, limitGb, onUpgrade }: StorageCardProps) {
  const isUnlimited = limitGb === -1;

  const storage = useMemo(() => {
    const used = Math.max(0, usedBytes || 0);

    if (isUnlimited) {
      return {
        used: formatStorage(used),
        remaining: "Unlimited",
        percentage: 0,
        limit: "Unlimited",
        color: "#2172AC",
      };
    }

    const limitBytes = Math.max(0, limitGb) * 1024 ** 3;
    const calculatedPercentage = limitBytes > 0 ? (used / limitBytes) * 100 : 0;
    const percentage = Math.min(Math.round(calculatedPercentage), 100);
    const remaining = Math.max(0, limitBytes - used);

    // Dynamic warning status colors
    let color = "#2172AC"; // Primary brand blue
    if (percentage >= 90) {
      color = "#e11d48"; // Rose / Alert Red
    } else if (percentage >= 75) {
      color = "#f59e0b"; // Amber Warning
    }

    return {
      used: formatStorage(used),
      remaining: formatStorage(remaining),
      percentage,
      limit: `${limitGb} GB`,
      color,
    };
  }, [limitGb, usedBytes, isUnlimited]);

  const data = useMemo(() => {
    if (isUnlimited) {
      return [
        { name: "Used", value: 1 },
        { name: "Remaining", value: 99 },
      ];
    }
    return [
      { name: "Used", value: Math.max(storage.percentage, 0.1) },
      { name: "Remaining", value: Math.max(100 - storage.percentage, 0.1) },
    ];
  }, [storage.percentage, isUnlimited]);

  return (
    <div className="relative overflow-hidden rounded-lg border border-stone-200/80 bg-white p-5 shadow-sm transition-all hover:border-stone-100">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
            <HardDrive className="size-4" strokeWidth={1.8} />
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-tight text-stone-900">
              Plan Storage
            </h3>
            <p className="text-[11px] text-stone-400">
              plan capacity
            </p>
          </div>
        </div>

        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-600">
          {storage.limit}
        </span>
      </div>

      {/* Donut & Metrics Center */}
      <div className="mt-6 flex items-center gap-6">
        {/* Donut Chart */}
        <div
          className="relative size-[128px] shrink-0"
          aria-label={`${storage.used} of ${storage.limit} used`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={46}
                outerRadius={60}
                startAngle={90}
                endAngle={-270}
                cornerRadius={6}
                paddingAngle={isUnlimited ? 0 : 2}
                stroke="none"
              >
                <Cell fill={storage.color} />
                <Cell fill="#f5f5f4" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold leading-none tracking-tight text-stone-900">
              {isUnlimited ? "∞" : `${storage.percentage}%`}
            </span>
            <span className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-stone-400">
              {isUnlimited ? "Active" : "Used"}
            </span>
          </div>
        </div>

        {/* Storage Numerical Breakdown */}
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-[11px] font-medium text-stone-400">Used</p>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-xl font-bold tracking-tight text-stone-900">
                {storage.used}
              </span>
              <span className="text-xs text-stone-400">
                / {storage.limit}
              </span>
            </div>
          </div>

          <div className="h-px w-full bg-stone-100" />

          <div>
            <p className="text-[11px] font-medium text-stone-400">Available</p>
            <div className="mt-0.5 flex items-center gap-1">
              <span className="text-base font-semibold text-stone-800">
                {storage.remaining}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Callout Footer (Appears when >= 75% capacity) */}
      {!isUnlimited && storage.percentage >= 75 && (
        <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-xs">
          <span className="text-stone-500">Approaching quota limit</span>
          <button
            onClick={onUpgrade}
            className="flex items-center gap-1 font-semibold text-purple-600 hover:text-purple-700 transition-colors"
          >
            <Sparkles className="size-3" />
            <span>Upgrade</span>
            <ArrowUpRight className="size-3" />
          </button>
        </div>
      )}
    </div>
  );
}

export default StorageCard;