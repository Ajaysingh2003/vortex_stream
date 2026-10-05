"use client";

import React, { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "../../components/MetricCard";
import { AnalyticsChart, type DataPoint } from "../../components/AnalyticsChart";
import { ChartSkeleton } from "../../components/ReportState";
import { formatNumber, formatPercent } from "../../lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import type { DateRangeState, IntervalChoice } from "../../lib/date-range";

interface ConversionsSectionProps {
  videoId?: string;
  range: DateRangeState;
  interval: IntervalChoice;
}

export function ConversionsSection({
  videoId,
  range,
  interval,
}: ConversionsSectionProps) {
  const trpc = useTRPC();
  const [funnelTemplate, setFunnelTemplate] = useState<
    "inplay_lead" | "preplay_lead" | "cta_response" | "cta_to_lead"
  >("inplay_lead");

  // Summary
  const { data: summary, isLoading: isSummaryLoading } = useQuery(
    trpc.analytics.summary.queryOptions({
      videoId,
      from: range.from,
      to: range.to,
    }),
  );

  // Series for Submissions
  const { data: seriesPoints, isLoading: isSeriesLoading } = useQuery(
    trpc.analytics.series.queryOptions({
      videoId,
      from: range.from,
      to: range.to,
      interval,
      metric: "form_submissions",
    }),
  );

  // Sequential Funnel Query
  const { data: funnelData, isLoading: isFunnelLoading } = useQuery(
    trpc.analytics.funnels.queryOptions({
      videoId,
      from: range.from,
      to: range.to,
      template: funnelTemplate,
      windowMinutes: 30,
    }),
  );

  const current = summary?.current;
  const previous = summary?.previous;

  const chartData: DataPoint[] = (seriesPoints?.items || []).map((pt) => ({
    key: pt.key,
    value: pt.metrics.form_submissions || 0,
  }));

  return (
    <div className="space-y-6">
      {/* 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Saved Form Submissions"
          value={formatNumber(current?.form_submissions)}
          currentRaw={current?.form_submissions}
          previousRaw={previous?.form_submissions}
          loading={isSummaryLoading}
          description="authoritative leads stored in database"
        />
        <MetricCard
          title="Observed Form Conversion"
          value={formatPercent(current?.form_conversion_rate, current?.form_opened_sessions)}
          currentRaw={current?.form_conversion_rate}
          previousRaw={previous?.form_conversion_rate}
          isRate
          loading={isSummaryLoading}
          description="submitted / opened form sessions"
        />
        <MetricCard
          title="CTA Clicks"
          value={formatNumber(current?.cta_clicks)}
          currentRaw={current?.cta_clicks}
          previousRaw={previous?.cta_clicks}
          loading={isSummaryLoading}
          description="call-to-action button clicks"
        />
        <MetricCard
          title="CTA Click Rate"
          value={formatPercent(current?.cta_click_rate, current?.cta_exposed_sessions)}
          currentRaw={current?.cta_click_rate}
          previousRaw={previous?.cta_click_rate}
          isRate
          loading={isSummaryLoading}
          description="clicking / exposed CTA sessions"
        />
      </div>

      {/* Two Separated Blocks: Authoritative Saved Submissions vs Observed Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Block 1: Authoritative Submissions */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-stone-900 tracking-tight">
                Authoritative Saved Submissions
              </h3>
              {videoId && (
                <Link
                  href={`/console/content-library/video/${videoId}/leads`}
                  className="text-xs text-stone-600 hover:text-stone-900 font-medium inline-flex items-center gap-1 underline underline-offset-2"
                >
                  <span>View in Leads</span>
                  <ExternalLink className="size-3" />
                </Link>
              )}
            </div>
            <p className="text-xs text-stone-500 mb-4">
              Accepted forms committed to PostgreSQL database
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                <span className="text-xs text-stone-500">Accepted Leads</span>
                <p className="text-xl font-bold font-mono text-stone-900 mt-1">
                  {formatNumber(current?.form_submissions)}
                </p>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                <span className="text-xs text-stone-500">Form Skips</span>
                <p className="text-xl font-bold font-mono text-stone-900 mt-1">
                  {formatNumber(current?.form_skips)}
                </p>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-stone-400">
            Source: PostgreSQL authoritative database storage
          </p>
        </div>

        {/* Block 2: Observed Telemetry */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-stone-900 tracking-tight mb-1">
              Observed Player Telemetry
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Client-reported form and CTA lifecycle events
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-100 text-center">
                <span className="text-[11px] text-stone-500">Opens</span>
                <p className="text-base font-bold font-mono text-stone-900 mt-0.5">
                  {formatNumber(current?.form_opens)}
                </p>
              </div>
              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-100 text-center">
                <span className="text-[11px] text-stone-500">Starts</span>
                <p className="text-base font-bold font-mono text-stone-900 mt-0.5">
                  {formatNumber(current?.form_starts)}
                </p>
              </div>
              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-100 text-center">
                <span className="text-[11px] text-stone-500">CTA Displays</span>
                <p className="text-base font-bold font-mono text-stone-900 mt-0.5">
                  {formatNumber(current?.cta_displays)}
                </p>
              </div>
              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-100 text-center">
                <span className="text-[11px] text-stone-500">End screens</span>
                <p className="text-base font-bold font-mono text-stone-900 mt-0.5">
                  {formatNumber(current?.end_screen_clicks)}
                </p>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-stone-400">
            Source: Browser event stream (non-authoritative for CRM records)
          </p>
        </div>
      </div>

      {/* Sequential Funnel Visualization */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-stone-900 tracking-tight">
              Sequential Conversion Funnel
            </h3>
            <p className="text-xs text-stone-500">
              Ordered multi-step session conversion within a 30-minute window
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 font-medium">Template:</span>
            <Select
              value={funnelTemplate}
              onValueChange={(val) =>
                setFunnelTemplate(
                  val as "inplay_lead" | "preplay_lead" | "cta_response" | "cta_to_lead",
                )
              }
            >
              <SelectTrigger className="h-8 text-xs bg-stone-50 border-stone-200 text-stone-800 min-w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-stone-200">
                <SelectItem value="inplay_lead" className="text-xs">In-play Lead Form</SelectItem>
                <SelectItem value="preplay_lead" className="text-xs">Pre-play Gate Form</SelectItem>
                <SelectItem value="cta_response" className="text-xs">Play to CTA Click</SelectItem>
                <SelectItem value="cta_to_lead" className="text-xs">CTA to Lead Submission</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isFunnelLoading ? (
          <div className="h-32 flex items-center justify-center text-xs text-stone-400">
            Loading funnel cohort steps...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {funnelData?.steps.map((step) => (
              <div
                key={step.step_index}
                className="bg-stone-50 border border-stone-100 rounded-xl p-4 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-xs text-stone-400 mb-2 font-mono">
                  <span>Step {step.step_index + 1}</span>
                  <span>{step.drop_off_rate > 0 ? `-${step.drop_off_rate.toFixed(1)}%` : "Entry"}</span>
                </div>
                <h4 className="text-xs font-semibold text-stone-800 truncate mb-1">
                  {step.step_name}
                </h4>
                <p className="text-xl font-bold font-mono text-stone-900 tabular-nums">
                  {formatNumber(step.sessions)}
                </p>
                <div className="mt-3 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] font-mono text-stone-500">
                  <span>Conv. Rate:</span>
                  <span className="font-semibold text-stone-800">{step.conversion_rate.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submissions Trend Chart */}
      {isSeriesLoading ? (
        <ChartSkeleton height={280} />
      ) : (
        <AnalyticsChart
          title="Saved Lead Submissions Trend"
          data={chartData}
          unit="number"
          metricLabel="Saved leads"
        />
      )}
    </div>
  );
}
