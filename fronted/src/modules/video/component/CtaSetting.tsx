"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VideoAsset, VideoCta, WorkspaceType } from "@/modules/types";
import { useTRPC } from "@/trpc/client";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Clock, Link2, Plus, Trash2, Type } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Sketch from "@uiw/react-color-sketch";

interface CTA {
  id: string;
  text: string;
  url: string;
  startTime: string;
  endTime: string;
  fontColor: string;
  bgColor: string;
  openIn: "new_tab" | "same_tab";
  position:
    | "top_left"
    | "top_right"
    | "bottom_left"
    | "bottom_right"
    | "center";
}

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `cta-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const DEFAULT_FONT_COLOR = "#FFFFFF";
const DEFAULT_BG_COLOR = "#7C3AED";

function parseTimeToSeconds(raw: string): number | null {
  const cleaned = raw.trim();
  if (!cleaned) return 0;
  const parts = cleaned.split(":").map((p) => p.trim());
  if (parts.some((p) => p === "" || Number.isNaN(Number(p)))) return null;
  const nums = parts.map(Number);
  if (nums.length === 1) {
    const [s] = nums;
    return s >= 0 ? s : null;
  }
  if (nums.length === 2) {
    const [m, s] = nums;
    if (m < 0 || s < 0 || s > 59) return null;
    return m * 60 + s;
  }
  if (nums.length === 3) {
    const [h, m, s] = nums;
    if (h < 0 || m < 0 || m > 59 || s < 0 || s > 59) return null;
    return h * 3600 + m * 60 + s;
  }
  return null;
}

function formatSeconds(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) {
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const MAX_FREE_CTAS = 1;

const OPEN_IN_OPTIONS: { value: CTA["openIn"]; label: string }[] = [
  { value: "new_tab", label: "New Tab" },
  { value: "same_tab", label: "Same Tab" },
];

const POSITION_OPTIONS: { value: CTA["position"]; label: string }[] = [
  { value: "top_left", label: "Top Left" },
  { value: "top_right", label: "Top Right" },
  { value: "bottom_left", label: "Bottom Left" },
  { value: "bottom_right", label: "Bottom Right" },
  { value: "center", label: "Center" },
];

function ColorPicker({
  color,
  onChange,
  label,
}: {
  color: string;
  onChange: (hex: string) => void;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
        {label}
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-9 w-full items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-1.5 shadow-xs transition-colors hover:border-neutral-300 focus:outline-hidden"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-4 w-4 rounded-full border border-neutral-200 shadow-xs"
                style={{ backgroundColor: color }}
              />
              <span className="font-mono text-xs text-neutral-700 uppercase">
                {color}
              </span>
            </div>
            <span className="text-[10px] font-medium text-neutral-400">Pick</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 border border-neutral-200 shadow-lg rounded-xl overflow-hidden"
          align="start"
        >
          <Sketch
            color={color}
            disableAlpha
            presetColors={[
              "#000000",
              "#FFFFFF",
              "#7C3AED",
              "#EF4444",
              "#F59E0B",
              "#10B981",
              "#3B82F6",
              "#EC4899",
              "#6366F1",
              "#14B8A6",
            ]}
            onChange={(colorResult) => {
              onChange(colorResult.hex.toUpperCase());
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function CTAShow({ isPremium }: { isPremium?: boolean }) {
  const trpc = useTRPC();
  const { data: workspace } = useSuspenseQuery(
    trpc.user.getWorkspace.queryOptions(),
  );
  const workspaceData = workspace as WorkspaceType;
  const params = useParams();
  const videoId = params.id;

  const { data: videoData } = useSuspenseQuery(
    trpc.video.getVideoFromWorkspace.queryOptions({
      videoId: videoId as string,
      workspaceID: workspaceData.id,
    }),
  );

  const { data: ctaData } = useSuspenseQuery(
    trpc.video.getVideoCtas.queryOptions({
      videoId: videoId as string,
    }),
  );

  const ctaDataArray = ctaData as VideoCta[] | undefined;
  const videoDataType = videoData as VideoAsset;
  const videoDurationSeconds = videoDataType?.duration as number | undefined;

  const convertCtaDataToCTA = (cta: VideoCta): CTA => ({
    id: cta.id,
    text: cta.title,
    url: cta.url,
    startTime: cta.start_time,
    endTime: cta.end_time,
    fontColor: cta.font_color || DEFAULT_FONT_COLOR,
    bgColor: cta.background_color || DEFAULT_BG_COLOR,
    openIn: cta.open_in as "new_tab" | "same_tab",
    position: cta.position as
      | "top_left"
      | "top_right"
      | "bottom_left"
      | "bottom_right"
      | "center",
  });

  const initialCtas = ctaDataArray?.map(convertCtaDataToCTA) ?? [];
  const [ctas, setCtas] = useState<CTA[]>(
    ctaDataArray && ctaDataArray.length > 0
      ? initialCtas
      : [
          {
            id: makeId(),
            text: "",
            url: "",
            startTime: "00:00",
            endTime: "00:05",
            fontColor: DEFAULT_FONT_COLOR,
            bgColor: DEFAULT_BG_COLOR,
            openIn: "new_tab",
            position: "top_right",
          },
        ],
  );

  const [draftTimes, setDraftTimes] = useState<
    Record<string, { start: string; end: string }>
  >({});
  const [timeErrors, setTimeErrors] = useState<
    Record<string, { start?: string; end?: string }>
  >({});

  useEffect(() => {
    setDraftTimes((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const c of ctas) {
        if (!(c.id in next)) {
          next[c.id] = { start: c.startTime, end: c.endTime };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [ctas]);

  const updateField = <K extends keyof CTA>(
    id: string,
    field: K,
    value: CTA[K],
  ) => {
    setCtas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const handleTimeChange = (
    id: string,
    field: "start" | "end",
    value: string,
  ) => {
    setDraftTimes((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
    if (timeErrors[id]?.[field]) {
      setTimeErrors((prev) => {
        const next = { ...prev, [id]: { ...prev[id] } };
        delete next[id][field];
        return next;
      });
    }
  };

  const commitTime = (id: string, field: "start" | "end") => {
    const raw = draftTimes[id]?.[field] ?? "";
    const seconds = parseTimeToSeconds(raw);

    if (seconds === null) {
      setTimeErrors((prev) => ({
        ...prev,
        [id]: { ...prev[id], [field]: "Invalid format" },
      }));
      return;
    }

    if (videoDurationSeconds != null && seconds > videoDurationSeconds) {
      setTimeErrors((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          [field]: `Max ${formatSeconds(videoDurationSeconds)}`,
        },
      }));
      return;
    }

    const cta = ctas.find((c) => c.id === id);
    if (!cta) return;

    const startSec =
      parseTimeToSeconds(
        field === "start" ? raw : (draftTimes[id]?.start ?? cta.startTime),
      ) ?? 0;
    const endSec =
      parseTimeToSeconds(
        field === "end" ? raw : (draftTimes[id]?.end ?? cta.endTime),
      ) ?? 0;

    if (endSec <= startSec) {
      setTimeErrors((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          [field]:
            field === "end" ? "Must be after start" : "Must be before end",
        },
      }));
      return;
    }

    const normalized = formatSeconds(seconds);
    setCtas((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, [field === "start" ? "startTime" : "endTime"]: normalized }
          : c,
      ),
    );
    setDraftTimes((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: normalized },
    }));
    setTimeErrors((prev) => {
      const next = { ...prev, [id]: { ...prev[id] } };
      delete next[id][field];
      return next;
    });
  };

  const canAdd = isPremium || ctas.length < MAX_FREE_CTAS;

  const addCTA = () => {
    if (!canAdd) return;
    const last = ctas[ctas.length - 1];
    const lastEnd = last ? (parseTimeToSeconds(last.endTime) ?? 0) : 0;
    let start = lastEnd + 1;
    let end = start + 5;
    if (videoDurationSeconds != null) {
      if (start > videoDurationSeconds) start = videoDurationSeconds;
      if (end > videoDurationSeconds) end = videoDurationSeconds;
    }
    if (end <= start) end = start + 1;
    const cta: CTA = {
      id: makeId(),
      text: "",
      url: "",
      startTime: formatSeconds(start),
      endTime: formatSeconds(end),
      fontColor: DEFAULT_FONT_COLOR,
      bgColor: DEFAULT_BG_COLOR,
      openIn: "new_tab",
      position: "top_right",
    };
    setCtas((prev) => [...prev, cta]);
    setDraftTimes((prev) => ({
      ...prev,
      [cta.id]: { start: cta.startTime, end: cta.endTime },
    }));
  };

  const removeCTA = (id: string) => {
    if (ctas.length <= 1) return;
    setCtas((prev) => prev.filter((c) => c.id !== id));
    setDraftTimes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setTimeErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const mutateSave = useMutation(
    trpc.video.VideoCta.mutationOptions({
      onSuccess: () => toast.success("CTAs saved successfully"),
      onError: (err) => toast.error(err.message ?? "Something went wrong"),
    }),
  );

  const handleSubmit = async () => {
    await mutateSave.mutateAsync({
      video_id: videoDataType.id,
      workspaceID: workspaceData.id,
      items: ctas.map((c) => ({
        title: c.text,
        url: c.url,
        start_time: c.startTime,
        end_time: c.endTime,
        font_color: c.fontColor,
        background_color: c.bgColor,
        open_in: c.openIn,
        position: c.position,
      })),
    });
  };

  const hasErrors = Object.values(timeErrors).some((e) => e.start || e.end);
  const atFreeLimit = !isPremium && ctas.length >= MAX_FREE_CTAS;

  return (
    <div className="w-full rounded-2xl bg-transparent px-1 md:px-3 pt-5">
      <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-4">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-neutral-100 pb-4">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-neutral-900">
              Call to Actions
            </h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              Trigger interactive overlay buttons at chosen moments during playback.
            </p>
          </div>
          {!isPremium && (
            <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-500">
              {ctas.length}/{MAX_FREE_CTAS} CTAs
            </span>
          )}
        </div>

        {/* CTA Stack */}
        <div className="space-y-4">
          {ctas.map((cta, index) => (
            <div
              key={cta.id}
              className="relative rounded-xl border border-neutral-200/80 bg-neutral-50/40 p-2 md:p-4 transition-all hover:border-neutral-300"
            >
              {/* Card Meta Bar */}
              <div className="mb-3.5 flex items-center justify-between border-b border-neutral-200/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-neutral-200/80 text-[11px] font-semibold text-neutral-700">
                    {index + 1}
                  </span>
                  <span className="text-xs font-medium text-neutral-800">
                    {cta.text.trim() || "Untitled CTA"}
                  </span>
                </div>

                {ctas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCTA(cta.id)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Remove CTA"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-3.5">
                {/* Text & URL */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                      Button Text
                    </Label>
                    <div className="relative">
                      <Type className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                      <Input
                        value={cta.text}
                        onChange={(e) =>
                          updateField(cta.id, "text", e.target.value)
                        }
                        placeholder="e.g. Schedule a Demo"
                        className="h-9 rounded-lg border-neutral-200 bg-white pl-8 text-xs focus-visible:border-neutral-400 focus-visible:ring-0"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                      Destination URL
                    </Label>
                    <div className="relative">
                      <Link2 className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                      <Input
                        value={cta.url}
                        onChange={(e) =>
                          updateField(cta.id, "url", e.target.value)
                        }
                        placeholder="https://example.com"
                        className="h-9 rounded-lg border-neutral-200 bg-white pl-8 text-xs focus-visible:border-neutral-400 focus-visible:ring-0"
                      />
                    </div>
                  </div>
                </div>

                {/* Timing */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                      Show At
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                      <Input
                        value={draftTimes[cta.id]?.start ?? cta.startTime}
                        onChange={(e) =>
                          handleTimeChange(cta.id, "start", e.target.value)
                        }
                        onBlur={() => commitTime(cta.id, "start")}
                        onKeyDown={(e) =>
                          e.key === "Enter" && e.currentTarget.blur()
                        }
                        placeholder="00:00"
                        inputMode="numeric"
                        className={`h-9 rounded-lg border-neutral-200 bg-white pl-8 font-mono text-xs focus-visible:border-neutral-400 focus-visible:ring-0 ${
                          timeErrors[cta.id]?.start
                            ? "border-rose-400 focus-visible:border-rose-400"
                            : ""
                        }`}
                      />
                    </div>
                    {timeErrors[cta.id]?.start && (
                      <p className="text-[11px] text-rose-500">
                        {timeErrors[cta.id].start}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                      Hide At
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                      <Input
                        value={draftTimes[cta.id]?.end ?? cta.endTime}
                        onChange={(e) =>
                          handleTimeChange(cta.id, "end", e.target.value)
                        }
                        onBlur={() => commitTime(cta.id, "end")}
                        onKeyDown={(e) =>
                          e.key === "Enter" && e.currentTarget.blur()
                        }
                        placeholder="00:05"
                        inputMode="numeric"
                        className={`h-9 rounded-lg border-neutral-200 bg-white pl-8 font-mono text-xs focus-visible:border-neutral-400 focus-visible:ring-0 ${
                          timeErrors[cta.id]?.end
                            ? "border-rose-400 focus-visible:border-rose-400"
                            : ""
                        }`}
                      />
                    </div>
                    {timeErrors[cta.id]?.end && (
                      <p className="text-[11px] text-rose-500">
                        {timeErrors[cta.id].end}
                      </p>
                    )}
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ColorPicker
                    label="Text Color"
                    color={cta.fontColor}
                    onChange={(hex) => updateField(cta.id, "fontColor", hex)}
                  />
                  <ColorPicker
                    label="Background Color"
                    color={cta.bgColor}
                    onChange={(hex) => updateField(cta.id, "bgColor", hex)}
                  />
                </div>

                {/* Placement & Behavior */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                      Position On Screen
                    </Label>
                    <Select
                      value={cta.position}
                      onValueChange={(val) =>
                        updateField(cta.id, "position", val as CTA["position"])
                      }
                    >
                      <SelectTrigger className="h-9 w-full rounded-lg border-neutral-200 bg-white text-xs shadow-xs">
                        <SelectValue placeholder="Position" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-neutral-200 shadow-md">
                        {POSITION_OPTIONS.map((opt) => (
                          <SelectItem
                            className="text-xs focus:bg-neutral-100"
                            key={opt.value}
                            value={opt.value}
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                      Link Behavior
                    </Label>
                    <Select
                      value={cta.openIn}
                      onValueChange={(val) =>
                        updateField(cta.id, "openIn", val as CTA["openIn"])
                      }
                    >
                      <SelectTrigger className="h-9 w-full rounded-lg border-neutral-200 bg-white text-xs shadow-xs">
                        <SelectValue placeholder="Select target" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-neutral-200 shadow-md">
                        {OPEN_IN_OPTIONS.map((opt) => (
                          <SelectItem
                            className="text-xs focus:bg-neutral-100"
                            key={opt.value}
                            value={opt.value}
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Button */}
        <button
          type="button"
          onClick={addCTA}
          disabled={!canAdd}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 px-4 py-2.5 text-xs font-medium text-neutral-500 transition-all duration-200 hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-neutral-300 disabled:hover:bg-transparent"
        >
          <Plus className="h-4 w-4 stroke-[2]" />
          {atFreeLimit
            ? `Limit of ${MAX_FREE_CTAS} CTAs reached`
            : "Add Call to Action"}
        </button>

        {hasErrors && (
          <p className="mt-3 text-xs text-rose-500">
            Fix the highlighted times before saving.
          </p>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-2 flex justify-end px-2 py-2">
        <Button
          disabled={hasErrors || mutateSave.isPending}
          onClick={handleSubmit}
          className="h-8 rounded-full border bg-main-btn px-4 text-xs font-semibold tracking-wider text-white capitalize transition-all duration-200 cursor-pointer disabled:opacity-50"
        >
          {mutateSave.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

export default CTAShow;