"use client";

import React from "react";
import { Users, ArrowUpRight, CheckCircle2, XCircle, FormInput } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { formatReadableDate } from "@/lib/utils";

const ACCENT_COLOR = "#0CC23D";

type RecentSubmission = {
  id: string;
  videoTitle: string;
  leadIdentifier: string;
  skipped: boolean;
  createdAt: string;
};

type LeadSubmissionsCardProps = {
  workspaceId: string;
  onViewAllLeads?: () => void;
};

export default function LeadSubmissionsCard({
  workspaceId,
  onViewAllLeads,
}: LeadSubmissionsCardProps) {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.form.getOverview.queryOptions({ workspaceId }),
  );
  
  const overview = data as {
    totalForms: number;
    totalSubmissions: number;
    completedSubmissions: number;
    skippedSubmissions: number;
    conversionRate: number;
    recentSubmissions: RecentSubmission[];
  };

  const recentSubmissions = overview.recentSubmissions ?? [];

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-stone-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:border-stone-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex size-9 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `${ACCENT_COLOR}15`,
              color: ACCENT_COLOR,
            }}
          >
            <Users className="size-4" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-stone-900">
              Lead Captures
            </h3>
            <p className="text-[11px] text-stone-400">
              {overview.totalForms} active {overview.totalForms === 1 ? "form" : "forms"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-700">
          <FormInput className="size-3 text-stone-500" />
          <span>{overview.conversionRate}% Rate</span>
        </div>
      </div>

      {/* Primary KPI Summary Row */}
      <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-stone-50/70 p-2.5">
        <div className="flex flex-col border-r border-stone-200/60 pr-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
            Captured
          </span>
          <span className="mt-0.5 text-xl font-bold tracking-tight text-stone-900">
            {overview.completedSubmissions.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col pl-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
            Skipped / Total
          </span>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-base font-semibold text-stone-700">
              {overview.skippedSubmissions}
            </span>
            <span className="text-xs text-stone-400">
              / {overview.totalSubmissions}
            </span>
          </div>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            Recent Activity
          </p>
          <span className="text-[10px] font-medium text-stone-400">
            Top 3
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          {recentSubmissions.length === 0 ? (
            <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-stone-200 bg-stone-50/50 text-center">
              <p className="text-xs text-stone-400">No submission responses recorded</p>
            </div>
          ) : (
            recentSubmissions.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between rounded-lg border border-stone-100 bg-white p-2 text-xs transition-colors hover:border-stone-200"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="shrink-0">
                    {item.skipped ? (
                      <div className="flex size-6 items-center justify-center rounded-md bg-stone-100 text-stone-400">
                        <XCircle className="size-3.5" />
                      </div>
                    ) : (
                      <div
                        className="flex size-6 items-center justify-center rounded-md"
                        style={{
                          backgroundColor: `${ACCENT_COLOR}15`,
                          color: ACCENT_COLOR,
                        }}
                      >
                        <CheckCircle2 className="size-3.5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-stone-900 truncate">
                      {item.leadIdentifier || "Anonymous Response"}
                    </p>
                    <p className="text-[10px] text-stone-400 truncate">
                      {item.videoTitle}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 text-[10px] font-medium text-stone-400">
                  {formatReadableDate(item.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-xs">
        <span className="text-[11px] text-stone-400">
          Syncing automatically
        </span>

        {onViewAllLeads && (
          <button
            onClick={onViewAllLeads}
            style={{ color: ACCENT_COLOR }}
            className="group flex items-center gap-1 font-semibold transition-opacity hover:opacity-80"
          >
            <span>All Submissions</span>
            <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
        )}
      </div>
    </div>
  );
}