"use client";

import React, { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "../../components/MetricCard";
import { AnalyticsChart, type DataPoint } from "../../components/AnalyticsChart";
import { ChartSkeleton, TableSkeleton } from "../../components/ReportState";
import { formatNumber, formatPercent } from "../../lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DateRangeState, IntervalChoice } from "../../lib/date-range";

interface EngagementSectionProps {
  videoId?: string;
  range: DateRangeState;
  interval: IntervalChoice;
}

export function EngagementSection({
  videoId,
  range,
  interval,
}: EngagementSectionProps) {
  const trpc = useTRPC();
  const [metricChoice, setMetricChoice] = useState<"completion_rate" | "completions" | "replays">("completion_rate");

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

  // Discrete Retention Buckets (Single video scope only)
  const { data: retentionBuckets, isLoading: isRetentionLoading } = useQuery({
    ...trpc.analytics.engagement.queryOptions({
      videoId: videoId || "",
      from: range.from,
      to: range.to,
    }),
    enabled: !!videoId,
  });

  // Watched-Segments Heatmap (Single video scope only)
  const { data: heatmapData, isLoading: isHeatmapLoading } = useQuery({
    ...trpc.analytics.heatmap.queryOptions({
      videoId: videoId || "",
      from: range.from,
      to: range.to,
      bins: 50,
    }),
    enabled: !!videoId,
  });

  const current = summary?.current;
  const previous = summary?.previous;

  const chartData: DataPoint[] = (seriesPoints?.items || []).map((pt) => ({
    key: pt.key,
    value: pt.metrics[metricChoice] ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Completion Rate"
          value={formatPercent(current?.completion_rate, current?.views)}
          currentRaw={current?.completion_rate}
          previousRaw={previous?.completion_rate}
          isRate
          loading={isSummaryLoading}
          description="played through to the end"
        />
        <MetricCard
          title="Completed Views"
          value={formatNumber(current?.completions)}
          currentRaw={current?.completions}
          previousRaw={previous?.completions}
          loading={isSummaryLoading}
          description="sessions with ended signal"
        />
        <MetricCard
          title="Replays"
          value={formatNumber(current?.replays)}
          currentRaw={current?.replays}
          previousRaw={previous?.replays}
          loading={isSummaryLoading}
          description="replayed playback segments"
        />
        <MetricCard
          title="Avg Progress"
          value={formatPercent(current?.average_progress_percent, current?.views)}
          currentRaw={current?.average_progress_percent}
          previousRaw={previous?.average_progress_percent}
          isRate
          loading={isSummaryLoading}
          description="average max position reached"
        />
      </div>

      {/* Main Trend Chart */}
      {isSeriesLoading ? (
        <ChartSkeleton height={320} />
      ) : (
        <AnalyticsChart
          title="Engagement Trends"
          data={chartData}
          unit={metricChoice === "completion_rate" ? "percent" : "number"}
          metricLabel={metricChoice.replace("_", " ")}
          actions={
            <Select
              value={metricChoice}
              onValueChange={(val) =>
                setMetricChoice(val as "completion_rate" | "completions" | "replays")
              }
            >
              <SelectTrigger className="h-8 text-xs bg-stone-50 border-stone-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-stone-200">
                <SelectItem value="completion_rate" className="text-xs">
                  Completion rate (%)
                </SelectItem>
                <SelectItem value="completions" className="text-xs">
                  Completed views
                </SelectItem>
                <SelectItem value="replays" className="text-xs">
                  Replays
                </SelectItem>
              </SelectContent>
            </Select>
          }
        />
      )}

      {/* Discrete Milestone Retention Buckets (Single video scope) */}
      {videoId && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-stone-900 tracking-tight">
              Milestone Retention Curve
            </h3>
            <p className="text-xs text-stone-500">
              Discrete playback positions reached (100% means playback reached ended event)
            </p>
          </div>

          {isRetentionLoading ? (
            <TableSkeleton rows={2} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {[0, 25, 50, 75, 90, 100].map((bucket) => {
                const matched = retentionBuckets?.find((b) => b.bucket === bucket);
                const pct = matched ? matched.percent : 0;
                const sessions = matched ? matched.sessions : 0;

                return (
                  <div
                    key={bucket}
                    className="bg-stone-50 border border-stone-100 rounded-lg p-3 flex flex-col justify-between"
                  >
                    <span className="text-xs font-mono text-stone-500">
                      {bucket}% Mark
                    </span>
                    <div className="my-2">
                      <span className="text-xl font-bold font-mono text-stone-900">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-stone-400 mt-1 font-mono">
                      {formatNumber(sessions)} sessions
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Watched-Segments Heatmap (Single video scope) */}
      {videoId && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-stone-900 tracking-tight">
                Observed Watched-Segments Heatmap
              </h3>
              <p className="text-xs text-stone-500">
                Normalized retention across duration bins from actual played telemetry
              </p>
            </div>
            {heatmapData && (
              <div className="text-xs font-mono text-stone-400">
                Measured: {formatNumber(heatmapData.measured_sessions)} / {formatNumber(heatmapData.eligible_sessions)} starts
              </div>
            )}
          </div>

          {isHeatmapLoading ? (
            <ChartSkeleton height={140} />
          ) : heatmapData && heatmapData.items ? (
            <>
              {/* Heatmap timeline visualizer */}
              <div className="flex items-end gap-0.5 h-32 w-full pt-4 pb-2 bg-stone-50 rounded-lg px-2 border border-stone-100 overflow-x-auto">
                {heatmapData.items.map((bin) => {
                  const h = Math.max(4, Math.min(100, bin.retention_rate));
                  return (
                    <div
                      key={bin.bin_index}
                      className="flex-1 min-w-[3px] bg-stone-900/80 hover:bg-lime-500 transition-colors rounded-t-xs relative group cursor-pointer"
                      style={{ height: `${h}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] px-2 py-1 rounded shadow-md z-20 pointer-events-none whitespace-nowrap font-mono">
                        Bin {bin.bin_index}: {bin.retention_rate.toFixed(1)}% ({formatNumber(bin.watching_sessions)} viewers)
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[11px] font-mono text-stone-400">
                <span>0:00 (Start)</span>
                <span>Duration: {(heatmapData.duration_ms / 1000).toFixed(0)}s</span>
              </div>
            </>
          ) : (
            <div className="py-6 text-center text-xs text-stone-400">
              No heatmap data collected yet for this video
            </div>
          )}
        </div>
      )}
    </div>
  );
}
