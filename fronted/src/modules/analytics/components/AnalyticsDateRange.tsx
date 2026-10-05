"use client";

import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Clock, ChevronDown, ArrowRight } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type DateRangeState,
  type RangePreset,
  type IntervalChoice,
  getPresetRange,
  validateRange,
  isHourlyAllowed,
} from "../lib/date-range";
import { cn } from "@/lib/utils";

interface AnalyticsDateRangeProps {
  range: DateRangeState;
  onApply: (range: DateRangeState, interval: IntervalChoice) => void;
  interval: IntervalChoice;
  onIntervalChange?: (interval: IntervalChoice) => void;
  showInterval?: boolean;
  className?: string;
}

const PRESET_OPTIONS: { id: RangePreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
];

export function AnalyticsDateRange({
  range,
  onApply,
  interval,
  onIntervalChange,
  showInterval = true,
  className,
}: AnalyticsDateRangeProps) {
  const [open, setOpen] = useState(false);
  const [draftInterval, setDraftInterval] = useState<IntervalChoice>(interval);
  const [activePreset, setActivePreset] = useState<RangePreset>("7d");

  // Local draft date range for react-day-picker
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(() => ({
    from: range.from ? parseISO(range.from) : undefined,
    to: range.to ? parseISO(range.to) : undefined,
  }));

  // Sync state if external range prop changes
  useEffect(() => {
    setSelectedRange({
      from: range.from ? parseISO(range.from) : undefined,
      to: range.to ? parseISO(range.to) : undefined,
    });
  }, [range.from, range.to]);

  useEffect(() => {
    setDraftInterval(interval);
  }, [interval]);

  // Derive ISO strings for validation & queries
  const draftFromStr = selectedRange?.from ? format(selectedRange.from, "yyyy-MM-dd") : "";
  const draftToStr = selectedRange?.to
    ? format(selectedRange.to, "yyyy-MM-dd")
    : draftFromStr;

  const validation = validateRange(draftFromStr, draftToStr);
  const hourlyAllowed = isHourlyAllowed(draftFromStr, draftToStr);

  useEffect(() => {
    if (!hourlyAllowed && draftInterval === "hour") {
      setDraftInterval("day");
    }
  }, [hourlyAllowed, draftInterval]);

  const handlePresetSelect = (presetId: RangePreset) => {
    setActivePreset(presetId);
    if (presetId !== "custom") {
      const p = getPresetRange(presetId);
      setSelectedRange({
        from: parseISO(p.from),
        to: parseISO(p.to),
      });
    }
  };

  const handleCalendarSelect = (nextRange: DateRange | undefined) => {
    setActivePreset("custom");
    setSelectedRange(nextRange);
  };

  const handleApply = () => {
    if (!validation.valid || !draftFromStr) return;
    onApply({ from: draftFromStr, to: draftToStr }, draftInterval);
    if (onIntervalChange) {
      onIntervalChange(draftInterval);
    }
    setOpen(false);
  };

  const handleCancel = () => {
    setSelectedRange({
      from: range.from ? parseISO(range.from) : undefined,
      to: range.to ? parseISO(range.to) : undefined,
    });
    setDraftInterval(interval);
    setOpen(false);
  };

  // Format date preview for trigger button
  const formattedFrom = range.from ? format(parseISO(range.from), "LLL dd, y") : null;
  const formattedTo = range.to ? format(parseISO(range.to), "LLL dd, y") : null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2 select-none", className)}>
      {/* 2-Month Popover Trigger */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="analytics-date-range"
            variant="outline"
            className="h-9 px-3 rounded-md gap-2 bg-white border-black/[0.08] text-neutral-800 shadow-sm hover:bg-neutral-50 hover:border-black/20 transition-all font-normal"
          >
            <CalendarIcon className="size-4 text-neutral-500" />
            <span className="text-xs sm:text-sm font-medium">
              {formattedFrom ? (
                formattedTo && formattedTo !== formattedFrom ? (
                  <>
                    {formattedFrom} <span className="text-neutral-300">→</span> {formattedTo}
                  </>
                ) : (
                  formattedFrom
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </span>
            <ChevronDown className="size-3.5 text-neutral-400 opacity-60 ml-0.5" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-auto p-0 bg-white border border-black/[0.08] shadow-[0_16px_36px_rgba(0,0,0,0.12)] rounded-md z-50 overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row">
            {/* Quick Presets Column */}
            <div className="w-full sm:w-36 border-b sm:border-b-0 sm:border-r border-black/[0.06] bg-neutral-50/70 p-3 space-y-1">
              <span className="block px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Preset Range
              </span>
              {PRESET_OPTIONS.map((p) => {
                const isSelected = activePreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePresetSelect(p.id)}
                    className={cn(
                      "w-full flex items-center justify-between text-left text-xs px-2.5 py-1.5 rounded-md font-medium transition-all",
                      isSelected
                        ? "bg-neutral-950 text-white shadow-2xs font-semibold"
                        : "text-neutral-600 hover:bg-black/[0.05] hover:text-neutral-950"
                    )}
                  >
                    <span>{p.label}</span>
                    {isSelected && (
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: "#d1ff46" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* 2-Month Dual Calendar */}
            <div className="p-3">
              <Calendar
                mode="range"
                defaultMonth={selectedRange?.from}
                selected={selectedRange}
                onSelect={handleCalendarSelect}
                numberOfMonths={2}
                disabled={{ after: new Date() }}
                className="rounded-md"
              />

              {!validation.valid && (
                <div className="mt-2 rounded-md border border-red-200 bg-red-50/80 px-2.5 py-1.5 text-[11px] font-medium text-red-600">
                  {validation.error}
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between border-t border-black/[0.06] bg-neutral-50/40 px-3.5 py-2.5 text-xs">
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-mono">
              <Clock className="size-3 text-neutral-400" />
              <span>UTC Boundaries</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-8 px-2.5 text-xs text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 rounded-md"
              >
                Cancel
              </Button>

              <Button
                size="sm"
                disabled={!validation.valid || !selectedRange?.from}
                onClick={handleApply}
                className="primary-btn h-8 px-3.5 text-xs font-semibold rounded-md shadow-sm gap-1.5"
              >
                <span>Apply Range</span>
                <ArrowRight className="size-3" />
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Interval Selector */}
      {showInterval && (
        <Select
          value={draftInterval}
          onValueChange={(val) => {
            const next = val as IntervalChoice;
            setDraftInterval(next);
            if (onIntervalChange) {
              onIntervalChange(next);
            }
            onApply({ from: draftFromStr, to: draftToStr }, next);
          }}
        >
          <SelectTrigger className="h-9 w-26 text-xs rounded-md bg-white border-black/[0.08] text-neutral-800 shadow-sm hover:border-black/20 focus:ring-1 focus:ring-neutral-950 transition-colors">
            <SelectValue placeholder="Interval" />
          </SelectTrigger>
          <SelectContent
            position="popper"
            className="rounded-md border-black/[0.08] bg-white shadow-lg z-50 text-xs"
          >
            <SelectItem value="day" className="text-xs py-1.5 focus:bg-neutral-100">
              Daily
            </SelectItem>
            <SelectItem
              value="hour"
              disabled={!hourlyAllowed}
              className="text-xs py-1.5 focus:bg-neutral-100"
            >
              Hourly {!hourlyAllowed ? "(≤31d)" : ""}
            </SelectItem>
            <SelectItem value="week" className="text-xs py-1.5 focus:bg-neutral-100">
              Weekly
            </SelectItem>
          </SelectContent>
        </Select>
      )}

    </div>
  );
}