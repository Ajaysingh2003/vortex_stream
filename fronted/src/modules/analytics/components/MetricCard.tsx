"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDelta, type DeltaResult } from "../lib/format";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value?: string | number | null;
  currentRaw?: number | null;
  previousRaw?: number | null;
  isRate?: boolean;
  inverse?: boolean; // lower is better (e.g. errors, startup latency)
  description?: string;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

export function MetricCard({
  title,
  value,
  currentRaw,
  previousRaw,
  isRate = false,
  inverse = false,
  description,
  loading = false,
  className,
  onClick,
}: MetricCardProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "bg-white border border-stone-200 rounded-xl p-5 flex flex-col justify-between shadow-sm",
          className,
        )}
      >
        <Skeleton className="h-4 w-28 mb-3" />
        <Skeleton className="h-8 w-36 mb-2" />
        <Skeleton className="h-4 w-20" />
      </div>
    );
  }

  const delta: DeltaResult | null =
    currentRaw !== undefined && previousRaw !== undefined
      ? formatDelta(currentRaw, previousRaw, isRate, inverse)
      : null;

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white border shadow-sm border-stone-200 rounded-xl p-5 flex flex-col justify-between zshadow-xs transition-colors",
        onClick && "cursor-pointer hover:border-stone-300 hover:bg-stone-50/50",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-stone-500 tracking-tight">
          {title}
        </span>
      </div>

      <div className="my-1">
        <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 font-heading tabular-nums">
          {value ?? "—"}
        </span>
      </div>

      <div className="flex items-center gap-2 mt-2 min-h-5 text-xs">
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded text-[11px] tabular-nums",
              delta.isPositive && "bg-emerald-50 text-emerald-700",
              delta.isNegative && "bg-rose-50 text-rose-700",
              delta.isNeutral && "bg-stone-100 text-stone-600",
            )}
          >
            {delta.isPositive && <ArrowUpRight className="size-3 shrink-0" />}
            {delta.isNegative && <ArrowDownRight className="size-3 shrink-0" />}
            {delta.isNeutral && <Minus className="size-2.5 shrink-0" />}
            {delta.text}
          </span>
        )}
        {description && (
          <span className="text-stone-400 text-xs truncate" title={description}>
            {description}
          </span>
        )}
      </div>
    </div>
  );
}
