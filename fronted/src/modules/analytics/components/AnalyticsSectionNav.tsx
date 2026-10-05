"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Radio,
  Users,
  ChartNoAxesCombined,
  MousePointerClick,
  Activity,
  FormInput,
  Timer,
  Eye,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AnalyticsTab } from "../types";
import { getAnalyticsUrl } from "../lib/routes";

export const ANALYTICS_TABS = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "live", label: "Real-time", icon: Radio },
  { value: "audience", label: "Audience", icon: Users },
  { value: "engagement", label: "Engagement", icon: ChartNoAxesCombined },
  { value: "conversions", label: "Conversions", icon: MousePointerClick },
  { value: "playback", label: "Playback quality", icon: Activity },
  { value: "form_submissions", label: "Form Submissions", icon: FormInput },
  { value: "cta_clicks", label: "CTA Clicks", icon: MousePointerClick },
  { value: "watch_time", label: "Watch Time", icon: Timer },
  { value: "views", label: "Views", icon: Eye },
] as const;

interface AnalyticsSectionNavProps {
  activeTab: AnalyticsTab;
  videoId?: string;
  onChangeTab?: (tab: AnalyticsTab) => void;
  className?: string;
}

export function AnalyticsSectionNav({
  activeTab,
  videoId,
  onChangeTab,
  className,
}: AnalyticsSectionNavProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSelectChange = (val: string) => {
    const selectedTab = val as AnalyticsTab;
    if (onChangeTab) {
      onChangeTab(selectedTab);
    } else {
      const url = getAnalyticsUrl(selectedTab, videoId, searchParams);
      router.push(url);
    }
  };

  return (
    <div className={cn("w-full mb-6", className)}>
      {/* Mobile Selector */}
      <div className="sm:hidden w-full">
        <Select value={activeTab} onValueChange={handleSelectChange}>
          <SelectTrigger className="w-full h-10 bg-white border-stone-200 text-sm font-medium">
            <SelectValue placeholder="Select section" />
          </SelectTrigger>
          <SelectContent className="bg-white border-stone-200">
            {ANALYTICS_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <SelectItem key={tab.value} value={tab.value} className="text-sm">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-stone-500" />
                    <span>{tab.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop / Tablet Horizontal Bar */}
      <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-stone-200/80">
        {ANALYTICS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;
          const href = getAnalyticsUrl(tab.value as AnalyticsTab, videoId, searchParams);

          if (onChangeTab) {
            return (
              <button
                key={tab.value}
                onClick={() => onChangeTab(tab.value as AnalyticsTab)}
                type="button"
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border",
                  isActive
                    ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                    : "bg-transparent text-stone-600 border-transparent hover:bg-stone-100 hover:text-stone-900",
                )}
              >
                <Icon
                  className={cn(
                    "size-3.5 shrink-0",
                    isActive ? "text-primary" : "text-stone-400",
                  )}
                />
                <span>{tab.label}</span>
                {tab.value === "live" && (
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                )}
              </button>
            );
          }

          return (
            <Link
              key={tab.value}
              href={href}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border",
                isActive
                  ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                  : "bg-transparent text-stone-600 border-transparent hover:bg-stone-100 hover:text-stone-900",
              )}
            >
              <Icon
                className={cn(
                  "size-3.5 shrink-0",
                  isActive ? "text-primary" : "text-stone-400",
                )}
              />
              <span>{tab.label}</span>
              {tab.value === "live" && (
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
