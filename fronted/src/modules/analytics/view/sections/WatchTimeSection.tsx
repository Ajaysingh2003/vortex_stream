"use client";

import React from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "../../components/MetricCard";
import { AnalyticsChart, type DataPoint } from "../../components/AnalyticsChart";
import { ChartSkeleton, TableSkeleton } from "../../components/ReportState";
import { formatNumber, formatDuration, formatPercent } from "../../lib/format";
import type { DateRangeState, IntervalChoice } from "../../lib/date-range";

interface WatchTimeSectionProps {
  videoId?: string;
  range: DateRangeState;
  interval: IntervalChoice;
}

export function WatchTimeSection({
  videoId,
  range,
  interval,
}: WatchTimeSectionProps) {
  const trpc = useTRPC();

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
      metric: "playback_ms",
    }),
  );

  // Cohort-correct Session Metrics
  const { data: sessionMetrics } = useQuery(
    trpc.analytics.sessionMetrics.queryOptions({
      videoId,
      from: range.from,
      to: range.to,
      cohort: "play_start",
    }),
  );

  // Device Breakdown for Watch Time
  const { data: deviceBreakdown, isLoading: isDeviceLoading } = useQuery(
    trpc.analytics.breakdown.queryOptions({
      videoId,
      from: range.from,
      to: range.to,
      dimension: "device",
    }),
  );

  const current = summary?.current;
  const previous = summary?.previous;

  const chartData: DataPoint[] = (seriesPoints?.items || []).map((pt) => ({
    key: pt.key,
    value: pt.metrics.playback_ms || 0,
  }));

  return (
    <div className="space-y-6">
      {/* 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Playing Time"
          value={formatDuration(current?.playback_ms)}
          currentRaw={current?.playback_ms}
          previousRaw={previous?.playback_ms}
          loading={isSummaryLoading}
          description="cumulative actual wall time"
        />
        <MetricCard
          title="Views"
          value={formatNumber(current?.views)}
          currentRaw={current?.views}
          previousRaw={previous?.views}
          loading={isSummaryLoading}
          description="playback sessions started"
        />
        <MetricCard
          title="Completions"
          value={formatNumber(current?.completions)}
          currentRaw={current?.completions}
          previousRaw={previous?.completions}
          loading={isSummaryLoading}
          description="played to ended event"
        />
        <MetricCard
          title="Completion Rate"
          value={formatPercent(current?.completion_rate, current?.views)}
          currentRaw={current?.completion_rate}
          previousRaw={previous?.completion_rate}
          isRate
          loading={isSummaryLoading}
          description="sessions completed"
        />
      </div>

      {/* Cohort-Correct Average Watch Time Banner */}
      {sessionMetrics && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-900 tracking-tight">
              Cohort-Correct Average Watch Duration
            </h3>
            <span className="text-[11px] font-mono text-stone-400">
              Cutoff: {new Date(sessionMetrics.observation_cutoff).toLocaleTimeString()} UTC
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
              <span className="text-xs text-stone-500">Average Finalized Duration</span>
              <p className="text-xl font-bold font-mono text-stone-900 mt-1">
                {formatDuration(sessionMetrics.average_finalized_watch_ms)}
              </p>
              <span className="text-[10px] text-stone-400">
                {formatNumber(sessionMetrics.finalized_sessions)} completed/inactivity finalized sessions
              </span>
            </div>

            <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
              <span className="text-xs text-stone-500">Average Observed Duration</span>
              <p className="text-xl font-bold font-mono text-stone-900 mt-1">
                {formatDuration(sessionMetrics.average_observed_watch_ms)}
              </p>
              <span className="text-[10px] text-stone-400">
                including {formatNumber(sessionMetrics.provisional_sessions)} provisional active sessions
              </span>
            </div>

            <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
              <span className="text-xs text-stone-500">Cohort Window Cap</span>
              <p className="text-xl font-bold font-mono text-stone-900 mt-1">
                24 Hours Max
              </p>
              <span className="text-[10px] text-stone-400">
                {formatNumber(sessionMetrics.capped_sessions)} sessions reached 24h ceiling
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Playing Time Trend Chart */}
      {isSeriesLoading ? (
        <ChartSkeleton height={320} />
      ) : (
        <AnalyticsChart
          title="Playing Time Trend"
          data={chartData}
          unit="duration"
          metricLabel="Playing time"
        />
      )}

      {/* Device Playing Time Contribution */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 tracking-tight">
            Playing Time by Device Type
          </h3>
          <p className="text-xs text-stone-500">
            Duration distribution across desktop, mobile, tablet, and smart TV surfaces
          </p>
        </div>

        {isDeviceLoading ? (
          <TableSkeleton rows={4} />
        ) : (
          <div className="w-full overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-stone-400 font-medium">
                  <th className="py-2.5 pr-4">Device</th>
                  <th className="py-2.5 px-3 text-right">Playing time</th>
                  <th className="py-2.5 px-3 text-right">Views</th>
                  <th className="py-2.5 pl-3 text-right">Completion rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {(!deviceBreakdown?.items || deviceBreakdown.items.length === 0) ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-stone-400">
                      No device duration data available
                    </td>
                  </tr>
                ) : (
                  deviceBreakdown.items.map((row) => (
                    <tr
                      key={row.key}
                      className="hover:bg-stone-50/70 transition-colors"
                    >
                      <td className="py-2.5 pr-4 font-semibold text-stone-900 capitalize">
                        {row.key || "Unknown"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-900 font-semibold tabular-nums">
                        {formatDuration(row.metrics.playback_ms)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-600 tabular-nums">
                        {formatNumber(row.metrics.views)}
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
