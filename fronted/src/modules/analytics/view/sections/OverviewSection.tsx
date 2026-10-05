"use client";

import React, { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "../../components/MetricCard";
import { AnalyticsChart, type DataPoint } from "../../components/AnalyticsChart";
import { CountryMap } from "../../components/CountryMap";
import { CountryTable } from "../../components/CountryTable";
import { VideoPerformanceTable } from "../../components/VideoPerformanceTable";
import { ChartSkeleton } from "../../components/ReportState";
import { normalizeCountryBreakdown } from "../../lib/country-activity";
import { formatNumber, formatDuration, formatPercent } from "../../lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DateRangeState, IntervalChoice } from "../../lib/date-range";
import type { AnalyticsTab } from "../../types";

interface OverviewSectionProps {
  videoId?: string;
  range: DateRangeState;
  interval: IntervalChoice;
  onNavigateTab: (tab: AnalyticsTab) => void;
}

export function OverviewSection({
  videoId,
  range,
  interval,
  onNavigateTab,
}: OverviewSectionProps) {
  const trpc = useTRPC();
  const [selectedMetric, setSelectedMetric] = useState<
    "views" | "unique_viewers" | "impressions" | "playback_ms"
  >("views");
  const [videoTableOffset, setVideoTableOffset] = useState(0);

  // 1. Summary Query
  const { data: summary, isLoading: isSummaryLoading } = useQuery(
    trpc.analytics.summary.queryOptions({
      videoId,
      from: range.from,
      to: range.to,
    }),
  );

  // 2. Series Query
  const { data: seriesPoints, isLoading: isPointsLoading } = useQuery(
    trpc.analytics.series.queryOptions({
      videoId,
      from: range.from,
      to: range.to,
      interval,
      metric: selectedMetric,
    }),
  );

  // 3. Country Breakdown Query
  const { data: countryBreakdown } = useQuery(
    trpc.analytics.breakdown.queryOptions({
      videoId,
      from: range.from,
      to: range.to,
      dimension: "country",
      limit: 50,
    }),
  );

  // 4. Workspace Videos Ranking Query (Workspace scope only)
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

  // Format series for Recharts
  const chartData: DataPoint[] = (seriesPoints?.items || []).map((pt) => ({
    key: pt.key,
    value: pt.metrics[selectedMetric] ?? 0,
  }));

  const normalizedCountries = normalizeCountryBreakdown(
    countryBreakdown?.items || [],
    selectedMetric === "playback_ms" ? "playback_ms" : "views",
  );

  return (
    <div className="space-y-6">
      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Views"
          value={formatNumber(current?.views)}
          currentRaw={current?.views}
          previousRaw={previous?.views}
          loading={isSummaryLoading}
          description="playback sessions started"
          onClick={() => onNavigateTab("views")}
        />
        <MetricCard
          title="Unique viewers"
          value={formatNumber(current?.unique_viewers)}
          currentRaw={current?.unique_viewers}
          previousRaw={previous?.unique_viewers}
          loading={isSummaryLoading}
          description="distinct client browsers"
          onClick={() => onNavigateTab("views")}
        />
        <MetricCard
          title="Impressions"
          value={formatNumber(current?.impressions)}
          currentRaw={current?.impressions}
          previousRaw={previous?.impressions}
          loading={isSummaryLoading}
          description="player loaded & displayed"
          onClick={() => onNavigateTab("views")}
        />
        <MetricCard
          title="Playing time"
          value={formatDuration(current?.playback_ms)}
          currentRaw={current?.playback_ms}
          previousRaw={previous?.playback_ms}
          loading={isSummaryLoading}
          description="total actual watch time"
          onClick={() => onNavigateTab("watch_time")}
        />
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Form Submissions"
          value={formatNumber(current?.form_submissions)}
          currentRaw={current?.form_submissions}
          previousRaw={previous?.form_submissions}
          loading={isSummaryLoading}
          description="saved leads generated"
          onClick={() => onNavigateTab("form_submissions")}
        />
        <MetricCard
          title="CTA Clicks"
          value={formatNumber(current?.cta_clicks)}
          currentRaw={current?.cta_clicks}
          previousRaw={previous?.cta_clicks}
          loading={isSummaryLoading}
          description="call-to-action interactions"
          onClick={() => onNavigateTab("cta_clicks")}
        />
        <MetricCard
          title="Completion Rate"
          value={formatPercent(current?.completion_rate, current?.views)}
          currentRaw={current?.completion_rate}
          previousRaw={previous?.completion_rate}
          isRate
          loading={isSummaryLoading}
          description="sessions played to ended"
          onClick={() => onNavigateTab("engagement")}
        />
      </div>

      {/* Main Trend Chart */}
      {isPointsLoading ? (
        <ChartSkeleton height={320} />
      ) : (
        <AnalyticsChart
          title={`${selectedMetric.replace("_", " ").toUpperCase()} over time`}
          data={chartData}
          unit={selectedMetric === "playback_ms" ? "duration" : "number"}
          metricLabel={selectedMetric.replace("_", " ")}
          actions={
            <Select
              value={selectedMetric}
              onValueChange={(val) =>
                setSelectedMetric(
                  val as "views" | "unique_viewers" | "impressions" | "playback_ms",
                )
              }
            >
              <SelectTrigger className="h-8 rounded-md text-xs  bg-stone-50 border-stone-200">
                <SelectValue placeholder="Metric" />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-md  border-stone-200">
                <SelectItem value="views" className="text-xs">Views</SelectItem>
                <SelectItem value="unique_viewers" className="text-xs">Unique viewers</SelectItem>
                <SelectItem value="impressions" className="text-xs">Impressions</SelectItem>
                <SelectItem value="playback_ms" className="text-xs">Playing time</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      )}

      {/* Audience by Country: Map 60% + Ranked List 40% */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <CountryMap
            countries={normalizedCountries}
            measureLabel={selectedMetric === "playback_ms" ? "Playing time" : "Views"}
          />
        </div>
        <div className="lg:col-span-5">
          <CountryTable
            countries={normalizedCountries}
            measureLabel={selectedMetric === "playback_ms" ? "Duration" : "Views"}
            onViewAll={() => onNavigateTab("audience")}
          />
        </div>
      </div>

      {/* Workspace Video Ranking Table (Workspace scope only) */}
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
