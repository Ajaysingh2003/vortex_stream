"use client";

import React, { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "../../components/MetricCard";
import { AnalyticsChart, type DataPoint } from "../../components/AnalyticsChart";
import { ChartSkeleton } from "../../components/ReportState";
import { formatNumber, formatDuration } from "../../lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DateRangeState, IntervalChoice } from "../../lib/date-range";

type PlaybackMetric = "average_startup_ms" | "buffer_ms" | "buffer_events" | "errors";

interface PlaybackSectionProps {
  videoId?: string;
  range: DateRangeState;
  interval: IntervalChoice;
}

export function PlaybackSection({
  videoId,
  range,
  interval,
}: PlaybackSectionProps) {
  const trpc = useTRPC();
  const [metricChoice, setMetricChoice] = useState<PlaybackMetric>("average_startup_ms");

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

  // Quality Report (quantiles, rebuffer ratio, error rates)
  const { data: qualityReport } = useQuery(
    trpc.analytics.quality.queryOptions({
      videoId,
      from: range.from,
      to: range.to,
      mode: "summary",
    }),
  );

  const current = summary?.current;
  const previous = summary?.previous;
  const qSummary = qualityReport?.summary;

  const chartData: DataPoint[] = (seriesPoints?.items || []).map((pt) => ({
    key: pt.key,
    value: pt.metrics[metricChoice] ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* 4 Quality Primary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Average Startup"
          value={
            current?.average_startup_ms
              ? `${(current.average_startup_ms / 1000).toFixed(2)}s`
              : "0s"
          }
          currentRaw={current?.average_startup_ms}
          previousRaw={previous?.average_startup_ms}
          inverse
          loading={isSummaryLoading}
          description="play request to playing signal"
        />
        <MetricCard
          title="Buffering Time"
          value={formatDuration(current?.buffer_ms)}
          currentRaw={current?.buffer_ms}
          previousRaw={previous?.buffer_ms}
          inverse
          loading={isSummaryLoading}
          description="total observed stall time"
        />
        <MetricCard
          title="Buffering Events"
          value={formatNumber(current?.buffer_events)}
          currentRaw={current?.buffer_events}
          previousRaw={previous?.buffer_events}
          inverse
          loading={isSummaryLoading}
          description="stall occurrences during playback"
        />
        <MetricCard
          title="Playback Errors"
          value={formatNumber(current?.errors)}
          currentRaw={current?.errors}
          previousRaw={previous?.errors}
          inverse
          loading={isSummaryLoading}
          description="fatal or recoverable errors"
        />
      </div>

      {/* Advanced Quality Quantiles & Denominators */}
      {qSummary && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-stone-900 tracking-tight">
              Advanced Playback Quality Statistics
            </h3>
            <p className="text-xs text-stone-500">
              Quantiles, rebuffer ratios, and session-level failure benchmarks
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
              <span className="text-xs text-stone-500">Startup Median (P50)</span>
              <p className="text-xl font-bold font-mono text-stone-900 mt-1">
                {qSummary.startup_median_ms !== undefined
                  ? `${(qSummary.startup_median_ms / 1000).toFixed(2)}s`
                  : "—"}
              </p>
              <span className="text-[10px] text-stone-400">
                {qSummary.startup_samples} samples recorded
              </span>
            </div>

            <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
              <span className="text-xs text-stone-500">Startup P95 Latency</span>
              <p className="text-xl font-bold font-mono text-stone-900 mt-1">
                {qSummary.startup_p95_ms !== undefined
                  ? `${(qSummary.startup_p95_ms / 1000).toFixed(2)}s`
                  : "—"}
              </p>
              <span className="text-[10px] text-stone-400">
                95% of viewers experience less
              </span>
            </div>

            <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
              <span className="text-xs text-stone-500">Rebuffer Ratio</span>
              <p className="text-xl font-bold font-mono text-stone-900 mt-1">
                {qSummary.rebuffer_ratio ? `${qSummary.rebuffer_ratio.toFixed(2)}%` : "0.00%"}
              </p>
              <span className="text-[10px] text-stone-400">
                {qSummary.rebuffer_affected_sessions} sessions affected
              </span>
            </div>

            <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
              <span className="text-xs text-stone-500">Playback Error Rate</span>
              <p className="text-xl font-bold font-mono text-stone-900 mt-1">
                {qSummary.playback_error_session_rate
                  ? `${qSummary.playback_error_session_rate.toFixed(2)}%`
                  : "0.00%"}
              </p>
              <span className="text-[10px] text-stone-400">
                sessions encountering errors
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Quality Chart */}
      {isSeriesLoading ? (
        <ChartSkeleton height={320} />
      ) : (
        <AnalyticsChart
          title="Playback Quality Over Time"
          data={chartData}
          unit={
            metricChoice === "average_startup_ms" || metricChoice === "buffer_ms"
              ? "duration"
              : "number"
          }
          metricLabel={metricChoice.replace("_", " ")}
          actions={
            <Select
              value={metricChoice}
              onValueChange={(val) => setMetricChoice(val as PlaybackMetric)}
            >
              <SelectTrigger className="h-8 text-xs bg-stone-50 border-stone-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-stone-200">
                <SelectItem value="average_startup_ms" className="text-xs">
                  Startup duration (ms)
                </SelectItem>
                <SelectItem value="buffer_ms" className="text-xs">
                  Buffering time
                </SelectItem>
                <SelectItem value="buffer_events" className="text-xs">
                  Buffer event count
                </SelectItem>
                <SelectItem value="errors" className="text-xs">
                  Error count
                </SelectItem>
              </SelectContent>
            </Select>
          }
        />
      )}
    </div>
  );
}
