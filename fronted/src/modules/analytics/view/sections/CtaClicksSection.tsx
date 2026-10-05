"use client";

import React, { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "../../components/MetricCard";
import { AnalyticsChart, type DataPoint } from "../../components/AnalyticsChart";
import { ChartSkeleton, TableSkeleton } from "../../components/ReportState";
import { formatNumber, formatPercent } from "../../lib/format";
import { MousePointerClick } from "lucide-react";
import type { DateRangeState, IntervalChoice } from "../../lib/date-range";

interface CtaClicksSectionProps {
  videoId?: string;
  range: DateRangeState;
  interval: IntervalChoice;
}

export function CtaClicksSection({
  videoId,
  range,
  interval,
}: CtaClicksSectionProps) {
  const trpc = useTRPC();
  const [metricChoice, setMetricChoice] = useState<"cta_clicks" | "cta_click_rate">("cta_clicks");

  // Summary
  const { data: summary, isLoading: isSummaryLoading } = useQuery(
    trpc.analytics.summary.queryOptions({
      videoId,
      from: range.from,
      to: range.to,
    }),
  );

  // Series
  const { data: seriesPoints, isLoading: isSeriesLoading } = useQuery(
    trpc.analytics.series.queryOptions({
      videoId,
      from: range.from,
      to: range.to,
      interval,
      metric: metricChoice,
    }),
  );

  // Per-CTA Performance Report
  const { data: ctaReport, isLoading: isCtaReportLoading } = useQuery(
    trpc.analytics.ctas.queryOptions({
      videoId,
      from: range.from,
      to: range.to,
      mode: "summary",
      limit: 25,
    }),
  );

  const current = summary?.current;
  const previous = summary?.previous;

  const chartData: DataPoint[] = (seriesPoints?.items || []).map((pt) => ({
    key: pt.key,
    value: pt.metrics[metricChoice] ?? 0,
    comparisonValue: metricChoice === "cta_clicks" ? pt.metrics.cta_displays : undefined,
  }));

  return (
    <div className="space-y-6">
      {/* 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="CTA Clicks"
          value={formatNumber(current?.cta_clicks)}
          currentRaw={current?.cta_clicks}
          previousRaw={previous?.cta_clicks}
          loading={isSummaryLoading}
          description="total button interactions (click to plot)"
          onClick={() => setMetricChoice("cta_clicks")}
          className={metricChoice === "cta_clicks" ? "ring-2 ring-stone-900 border-transparent" : undefined}
        />
        <MetricCard
          title="CTA Click Rate"
          value={formatPercent(current?.cta_click_rate, current?.cta_exposed_sessions)}
          currentRaw={current?.cta_click_rate}
          previousRaw={previous?.cta_click_rate}
          isRate
          loading={isSummaryLoading}
          description="clicking / exposed sessions (click to plot)"
          onClick={() => setMetricChoice("cta_click_rate")}
          className={metricChoice === "cta_click_rate" ? "ring-2 ring-stone-900 border-transparent" : undefined}
        />
        <MetricCard
          title="CTA Displays"
          value={formatNumber(current?.cta_displays)}
          currentRaw={current?.cta_displays}
          previousRaw={previous?.cta_displays}
          loading={isSummaryLoading}
          description="impressions of CTA cards/buttons"
        />
        <MetricCard
          title="Clicking Sessions"
          value={formatNumber(current?.cta_clicking_sessions)}
          currentRaw={current?.cta_clicking_sessions}
          previousRaw={previous?.cta_clicking_sessions}
          loading={isSummaryLoading}
          description="distinct viewers who clicked"
        />
      </div>

      {/* Main Trend Chart */}
      {isSeriesLoading ? (
        <ChartSkeleton height={320} />
      ) : (
        <AnalyticsChart
          title="CTA Activity Over Time"
          data={chartData}
          unit={metricChoice === "cta_click_rate" ? "percent" : "number"}
          metricLabel={metricChoice === "cta_click_rate" ? "CTR" : "Clicks"}
          comparisonLabel={metricChoice === "cta_clicks" ? "Displays" : undefined}
        />
      )}

      {/* Per-CTA Button Performance Table */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 tracking-tight">
            Per-CTA Button Performance
          </h3>
          <p className="text-xs text-stone-500">
            Performance metrics broken down by individual CTA buttons and links
          </p>
        </div>

        {isCtaReportLoading ? (
          <TableSkeleton rows={4} />
        ) : (
          <div className="w-full overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-stone-400 font-medium">
                  <th className="py-2.5 pr-4">CTA Title & Target</th>
                  <th className="py-2.5 px-3">Position</th>
                  <th className="py-2.5 px-3 text-right">Displays</th>
                  <th className="py-2.5 px-3 text-right">Clicks</th>
                  <th className="py-2.5 px-3 text-right">Click Rate</th>
                  <th className="py-2.5 pl-3 text-right">Avg Time-to-Click</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {!ctaReport?.items || ctaReport.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400">
                      No CTA button performance recorded for this date range
                    </td>
                  </tr>
                ) : (
                  ctaReport.items.map((cta) => (
                    <tr
                      key={cta.cta_id}
                      className="hover:bg-stone-50/70 transition-colors"
                    >
                      <td className="py-2.5 pr-4 max-w-xs">
                        <div className="flex items-center gap-2">
                          <MousePointerClick className="size-3.5 text-stone-400 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-semibold text-stone-900 truncate block">
                              {cta.title || "Untitled CTA"}
                            </span>
                            {cta.url_origin && (
                              <span className="text-[11px] text-stone-400 truncate block">
                                {cta.url_origin}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-stone-600 font-mono text-[11px]">
                        {cta.position || "inline"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-600 tabular-nums">
                        {formatNumber(cta.exposure_events)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-900 font-medium tabular-nums">
                        {formatNumber(cta.click_events)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-900 font-semibold tabular-nums">
                        {formatPercent(cta.click_rate)}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-mono text-stone-600 tabular-nums">
                        {cta.avg_time_to_click_ms > 0
                          ? `${(cta.avg_time_to_click_ms / 1000).toFixed(1)}s`
                          : "—"}
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
