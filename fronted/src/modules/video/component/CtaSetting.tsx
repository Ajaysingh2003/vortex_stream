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
import { Plus, Trash2, Clock, Link2, Type } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
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
    if (s < 0) return null;
    return s;
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

/* ─── shadcn Color Picker ─── */
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
      <Label className="text-xs font-medium text-stone-500">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2.5 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 hover:border-stone-300 transition-all text-left"
          >
            <span
              className="h-5 w-5 rounded-md border border-stone-200 shrink-0 shadow-sm"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm text-stone-700 font-mono uppercase">
              {color}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-none shadow-xl" align="start">
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

/* ─── Main Component ─── */
function CTAShow({ isPremium }: { isPremium: boolean }) {
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
  const [ctas, setCtas] = useState<CTA[]>(ctaDataArray ? initialCtas : [
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
  ]);
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
    setDraftTimes((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
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
        [id]: { ...prev[id], [field]: "Invalid time format" },
      }));
      return;
    }

    if (videoDurationSeconds != null && seconds > videoDurationSeconds) {
      setTimeErrors((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          [field]: `Exceeds video length (${formatSeconds(videoDurationSeconds)})`,
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
            field === "end"
              ? "Must be after start time"
              : "Must be before end time",
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
    console.log(ctas,"from latinas");
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
    <div className="w-full rounded-2xl border border-stone-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
        <div>
          <h3 className="text-base font-semibold text-stone-900">CTAs</h3>
          <p className="mt-0.5 text-sm text-stone-500">
            Add call-to-action buttons that appear during playback.
          </p>
        </div>
        {!isPremium && (
          <span className="shrink-0 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-500">
            {ctas.length}/{MAX_FREE_CTAS} CTAs
          </span>
        )}
      </div>

      {/* Form Body */}
      <div className="px-6 py-5 space-y-6">
        {ctas.map((cta, index) => (
          <div
            key={cta.id}
            className="relative rounded-xl border border-stone-100 bg-stone-50/40 p-4 space-y-4"
          >
            {/* Row 1: Text + URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-stone-500">Text</Label>
                <div className="relative">
                  <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                  <Input
                    value={cta.text}
                    onChange={(e) => updateField(cta.id, "text", e.target.value)}
                    placeholder="Button text"
                    className="pl-9 h-9 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-stone-500">URL</Label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                  <Input
                    value={cta.url}
                    onChange={(e) => updateField(cta.id, "url", e.target.value)}
                    placeholder="https://"
                    className="pl-9 h-9 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Start Time + End Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-stone-500">Start Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                  <Input
                    value={draftTimes[cta.id]?.start ?? cta.startTime}
                    onChange={(e) =>
                      handleTimeChange(cta.id, "start", e.target.value)
                    }
                    onBlur={() => commitTime(cta.id, "start")}
                    onKeyDown={(e) =>
                      e.key === "Enter" && e.currentTarget.blur()
                    }
                    placeholder="MM:SS"
                    inputMode="numeric"
                    className={`pl-9 h-9 rounded-lg text-sm ${
                      timeErrors[cta.id]?.start
                        ? "border-red-400 focus-visible:ring-red-100"
                        : ""
                    }`}
                  />
                </div>
                {timeErrors[cta.id]?.start && (
                  <p className="text-xs text-red-500">
                    {timeErrors[cta.id].start}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-stone-500">End Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                  <Input
                    value={draftTimes[cta.id]?.end ?? cta.endTime}
                    onChange={(e) =>
                      handleTimeChange(cta.id, "end", e.target.value)
                    }
                    onBlur={() => commitTime(cta.id, "end")}
                    onKeyDown={(e) =>
                      e.key === "Enter" && e.currentTarget.blur()
                    }
                    placeholder="MM:SS"
                    inputMode="numeric"
                    className={`pl-9 h-9 rounded-lg text-sm ${
                      timeErrors[cta.id]?.end
                        ? "border-red-400 focus-visible:ring-red-100"
                        : ""
                    }`}
                  />
                </div>
                {timeErrors[cta.id]?.end && (
                  <p className="text-xs text-red-500">
                    {timeErrors[cta.id].end}
                  </p>
                )}
              </div>
            </div>

            {/* Row 3: Font Color + Background Color */}
            <div className="grid  grid-cols-1 md:grid-cols-2 gap-4">
              <ColorPicker
                label="Font Color"
                color={cta.fontColor}
                onChange={(hex) => updateField(cta.id, "fontColor", hex)}
              />
              <ColorPicker
                label="Background Color"
                color={cta.bgColor}
                onChange={(hex) => updateField(cta.id, "bgColor", hex)}
              />
            </div>

            {/* Row 4: Open In + Position */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-stone-500">Open In</Label>
                <Select
                  value={cta.openIn}
                  onValueChange={(val) =>
                    updateField(cta.id, "openIn", val as CTA["openIn"])
                  }
                >
                  <SelectTrigger className="h-9 rounded-lg text-sm">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="text-xs w-3 max-w-32 p-2">
                    {OPEN_IN_OPTIONS.map((opt) => (
                      <SelectItem className="text-xs focus-visible:bg-stone-100 focus:bg-stone-100 hover:bg-stone-100 w-full" key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-stone-500">Position</Label>
                <Select
                
                  value={cta.position}
                  onValueChange={(val) =>
                    updateField(cta.id, "position", val as CTA["position"])
                  }
                >
                  <SelectTrigger className="h-9 rounded-lg text-sm">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="text-xs w-3 max-w-32 p-2">
                    {POSITION_OPTIONS.map((opt) => (
                      <SelectItem className="text-xs focus-visible:bg-stone-100 focus:bg-stone-100 hover:bg-stone-100 w-fit" key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Remove CTA */}
            {/* <button
              type="button"
              onClick={() => removeCTA(cta.id)}
              disabled={ctas.length === 1}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-all hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
              aria-label="Remove CTA"
            >
              <Trash2 className="h-4 w-4" />
            </button> */}
          </div>
        ))}

        {/* Add CTA */}
        <button
          type="button"
          onClick={addCTA}
          disabled={!canAdd}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
            canAdd
              ? "border border-dashed border-stone-300 text-stone-600 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50/50"
              : "border border-dashed border-stone-200 text-stone-400 cursor-not-allowed"
          }`}
        >
          <Plus className="h-4 w-4" />
          {atFreeLimit
            ? `Limit of ${MAX_FREE_CTAS} CTAs reached`
            : "Add CTA"}
        </button>

        {hasErrors && (
          <p className="text-xs text-red-500">
            Fix the highlighted times before saving.
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-100 bg-stone-50/50 rounded-b-2xl">
        <Button
                   disabled={hasErrors || mutateSave.isPending}
                  //  disabled={subtitles.filter((s) => s.file !== null).length == 0 || upsertVideoSubtitleSave.isPending}
                   onClick={handleSubmit}
                   className="tracking-wider h-8 bg-main-btn capitalize px-3 text-xs font-semibold cursor-pointer border rounded-full md:text-sm transition-all duration-200"
                 >
                   Save
                 </Button>
      </div>
    </div>
  );
}

export default CTAShow;