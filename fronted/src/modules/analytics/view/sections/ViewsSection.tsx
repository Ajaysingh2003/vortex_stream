"use client";

import React, { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "../../components/MetricCard";
import { AnalyticsChart, type DataPoint } from "../../components/AnalyticsChart";
import { VideoPerformanceTable } from "../../components/VideoPerformanceTable";
import { ChartSkeleton } from "../../components/ReportState";
import { formatNumber, formatPercent } from "../../lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DateRangeState, IntervalChoice } from "../../lib/date-range";

type ViewsMetric = "views" | "unique_viewers" | "impressions" | "play_rate";

interface ViewsSectionProps {
  videoId?: string;
  range: DateRangeState;
  interval: IntervalChoice;
}

export function ViewsSection({ videoId, range, interval }: ViewsSectionProps) {
  const trpc = useTRPC();
  const [metricChoice, setMetricChoice] = useState<ViewsMetric>("views");
  const [videoTableOffset, setVideoTableOffset] = useState(0);

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

  // Videos Ranking (Workspace scope only)
  const { data: videosRanking } = useQuery(
    trpc.analytics.videos.queryOptions({
      from: range.from,
      to: range.to,
      offset: videoTableOffset,
      limit: 10,
    }),
  );

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
          title="Views"
          value={formatNumber(current?.views)}
          currentRaw={current?.views}
          previousRaw={previous?.views}
          loading={isSummaryLoading}
          description="playback sessions initiated"
        />
        <MetricCard
          title="Unique Viewers"
          value={formatNumber(current?.unique_viewers)}
          currentRaw={current?.unique_viewers}
          previousRaw={previous?.unique_viewers}
          loading={isSummaryLoading}
          description="approximate distinct browsers"
        />
        <MetricCard
          title="Impressions"
          value={formatNumber(current?.impressions)}
          currentRaw={current?.impressions}
          previousRaw={previous?.impressions}
          loading={isSummaryLoading}
          description="player loaded & displayed"
        />
        <MetricCard
          title="Play Rate"
          value={formatPercent(current?.play_rate, current?.impressions)}
          currentRaw={current?.play_rate}
          previousRaw={previous?.play_rate}
          isRate
          loading={isSummaryLoading}
          description="views / impressions"
        />
      </div>

      {/* Main Trend Chart */}
      {isSeriesLoading ? (
        <ChartSkeleton height={320} />
      ) : (
        <AnalyticsChart
          title={`${metricChoice.replace("_", " ").toUpperCase()} Trend`}
          data={chartData}
          unit={metricChoice === "play_rate" ? "percent" : "number"}
          metricLabel={metricChoice.replace("_", " ")}
          actions={
            <Select
              value={metricChoice}
              onValueChange={(val) => setMetricChoice(val as ViewsMetric)}
            >
              <SelectTrigger className="h-8 text-xs bg-stone-50 border-stone-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-stone-200">
                <SelectItem value="views" className="text-xs">Views</SelectItem>
                <SelectItem value="unique_viewers" className="text-xs">Unique viewers</SelectItem>
                <SelectItem value="impressions" className="text-xs">Impressions</SelectItem>
                <SelectItem value="play_rate" className="text-xs">Play rate (%)</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      )}

      {/* Workspace Video Performance Table */}
      {!videoId && (
        <VideoPerformanceTable
          videos={videosRanking?.items || []}
          offset={videoTableOffset}
          limit={10}
          onPageChange={setVideoTableOffset}
        />
      )}
    </div>
  );
}
