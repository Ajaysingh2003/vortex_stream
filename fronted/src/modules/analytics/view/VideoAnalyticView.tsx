"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter, usePathname, useParams } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { AnalyticsHeader } from "../components/AnalyticsHeader";

import { OverviewSection } from "./sections/OverviewSection";
import { LiveSection } from "./sections/LiveSection";
import { AudienceSection } from "./sections/AudienceSection";
import { EngagementSection } from "./sections/EngagementSection";
import { ConversionsSection } from "./sections/ConversionsSection";
import { PlaybackSection } from "./sections/PlaybackSection";
import { FormSubmissionsSection } from "./sections/FormSubmissionsSection";
import { CtaClicksSection } from "./sections/CtaClicksSection";
import { WatchTimeSection } from "./sections/WatchTimeSection";
import { ViewsSection } from "./sections/ViewsSection";
import { getPresetRange, type DateRangeState, type IntervalChoice } from "../lib/date-range";
import type { AnalyticsTab } from "../types";
import { WorkspaceType } from "@/modules/types";
import { getAnalyticsUrl, getAnalyticsTabFromPath } from "../lib/routes";

interface VideoAnalyticViewProps {
  videoId?: string;
  tab?: AnalyticsTab;
}

export default function VideoAnalyticView({
  videoId: propVideoId,
  tab: propTab,
}: VideoAnalyticViewProps) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trpc = useTRPC();

  const resolvedVideoId = (propVideoId || (params?.videoId as string) || "").trim();

  // Active Workspace
  const { data: workspace } = useSuspenseQuery(
    trpc.user.getWorkspace.queryOptions(),
  );
  const workspaceData = workspace as WorkspaceType;

  // Video Details Query
  const { data: videoData } = useQuery({
    ...trpc.video.getVideo.queryOptions({ videoId: resolvedVideoId }),
    enabled: !!resolvedVideoId,
  });
  const video = videoData as { title?: string; thumbnail_url?: string } | undefined;

  // Active Tab: prop overrides URL, otherwise detect from pathname or fallback to searchParams
  const activeTab: AnalyticsTab =
    propTab || getAnalyticsTabFromPath(pathname, searchParams);

  // Date Range from URL or default 7d
  const initialRange = getPresetRange("7d");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const [range, setRange] = useState<DateRangeState>({
    from: fromParam || initialRange.from,
    to: toParam || initialRange.to,
  });

  const intervalParam = (searchParams.get("interval") as IntervalChoice) || "day";
  const [interval, setInterval] = useState<IntervalChoice>(intervalParam);

  const handleTabChange = (newTab: AnalyticsTab) => {
    const p = new URLSearchParams(searchParams ? searchParams.toString() : "");
    p.set("from", range.from);
    p.set("to", range.to);
    p.set("interval", interval);
    const targetUrl = getAnalyticsUrl(newTab, resolvedVideoId, p);
    router.push(targetUrl);
  };

  const handleRangeApply = (newRange: DateRangeState, newInterval: IntervalChoice) => {
    setRange(newRange);
    setInterval(newInterval);
    const p = new URLSearchParams(searchParams ? searchParams.toString() : "");
    p.set("from", newRange.from);
    p.set("to", newRange.to);
    p.set("interval", newInterval);
    p.delete("scope");
    p.delete("tab");
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  };

  return (
    <div className="max-w-7xl px-4 md:px-12 py-4 w-full mx-auto space-y-6 pb-12">

      {/* Header with Video Identity and Back to All Videos */}
      <AnalyticsHeader
        workspaceName={workspaceData?.name || "Workspace"}
        videoId={resolvedVideoId}
        videoTitle={video?.title}
        videoThumbnail={video?.thumbnail_url}
        range={range}
        onRangeApply={handleRangeApply}
        interval={interval}
        onIntervalChange={setInterval}
        activeTab={activeTab}
      />

    

      {/* Destination Content View (All scoped to this single video) */}
      <div className="min-w-0">
        {activeTab === "overview" && (
          <OverviewSection
            videoId={resolvedVideoId}
            range={range}
            interval={interval}
            onNavigateTab={handleTabChange}
          />
        )}
        {activeTab === "live" && <LiveSection videoId={resolvedVideoId} />}
        {activeTab === "audience" && (
          <AudienceSection videoId={resolvedVideoId} range={range} />
        )}
        {activeTab === "engagement" && (
          <EngagementSection
            videoId={resolvedVideoId}
            range={range}
            interval={interval}
          />
        )}
        {activeTab === "conversions" && (
          <ConversionsSection
            videoId={resolvedVideoId}
            range={range}
            interval={interval}
          />
        )}
        {activeTab === "playback" && (
          <PlaybackSection
            videoId={resolvedVideoId}
            range={range}
            interval={interval}
          />
        )}
        {activeTab === "form_submissions" && (
          <FormSubmissionsSection
            videoId={resolvedVideoId}
            range={range}
            interval={interval}
          />
        )}
        {activeTab === "cta_clicks" && (
          <CtaClicksSection
            videoId={resolvedVideoId}
            range={range}
            interval={interval}
          />
        )}
        {activeTab === "watch_time" && (
          <WatchTimeSection
            videoId={resolvedVideoId}
            range={range}
            interval={interval}
          />
        )}
        {activeTab === "views" && (
          <ViewsSection
            videoId={resolvedVideoId}
            range={range}
            interval={interval}
          />
        )}
      </div>
    </div>
  );
}