"use client";

import React, { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "../../components/MetricCard";
import { CountryMap } from "../../components/CountryMap";
import { CountryTable } from "../../components/CountryTable";
import { TableSkeleton } from "../../components/ReportState";
import { normalizeCountryBreakdown } from "../../lib/country-activity";
import { formatNumber, formatDuration, formatPercent } from "../../lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DateRangeState } from "../../lib/date-range";

interface AudienceSectionProps {
  videoId?: string;
  range: DateRangeState;
}

const DIMENSIONS = [
  { value: "country", label: "Country" },
  { value: "referrer", label: "Referrer origin" },
  { value: "device", label: "Device type" },
  { value: "browser", label: "Browser" },
  { value: "os", label: "Operating system" },
  { value: "utm_source", label: "UTM Source" },
  { value: "utm_medium", label: "UTM Medium" },
  { value: "utm_campaign", label: "UTM Campaign" },
  { value: "surface", label: "Player surface (embed vs page)" },
] as const;

export function AudienceSection({ videoId, range }: AudienceSectionProps) {
  const trpc = useTRPC();
  const [selectedDimension, setSelectedDimension] = useState<string>("country");

  // Summary for totals
  const { data: summary, isLoading: isSummaryLoading } = useQuery(
    trpc.analytics.summary.queryOptions({
      videoId,
      from: range.from,
      to: range.to,
    }),
  );

  // Breakdown Query for active dimension
  const { data: breakdownData, isLoading: isBreakdownLoading } = useQuery(
    trpc.analytics.breakdown.queryOptions({
      videoId,
      from: range.from,
      to: range.to,
      dimension: selectedDimension,
      limit: 100,
    }),
  );

  const current = summary?.current;
  const items = breakdownData?.items || [];
  const normalizedCountries = normalizeCountryBreakdown(items, "views");

  return (
    <div className="space-y-6">
      {/* Context Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Views"
          value={formatNumber(current?.views)}
          currentRaw={current?.views}
          previousRaw={summary?.previous?.views}
          loading={isSummaryLoading}
          description="sessions in this period"
        />
        <MetricCard
          title="Unique Viewers"
          value={formatNumber(current?.unique_viewers)}
          currentRaw={current?.unique_viewers}
          previousRaw={summary?.previous?.unique_viewers}
          loading={isSummaryLoading}
          description="distinct client devices"
        />
        <MetricCard
          title="Total Watch Time"
          value={formatDuration(current?.playback_ms)}
          currentRaw={current?.playback_ms}
          previousRaw={summary?.previous?.playback_ms}
          loading={isSummaryLoading}
          description="across all audience segments"
        />
      </div>

      {/* If dimension is country: Map + Table view */}
      {selectedDimension === "country" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <CountryMap countries={normalizedCountries} measureLabel="Views" />
          </div>
          <div className="lg:col-span-5">
            <CountryTable countries={normalizedCountries} maxRows={15} measureLabel="Views" />
          </div>
        </div>
      )}

      {/* Main Breakdown Section with Dimension Selector */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-stone-900 tracking-tight">
              Audience Breakdown
            </h3>
            <p className="text-xs text-stone-500">
              Aggregated views, unique viewers, and watch duration by dimension
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 font-medium">Dimension:</span>
            <Select
              value={selectedDimension}
              onValueChange={setSelectedDimension}
            >
              <SelectTrigger className="h-8 text-xs bg-stone-50 border-stone-200 text-stone-800 font-medium min-w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-stone-200">
                {DIMENSIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value} className="text-xs">
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Breakdown Table */}
        {isBreakdownLoading ? (
          <TableSkeleton rows={8} />
        ) : (
          <div className="w-full overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-stone-400 font-medium">
                  <th className="py-2.5 pr-4 uppercase tracking-wider text-[11px]">
                    {DIMENSIONS.find((d) => d.value === selectedDimension)?.label}
                  </th>
                  <th className="py-2.5 px-3 text-right">Views</th>
                  <th className="py-2.5 px-3 text-right">Unique viewers</th>
                  <th className="py-2.5 px-3 text-right">Playing time</th>
                  <th className="py-2.5 pl-3 text-right">Completion rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400">
                      No breakdown data recorded for {selectedDimension}
                    </td>
                  </tr>
                ) : (
                  items.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-stone-50/70 transition-colors"
                    >
                      <td className="py-2.5 pr-4 font-medium text-stone-800 max-w-sm truncate">
                        {row.key || "Direct / Unknown"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-900 tabular-nums">
                        {formatNumber(row.metrics.views)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-600 tabular-nums">
                        {formatNumber(row.metrics.unique_viewers)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-600 tabular-nums">
                        {formatDuration(row.metrics.playback_ms)}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-mono text-stone-600 tabular-nums">
                        {formatPercent(row.metrics.completion_rate, row.metrics.views)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
