"use client";

import React from "react";
import { Film, ArrowUpRight } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

// Primary accent color configuration (Change here to update all instances)
const ACCENT_COLOR = "#F23CAF";

type VideoOverview = {
  totalVideos: number;
  statusBreakdown: {
    ready: number;
    processing: number;
    pending: number;
  };
};

type TotalVideosCardProps = {
  workspaceId: string;
  onViewLibrary?: () => void;
};

export default function TotalVideosCard({
  workspaceId,
  onViewLibrary,
}: TotalVideosCardProps) {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.video.getVideoOverview.queryOptions({ workspaceId }),
  );
  const overview = data as VideoOverview;
  const { totalVideos, statusBreakdown } = overview;

  const readyCount = statusBreakdown.ready ?? 0;
  const processingCount = statusBreakdown.processing ?? 0;
  const pendingCount = statusBreakdown.pending ?? 0;

  const total = totalVideos > 0 ? totalVideos : 1;
  const readyPct = Math.round((readyCount / total) * 100);

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-stone-200/80 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex size-9 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `${ACCENT_COLOR}1a`, // ~10% opacity background
              color: ACCENT_COLOR,
            }}
          >
            <Film className="size-4" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-stone-900">
              Total Videos
            </h3>
            <p className="text-[11px] text-stone-400">Library overview</p>
          </div>
        </div>

        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-600">
          Unlimited
        </span>
      </div>

      {/* Main Metric */}
      <div className="mt-4 flex items-baseline justify-between">
        <div>
          <span className="text-2xl font-bold tracking-tight text-stone-900">
            {totalVideos.toLocaleString()}
          </span>
          <span className="ml-1.5 text-xs text-stone-400">
            videos in workspace
          </span>
        </div>

        <span className="text-xs font-semibold text-stone-700">
          {readyPct}% ready
        </span>
      </div>

      {/* Minimal Progress Bar */}
      <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-stone-100">
        <div
          style={{
            width: `${(readyCount / total) * 100}%`,
            backgroundColor: ACCENT_COLOR,
          }}
          className="transition-all duration-500"
        />
        <div
          style={{ width: `${(processingCount / total) * 100}%` }}
          className="bg-amber-400 transition-all duration-500"
        />
        <div
          style={{ width: `${(pendingCount / total) * 100}%` }}
          className="bg-stone-300 transition-all duration-500"
        />
      </div>

      {/* Status Legend */}
      <div className="mt-4 flex items-center justify-between text-xs text-stone-500">
        <div className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: ACCENT_COLOR }}
          />
          <span className="text-[11px]">{readyCount} Ready</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-amber-400" />
          <span className="text-[11px]">{processingCount} Active</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-stone-300" />
          <span className="text-[11px]">{pendingCount} Draft</span>
        </div>
      </div>

      {/* Footer Link */}
      <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-xs">
        <span className="text-[11px] text-stone-400">
          Governed by plan storage
        </span>

        {onViewLibrary && (
          <button
            onClick={onViewLibrary}
            style={{ color: ACCENT_COLOR }}
            className="group flex items-center gap-1 font-semibold transition-opacity hover:opacity-80"
          >
            <span>Library</span>
            <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
        )}
      </div>
    </div>
  );
}
