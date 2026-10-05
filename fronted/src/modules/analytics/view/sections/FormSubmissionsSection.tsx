"use client";

import React, { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "../../components/MetricCard";
import { AnalyticsChart, type DataPoint } from "../../components/AnalyticsChart";
import { ChartSkeleton, TableSkeleton } from "../../components/ReportState";
import { formatNumber, formatPercent } from "../../lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { DateRangeState, IntervalChoice } from "../../lib/date-range";

type AttrDimension =
  | "country"
  | "utm_campaign"
  | "utm_source"
  | "utm_medium"
  | "referrer"
  | "surface";

interface FormSubmissionsSectionProps {
  videoId?: string;
  range: DateRangeState;
  interval: IntervalChoice;
}

export function FormSubmissionsSection({
  videoId,
  range,
  interval,
}: FormSubmissionsSectionProps) {
  const trpc = useTRPC();
  const [attrDimension, setAttrDimension] = useState<AttrDimension>("country");

  // Summary
  const { data: summary, isLoading: isSummaryLoading } = useQuery(
    trpc.analytics.summary.queryOptions({
      videoId,
      from: range.from,
      to: range.to,
    }),
  );

  // Submissions Series
  const { data: seriesPoints, isLoading: isSeriesLoading } = useQuery(
    trpc.analytics.series.queryOptions({
      videoId,
      from: range.from,
      to: range.to,
      interval,
      metric: "form_submissions",
    }),
  );

  // Authoritative Lead Attribution
  const { data: attrReport, isLoading: isAttrLoading } = useQuery(
    trpc.analytics.leadAttribution.queryOptions({
      videoId,
      from: range.from,
      to: range.to,
      dimension: attrDimension,
    }),
  );

  const current = summary?.current;
  const previous = summary?.previous;

  const chartData: DataPoint[] = (seriesPoints?.items || []).map((pt) => ({
    key: pt.key,
    value: pt.metrics.form_submissions || 0,
    comparisonValue: pt.metrics.form_skips || 0,
  }));

  return (
    <div className="space-y-6">
      {/* 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Saved Submissions"
          value={formatNumber(current?.form_submissions)}
          currentRaw={current?.form_submissions}
          previousRaw={previous?.form_submissions}
          loading={isSummaryLoading}
          description="accepted leads saved in DB"
        />
        <MetricCard
          title="Skipped Submissions"
          value={formatNumber(current?.form_skips)}
          currentRaw={current?.form_skips}
          previousRaw={previous?.form_skips}
          loading={isSummaryLoading}
          description="viewers choosing to skip"
        />
        <MetricCard
          title="Observed Form Opens"
          value={formatNumber(current?.form_opens)}
          currentRaw={current?.form_opens}
          previousRaw={previous?.form_opens}
          loading={isSummaryLoading}
          description="form modal displays"
        />
        <MetricCard
          title="Observed Conversion Rate"
          value={formatPercent(current?.form_conversion_rate, current?.form_opened_sessions)}
          currentRaw={current?.form_conversion_rate}
          previousRaw={previous?.form_conversion_rate}
          isRate
          loading={isSummaryLoading}
          description="submitted / opened sessions"
        />
      </div>

      {/* Main Submissions Trend Chart */}
      {isSeriesLoading ? (
        <ChartSkeleton height={320} />
      ) : (
        <AnalyticsChart
          title="Saved Form Submissions Over Time"
          data={chartData}
          unit="number"
          metricLabel="Accepted leads"
          comparisonLabel="Skipped forms"
        />
      )}

      {/* Authoritative Lead Attribution by Dimension */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-stone-900 tracking-tight">
                Authoritative Lead Attribution
              </h3>
              {attrReport && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono">
                  <CheckCircle2 className="size-3" />
                  Reconciled with PostgreSQL
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500">
              Form snapshot attributes committed at submission time
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 font-medium">Group by:</span>
            <Select
              value={attrDimension}
              onValueChange={(val) => setAttrDimension(val as AttrDimension)}
            >
              <SelectTrigger className="h-8 text-xs bg-stone-50 border-stone-200 min-w-40 font-medium text-stone-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-stone-200">
                <SelectItem value="country" className="text-xs">Country</SelectItem>
                <SelectItem value="utm_campaign" className="text-xs">UTM Campaign</SelectItem>
                <SelectItem value="utm_source" className="text-xs">UTM Source</SelectItem>
                <SelectItem value="utm_medium" className="text-xs">UTM Medium</SelectItem>
                <SelectItem value="referrer" className="text-xs">Referrer Origin</SelectItem>
                <SelectItem value="surface" className="text-xs">Player Surface</SelectItem>
              </SelectContent>
            </Select>

            {videoId && (
              <Link
                href={`/console/content-library/video/${videoId}/leads`}
                className="text-xs text-stone-600 hover:text-stone-900 font-semibold inline-flex items-center gap-1 underline underline-offset-2 ml-2"
              >
                <span>Browse Leads</span>
                <ExternalLink className="size-3" />
              </Link>
            )}
          </div>
        </div>

        {isAttrLoading ? (
          <TableSkeleton rows={5} />
        ) : (
          <div className="w-full overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-stone-400 font-medium">
                  <th className="py-2.5 pr-4 uppercase tracking-wider text-[11px]">
                    {attrDimension.replace("_", " ")}
                  </th>
                  <th className="py-2.5 px-3 text-right">Saved leads</th>
                  <th className="py-2.5 px-3 text-right">Skipped</th>
                  <th className="py-2.5 px-3 text-right">Total submissions</th>
                  <th className="py-2.5 pl-3 text-right">Attribution share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {!attrReport?.items || attrReport.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400">
                      No lead attribution records for this period
                    </td>
                  </tr>
                ) : (
                  attrReport.items.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-stone-50/70 transition-colors"
                    >
                      <td className="py-2.5 pr-4 font-medium text-stone-900 max-w-sm truncate">
                        {row.dimension_value || "Unknown"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-900 font-semibold tabular-nums">
                        {formatNumber(row.saved_submissions)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-500 tabular-nums">
                        {formatNumber(row.skipped_submissions)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-700 tabular-nums">
                        {formatNumber(row.total_submissions)}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-mono text-stone-800 font-medium tabular-nums">
                        {formatPercent(row.share_percent)}
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
