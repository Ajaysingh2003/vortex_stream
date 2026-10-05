"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Video as VideoIcon } from "lucide-react";
import { AnalyticsDateRange } from "./AnalyticsDateRange";
import { type DateRangeState, type IntervalChoice } from "../lib/date-range";

interface AnalyticsHeaderProps {
  workspaceName?: string;
  videoId?: string;
  videoTitle?: string;
  videoThumbnail?: string;
  range: DateRangeState;
  onRangeApply: (range: DateRangeState, interval: IntervalChoice) => void;
  interval: IntervalChoice;
  onIntervalChange?: (interval: IntervalChoice) => void;
  activeTab?: string;
}

export function AnalyticsHeader({
  // workspaceName = "Workspace",
  videoId,
  videoTitle,
  videoThumbnail,
  range,
  onRangeApply,
  interval,
  onIntervalChange,
  activeTab = "overview",
}: AnalyticsHeaderProps) {
  const isVideoScope = !!videoId;

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Top row: Breadcrumb and Back link */}

      {/* Main header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-100">
        <div className="flex items-center gap-3">
          {isVideoScope ? (
            <div className="flex items-center gap-3">
              
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold font-heading tracking-tight text-stone-900 truncate">
                    {videoTitle || "Video Analytics"}
                  </h1>
                  <Link
                    href={`/console/content-library/video/${videoId}`}
                    target="_blank"
                    className="text-stone-400 hover:text-stone-700 transition-colors"
                    title="Open video settings"
                  >
                    <ExternalLink className="size-4" />
                  </Link>
                </div>
                {/* <p className="text-xs text-stone-500 font-mono">
                  ID: {videoId}
                </p> */}
              </div>
            </div>
          ) : (
            <div>
              <h1 className="font-semibold font-heading leading-relaxed tracking-tight  text-4xl md:text-xl lg:text-3xl truncate max-w-52 lg:max-w-128">
                Analytics
              </h1>
            </div>
          )}
        </div>

        {/* Date range picker */}
        <AnalyticsDateRange
          range={range}
          onApply={onRangeApply}
          interval={interval}
          onIntervalChange={onIntervalChange}
          showInterval={activeTab !== "live"}
        />
      </div>
    </div>
  );
}
