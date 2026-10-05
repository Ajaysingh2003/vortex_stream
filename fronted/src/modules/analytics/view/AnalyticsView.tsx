"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
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
import {
  getPresetRange,
  type DateRangeState,
  type IntervalChoice,
} from "../lib/date-range";
import type { AnalyticsTab } from "../types";
import { WorkspaceType } from "@/modules/types";
import { getAnalyticsUrl, getAnalyticsTabFromPath } from "../lib/routes";

interface AnalyticsViewProps {
  tab?: AnalyticsTab;
}

export default function AnalyticsView({ tab: propTab }: AnalyticsViewProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trpc = useTRPC();

  // Active Workspace
  const { data: workspace } = useSuspenseQuery(
    trpc.user.getWorkspace.queryOptions(),
  );
  const workspaceData = workspace as WorkspaceType;

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

  const intervalParam =
    (searchParams.get("interval") as IntervalChoice) || "day";
  const [interval, setInterval] = useState<IntervalChoice>(intervalParam);

  const handleTabChange = (newTab: AnalyticsTab) => {
    const params = new URLSearchParams(
      searchParams ? searchParams.toString() : "",
    );
    params.set("from", range.from);
    params.set("to", range.to);
    params.set("interval", interval);
    const targetUrl = getAnalyticsUrl(newTab, undefined, params);
    router.push(targetUrl);
  };

  const handleRangeApply = (
    newRange: DateRangeState,
    newInterval: IntervalChoice,
  ) => {
    setRange(newRange);
    setInterval(newInterval);
    const params = new URLSearchParams(
      searchParams ? searchParams.toString() : "",
    );
    params.set("from", newRange.from);
    params.set("to", newRange.to);
    params.set("interval", newInterval);
    params.delete("scope");
    params.delete("tab");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      <div className="px-4 md:px-12 py-4 w-full">
        {/* Header */}
        <AnalyticsHeader
          workspaceName={workspaceData?.name || "Workspace"}
          range={range}
          onRangeApply={handleRangeApply}
          interval={interval}
          onIntervalChange={setInterval}
          activeTab={activeTab}
        />

        {/* Section Navigation Tabs */}
        {/* <AnalyticsSectionNav
          activeTab={activeTab}
          onChangeTab={handleTabChange}
        /> */}

        {/* Destination Content View */}
        <div className="min-w-0">
          {activeTab === "overview" && (
            <OverviewSection
              range={range}
              interval={interval}
              onNavigateTab={handleTabChange}
            />
          )}
          {activeTab === "live" && <LiveSection />}
          {activeTab === "audience" && <AudienceSection range={range} />}
          {activeTab === "engagement" && (
            <EngagementSection range={range} interval={interval} />
          )}
          {activeTab === "conversions" && (
            <ConversionsSection range={range} interval={interval} />
          )}
          {activeTab === "playback" && (
            <PlaybackSection range={range} interval={interval} />
          )}
          {activeTab === "form_submissions" && (
            <FormSubmissionsSection range={range} interval={interval} />
          )}
          {activeTab === "cta_clicks" && (
            <CtaClicksSection range={range} interval={interval} />
          )}
          {activeTab === "watch_time" && (
            <WatchTimeSection range={range} interval={interval} />
          )}
          {activeTab === "views" && (
            <ViewsSection range={range} interval={interval} />
          )}
        </div>
      </div>
    </div>
  );
}
