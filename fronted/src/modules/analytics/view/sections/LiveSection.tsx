"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "../../components/MetricCard";
import { AnalyticsChart, type DataPoint } from "../../components/AnalyticsChart";
import { CountryMap } from "../../components/CountryMap";
import { CountryTable } from "../../components/CountryTable";
import { StaleDataBanner, ChartSkeleton } from "../../components/ReportState";
import { normalizeLiveCountries } from "../../lib/country-activity";
import { formatNumber } from "../../lib/format";
import { Clock, Video } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LiveSectionProps {
  videoId?: string;
}

export function LiveSection({ videoId }: LiveSectionProps) {
  const trpc = useTRPC();
  const [concurrencyHours, setConcurrencyHours] = useState<1 | 6 | 24>(1);

  // 1. Live Snapshot Query (refreshes every 10s)
  const {
    data: liveData,
    isLoading: isLiveLoading,
    isError: isLiveError,
    refetch: refetchLive,
  } = useQuery({
    ...trpc.analytics.live.queryOptions({ videoId }),
    refetchInterval: 10000,
  });

  // Stable time anchor that advances every 15s to prevent query key thrashing on every re-render
  const [timeAnchor, setTimeAnchor] = useState<number>(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeAnchor(Date.now());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const { fromISO, toISO, pastTime, currentTime } = useMemo(() => {
    const end = new Date(timeAnchor);
    const start = new Date(timeAnchor - concurrencyHours * 60 * 60 * 1000);
    return {
      fromISO: start.toISOString(),
      toISO: end.toISOString(),
      pastTime: start.getTime(),
      currentTime: end.getTime(),
    };
  }, [timeAnchor, concurrencyHours]);

  // 2. Concurrency Time Series Query (refreshes every 15s)
  const {
    data: concurrencyPoints,
    isLoading: isConcurrencyLoading,
  } = useQuery({
    ...trpc.analytics.concurrency.queryOptions({
      videoId,
      from: fromISO,
      to: toISO,
    }),
    refetchInterval: 15000,
  });

  // Zero-filled continuous time-series across selected window
  const chartData: DataPoint[] = useMemo(() => {
    const pointMap = new Map<string, { active_sessions: number; unique_viewers: number }>();
    for (const pt of concurrencyPoints || []) {
      pointMap.set(pt.key, {
        active_sessions: Number(pt.active_sessions) || 0,
        unique_viewers: Number(pt.unique_viewers) || 0,
      });
    }

    // Bucket resolution: 1h -> 1min (60 pts), 6h -> 2min (180 pts), 24h -> 5min (288 pts)
    const stepMs = concurrencyHours === 1 ? 60000 : concurrencyHours === 6 ? 120000 : 300000;
    const startRounded = Math.floor(pastTime / stepMs) * stepMs;
    const endRounded = Math.floor(currentTime / stepMs) * stepMs;

    const series: DataPoint[] = [];
    for (let t = startRounded; t <= endRounded; t += stepMs) {
      let maxSessions = 0;
      let maxViewers = 0;

      for (let cur = t; cur < t + stepMs; cur += 60000) {
        const d = new Date(cur);
        const k = d.toISOString().replace(/\.\d{3}Z$/, "Z");
        const found = pointMap.get(k);
        if (found) {
          if (found.active_sessions > maxSessions) maxSessions = found.active_sessions;
          if (found.unique_viewers > maxViewers) maxViewers = found.unique_viewers;
        }
      }

      series.push({
        key: new Date(t).toISOString(),
        value: maxSessions,
        comparisonValue: maxViewers,
      });
    }
    return series;
  }, [concurrencyPoints, pastTime, currentTime, concurrencyHours]);

  const liveCountries = normalizeLiveCountries(liveData?.countries || []);

  return (
    <div className="space-y-6">
     

      {isLiveError && (
        <StaleDataBanner
          asOf={liveData?.as_of}
          onRefresh={() => refetchLive()}
        />
      )}

      {/* Primary Live Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Active playing sessions"
          value={formatNumber(liveData?.active_sessions)}
          loading={isLiveLoading}
          description="currently streaming viewers"
        />
        <MetricCard
          title="Active distinct browsers"
          value={formatNumber(liveData?.unique_viewers)}
          loading={isLiveLoading}
          description="estimated live audience"
        />
        <MetricCard
          title="Active Countries"
          value={formatNumber(liveData?.countries?.length)}
          loading={isLiveLoading}
          description="geographies currently watching"
        />
      </div>

      {/* Recent Concurrency Chart */}
      <div className="space-y-2">
        {isConcurrencyLoading ? (
          <ChartSkeleton height={300} />
        ) : (
          <AnalyticsChart
            title="Sampled Concurrent Activity (per minute)"
            data={chartData}
            unit="number"
            metricLabel="Active sessions"
            comparisonLabel="Unique browsers"
            actions={
              <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg text-xs">
                {([1, 6, 24] as const).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setConcurrencyHours(h)}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-medium transition-colors",
                      concurrencyHours === h
                        ? "bg-white text-stone-900 shadow-xs"
                        : "text-stone-500 hover:text-stone-900",
                    )}
                  >
                    Last {h}h
                  </button>
                ))}
              </div>
            }
          />
        )}
      </div>

      {/* Live Geography Map + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <CountryMap
            countries={liveCountries}
            measureLabel="Active sessions"
          />
        </div>
        <div className="lg:col-span-5">
          <CountryTable
            countries={liveCountries}
            measureLabel="Live Viewers"
          />
        </div>
      </div>

      {/* Active Videos Table (Workspace scope only) */}
      {!videoId && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-stone-900 tracking-tight">
              Currently Active Videos
            </h3>
            <span className="text-xs text-stone-500 font-mono">
              {liveData?.videos?.length || 0} active
            </span>
          </div>

          {liveData?.videos && liveData.videos.length > 0 ? (
            <div className="divide-y divide-stone-100 text-xs">
              {liveData.videos.map((vid) => {
                const vidId = vid.video_id || vid.key || "";
                return (
                  <div
                    key={vidId}
                    className="py-2.5 flex items-center justify-between gap-4"
                  >
                    <Link
                      href={`/console/analytics/${vidId}/live`}
                      className="flex items-center gap-2.5 text-stone-900 font-semibold hover:underline truncate"
                    >
                      <Video className="size-4 text-stone-400 shrink-0" />
                      <span className="truncate">{vid.title || vidId}</span>
                    </Link>
                    <div className="flex items-center gap-3 font-mono text-stone-700 shrink-0">
                      {vid.unique_viewers !== undefined && vid.unique_viewers > 0 && (
                        <span className="text-stone-500">
                          {formatNumber(vid.unique_viewers)} browsers
                        </span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        <span>{formatNumber(vid.active_sessions)} live</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <Video className="size-8 text-stone-300 stroke-1 mb-2" />
              <p className="text-xs font-medium text-stone-700">
                No active video playback sessions
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5 max-w-sm">
                Videos currently streaming in this workspace will automatically appear here in real time.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
