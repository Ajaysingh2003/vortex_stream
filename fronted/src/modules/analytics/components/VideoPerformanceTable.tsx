"use client";

import React from "react";
import Link from "next/link";
import { type VideoRankingRow } from "../types";
import { formatNumber, formatDuration, formatPercent } from "../lib/format";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPerformanceTableProps {
  videos: VideoRankingRow[];
  totalLoaded?: number;
  offset: number;
  limit: number;
  onPageChange: (newOffset: number) => void;
  className?: string;
}

export function VideoPerformanceTable({
  videos,
  offset,
  limit,
  onPageChange,
  className,
}: VideoPerformanceTableProps) {
  const hasNext = videos.length === limit;
  const hasPrev = offset > 0;

  return (
    <div
      className={cn(
        "bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex flex-col justify-between",
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 tracking-tight">
            Video Performance
          </h3>
          <p className="text-xs text-stone-500">
            Ranked by playback sessions in the selected date range
          </p>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-500 font-mono">
            Showing {offset + 1}–{offset + videos.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={!hasPrev}
              onClick={() => onPageChange(Math.max(0, offset - limit))}
              className="size-7 border-stone-200"
              title="Previous page"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={!hasNext}
              onClick={() => onPageChange(offset + limit)}
              className="size-7 border-stone-200"
              title="Next page"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto text-xs">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-stone-100 text-stone-400 font-medium">
              <th className="py-2.5 pr-4">Video</th>
              <th className="py-2.5 px-3 text-right">Views</th>
              <th className="py-2.5 px-3 text-right">Unique viewers</th>
              <th className="py-2.5 px-3 text-right">Playing time</th>
              <th className="py-2.5 px-3 text-right">Completion</th>
              <th className="py-2.5 px-3 text-right">Saved leads</th>
              <th className="py-2.5 pl-3 text-right">CTA clicks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {videos.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-stone-400">
                  No video activity observed in this period
                </td>
              </tr>
            ) : (
              videos.map((vid) => (
                <tr
                  key={vid.video_id}
                  className="hover:bg-stone-50/80 transition-colors"
                >
                  <td className="py-3 pr-4 max-w-xs">
                    <Link
                      href={`/console/analytics/${vid.video_id}`}
                      className="flex items-center gap-2.5 group"
                    >
                      <div className="size-7 rounded bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 text-stone-400 group-hover:text-stone-700">
                        <Video className="size-3.5" />
                      </div>
                      <span className="font-semibold text-stone-900 group-hover:underline truncate" title={vid.title}>
                        {vid.title || "Untitled Video"}
                      </span>
                    </Link>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-stone-900 font-medium tabular-nums">
                    {formatNumber(vid.metrics.views)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-stone-600 tabular-nums">
                    {formatNumber(vid.metrics.unique_viewers)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-stone-600 tabular-nums">
                    {formatDuration(vid.metrics.playback_ms)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-stone-600 tabular-nums">
                    {formatPercent(vid.metrics.completion_rate, vid.metrics.views)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-stone-600 tabular-nums">
                    {formatNumber(vid.metrics.form_submissions)}
                  </td>
                  <td className="py-3 pl-3 text-right font-mono text-stone-600 tabular-nums">
                    {formatNumber(vid.metrics.cta_clicks)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
