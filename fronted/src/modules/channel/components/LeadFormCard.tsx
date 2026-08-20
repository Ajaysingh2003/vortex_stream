"use client";

import React from "react";
import { Users, ArrowUpRight, CheckCircle2, XCircle, FileText } from "lucide-react";

const ACCENT_COLOR = "#0CC23D";

type RecentSubmission = {
  id: string;
  videoTitle?: string;
  emailOrLabel?: string;
  skipped: boolean;
  createdAt: string;
};

type LeadSubmissionsCardProps = {
  totalSubmissions?: number;
  totalSkipped?: number;
  recentSubmissions?: RecentSubmission[];
  onViewAllLeads?: () => void;
};

// Fallback preview data matching LeadFormSubmission model
const defaultRecent: RecentSubmission[] = [
  {
    id: "1",
    videoTitle: "Product Demo v2",
    emailOrLabel: "alex.dev@gmail.com",
    skipped: false,
    createdAt: "10 mins ago",
  },
  {
    id: "2",
    videoTitle: "Onboarding Walkthrough",
    emailOrLabel: "sarah.m@company.io",
    skipped: false,
    createdAt: "1 hour ago",
  },
  {
    id: "3",
    videoTitle: "Product Demo v2",
    emailOrLabel: "Skipped by viewer",
    skipped: true,
    createdAt: "3 hours ago",
  },
];

export default function LeadSubmissionsCard({
  totalSubmissions = 42,
  totalSkipped = 8,
  recentSubmissions = defaultRecent,
  onViewAllLeads,
}: LeadSubmissionsCardProps) {
  const completedCount = totalSubmissions - totalSkipped;
  const conversionRate =
    totalSubmissions > 0
      ? Math.round((completedCount / totalSubmissions) * 100)
      : 0;

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-stone-200/80 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex size-9 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `${ACCENT_COLOR}1a`,
              color: ACCENT_COLOR,
            }}
          >
            <Users className="size-4" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-stone-900">
              Lead Captures
            </h3>
            <p className="text-[11px] text-stone-400">In-video form submissions</p>
          </div>
        </div>

        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-600">
          {conversionRate}% Conversion
        </span>
      </div>

      {/* Main Metric */}
      <div className="mt-4 flex items-baseline justify-between">
        <div>
          <span className="text-2xl font-bold tracking-tight text-stone-900">
            {completedCount.toLocaleString()}
          </span>
          <span className="ml-1.5 text-xs text-stone-400">
            leads captured ({totalSkipped} skipped)
          </span>
        </div>
      </div>

      {/* Recent Submissions List */}
      <div className="mt-4 flex flex-col gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
          Recent Responses
        </p>
        <div className="flex flex-col divide-y divide-stone-100 rounded-lg border border-stone-100 bg-stone-50/50">
          {recentSubmissions.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2.5 text-xs"
            >
              <div className="flex items-center gap-2.5 truncate">
                {item.skipped ? (
                  <XCircle className="size-3.5 shrink-0 text-stone-400" />
                ) : (
                  <CheckCircle2
                    className="size-3.5 shrink-0"
                    style={{ color: ACCENT_COLOR }}
                  />
                )}
                <div className="truncate">
                  <p className="font-medium text-stone-800 truncate">
                    {item.emailOrLabel || "Anonymous Response"}
                  </p>
                  <p className="text-[10px] text-stone-400 truncate">
                    {item.videoTitle}
                  </p>
                </div>
              </div>

              <span className="shrink-0 text-[10px] text-stone-400">
                {item.createdAt}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Link */}
      <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-xs">
        <span className="text-[11px] text-stone-400">
          Synced across active video forms
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