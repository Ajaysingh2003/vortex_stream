"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, Calendar, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      style={{ height }}
      className="w-full bg-white border border-stone-200 rounded-xl p-5 flex flex-col justify-between"
    >
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="flex items-end gap-2 h-44 w-full pt-8 pb-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t-sm"
            style={{ height: `${20 + ((i * 17) % 75)}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full bg-white border border-stone-200 rounded-xl p-4">
      <div className="flex justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-stone-100 last:border-0">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  title = "No activity in this date range",
  description = "No viewer sessions or events were recorded for the selected filters.",
  onResetRange,
  className,
}: {
  title?: string;
  description?: string;
  onResetRange?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-white border border-stone-200 rounded-xl p-10 flex flex-col items-center justify-center text-center",
        className,
      )}
    >
      <div className="p-3 bg-stone-100 rounded-full text-stone-500 mb-3">
        <Calendar className="size-6" />
      </div>
      <h3 className="text-base font-semibold text-stone-800">{title}</h3>
      <p className="text-sm text-stone-500 max-w-sm mt-1 mb-4">{description}</p>
      {onResetRange && (
        <Button variant="outline" size="sm" onClick={onResetRange}>
          Reset to last 7 days
        </Button>
      )}
    </div>
  );
}

export function ErrorState({
  title = "Couldn't load report",
  message = "An error occurred while fetching analytics. Please try again.",
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-white border border-rose-200 rounded-xl p-8 flex flex-col items-center justify-center text-center",
        className,
      )}
    >
      <div className="p-3 bg-rose-50 rounded-full text-rose-600 mb-3">
        <AlertCircle className="size-6" />
      </div>
      <h3 className="text-base font-semibold text-stone-800">{title}</h3>
      <p className="text-sm text-stone-500 max-w-sm mt-1 mb-4">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-2 border-stone-300"
        >
          <RefreshCcw className="size-3.5" />
          Try again
        </Button>
      )}
    </div>
  );
}

export function StaleDataBanner({
  asOf,
  onRefresh,
}: {
  asOf?: string;
  onRefresh?: () => void;
}) {
  return (
    <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2 rounded-lg flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        <AlertCircle className="size-3.5 text-amber-600 shrink-0" />
        <span>
          Showing last known values {asOf ? `as of ${new Date(asOf).toLocaleTimeString()}` : ""}. Real-time stream may be paused.
        </span>
      </div>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="text-amber-900 font-semibold underline underline-offset-2 hover:opacity-80"
        >
          Refresh now
        </button>
      )}
    </div>
  );
}
