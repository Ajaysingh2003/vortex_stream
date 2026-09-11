"use client";

import React, { useEffect, useState } from "react";
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
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  Link2,
  Plus,
  Sparkles,
  Trash2,
  Type,
} from "lucide-react";
import toast from "react-hot-toast";
import Sketch from "@uiw/react-color-sketch";

import {
  useVideoContext,
  CTA,
  DEFAULT_CTA_FONT_COLOR,
  DEFAULT_CTA_BG_COLOR,
} from "../context/VideoContext";

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `cta-${Date.now()}-${Math.random().toString(36).slice(2)}`;

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
      <Label className="text-[11px] font-subheading font-medium text-neutral-500 uppercase tracking-wider">
        {label}
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-9 w-full items-center justify-between rounded-lg bg-[#f5f5f5] px-3 py-1.5 shadow-xs transition-colors hover:bg-neutral-200/80 focus:outline-hidden cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span
                className="size-4 rounded-full border border-black/10 shadow-xs"
                style={{ backgroundColor: color }}
              />
              <span className="font-mono text-xs text-neutral-700 uppercase">
                {color}
              </span>
            </div>
            <span className="text-[10px] font-subheading font-medium text-neutral-400">
              Pick
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 border border-neutral-200 shadow-xl rounded-2xl overflow-hidden"
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
  const queryClient = useQueryClient();
  const {
    videoCtas,
    setVideoCtas,
    activeCtaId,
    setActiveCtaId,
    videoAssets,
    workspaceData,
    ctaDataArray,
  } = useVideoContext()!;

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const videoDurationSeconds = videoAssets?.duration as number | undefined;

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
      for (const c of videoCtas) {
        if (!(c.id in next)) {
          next[c.id] = { start: c.startTime, end: c.endTime };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [videoCtas]);

  const updateField = <K extends keyof CTA>(
    id: string,
    field: K,
    value: CTA[K],
  ) => {
    setVideoCtas((prev) =>
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

    const cta = videoCtas.find((c) => c.id === id);
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
    setVideoCtas((prev) =>
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

  const canAdd = isPremium || videoCtas.length < MAX_FREE_CTAS;

  const addCTA = () => {
    if (!canAdd) return;
    const last = videoCtas[videoCtas.length - 1];
    const lastEnd = last ? (parseTimeToSeconds(last.endTime) ?? 0) : 0;
    let start = lastEnd + 1;
    let end = start + 5;
    if (videoDurationSeconds != null) {
      if (start > videoDurationSeconds)
        start = Math.max(0, videoDurationSeconds - 5);
      if (end > videoDurationSeconds) end = videoDurationSeconds;
    }
    if (end <= start) end = start + 1;

    const newCta: CTA = {
      id: makeId(),
      text: "",
      url: "",
      startTime: formatSeconds(start),
      endTime: formatSeconds(end),
      fontColor: DEFAULT_CTA_FONT_COLOR,
      bgColor: DEFAULT_CTA_BG_COLOR,
      openIn: "new_tab",
      position: "top_right",
    };

    setVideoCtas((prev) => [...prev, newCta]);
    setActiveCtaId(newCta.id);
    setDraftTimes((prev) => ({
      ...prev,
      [newCta.id]: { start: newCta.startTime, end: newCta.endTime },
    }));
  };

  const mutateDelete = useMutation(
    trpc.video.deleteVideoCta.mutationOptions({
      onSuccess: async () => {
        toast.success("CTA deleted successfully");
        await queryClient.invalidateQueries(
          trpc.video.getVideoCtas.queryOptions({ videoId: videoAssets.id }),
        );
      },
      onError: (err) => {
        toast.error(err.message ?? "Failed to delete CTA");
      },
    }),
  );

  const handleDeleteCTA = async (id: string) => {
    const existsInDb =
      ctaDataArray?.some((c) => c.id === id) ||
      (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) &&
        !id.startsWith("cta-"));

    if (existsInDb) {
      try {
        setDeletingId(id);
        await mutateDelete.mutateAsync({
          workspaceId: workspaceData.id,
          id,
        });
      } catch {
        setDeletingId(null);
        return;
      }
      setDeletingId(null);
    } else {
      toast.success("CTA removed");
    }

    setVideoCtas((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (activeCtaId === id) {
        setActiveCtaId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });

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
      onSuccess: async () => {
        toast.success("CTAs saved successfully");
        await queryClient.invalidateQueries(
          trpc.video.getVideoCtas.queryOptions({ videoId: videoAssets.id }),
        );
      },
      onError: (err) => toast.error(err.message ?? "Something went wrong"),
    }),
  );

  const handleSubmit = async () => {
    await mutateSave.mutateAsync({
      video_id: videoAssets.id,
      workspaceID: workspaceData.id,
      items: videoCtas.map((c) => ({
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
  const atFreeLimit = !isPremium && videoCtas.length >= MAX_FREE_CTAS;

  return (
    <div className="w-full space-y-4 font-content">
      {/* Main Container Card */}
      <section className="rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] bg-white overflow-hidden">
        {/* Accent Header */}
        <div className="flex items-center justify-between gap-3 bg-[#f5f5f5] px-4 py-3.5">
          <div className="space-y-0.5">
            <h2 className="font-heading text-sm sm:text-base font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="size-4 text-foreground/70" />
              Call to Actions
            </h2>
            <p className="font-subheading text-xs text-muted-foreground">
              Trigger interactive overlay buttons at chosen moments.
            </p>
          </div>
          {!isPremium && (
            <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-subheading font-medium text-neutral-600 shadow-xs">
              {videoCtas.length}/{MAX_FREE_CTAS} Free
            </span>
          )}
        </div>

        {/* CTA Stack */}
        <div className="p-3.5 sm:p-4 space-y-3.5">
          {videoCtas.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-[#fbfbfb] rounded-xl border border-dashed border-black/10 space-y-3">
              <div className="size-10 rounded-full bg-black/5 flex items-center justify-center text-neutral-500">
                <Sparkles className="size-4 text-neutral-600" />
              </div>
              <div className="space-y-1">
                <p className="font-heading text-sm font-semibold text-foreground">
                  No Call to Actions
                </p>
                <p className="font-subheading text-xs text-muted-foreground max-w-[220px]">
                  Add interactive button overlays to guide viewers to custom links or actions.
                </p>
              </div>
              <Button
                type="button"
                onClick={addCTA}
                className="mt-1 h-8 px-4 rounded-lg bg-black text-white text-xs font-medium hover:bg-neutral-800 transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="size-3.5" />
                Add Call to Action
              </Button>
            </div>
          ) : (
            videoCtas.map((cta, index) => {
              const isSelected = activeCtaId === cta.id;

              return (
                <div
                  key={cta.id}
                  onClick={() => setActiveCtaId(cta.id)}
                  className={`relative rounded-xl p-3 sm:p-4 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-[#fbfbfb] shadow-xs ring-1 ring-black/15"
                      : "bg-[#f5f5f5]/60 hover:bg-[#f5f5f5]"
                  }`}
                >
                  {/* Card Meta Bar */}
                  <div className="mb-3 flex items-center justify-between pb-2 border-b border-black/[0.04]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex size-5 items-center justify-center rounded-md text-[11px] font-semibold transition-colors ${
                          isSelected
                            ? "bg-black text-white"
                            : "bg-black/5 text-neutral-600"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="font-heading text-xs font-medium text-foreground">
                        {cta.text.trim() || `CTA #${index + 1}`}
                      </span>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-subheading font-medium text-emerald-700">
                          <CheckCircle2 className="size-2.5" />
                          Previewing
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={deletingId === cta.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCTA(cta.id);
                      }}
                      className="inline-flex size-6 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-rose-50 hover:text-rose-600 cursor-pointer disabled:opacity-50"
                      aria-label="Delete CTA"
                      title="Delete this CTA"
                    >
                      {deletingId === cta.id ? (
                        <span className="size-3 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </button>
                  </div>

                  <div
                    className="space-y-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Button Text & Destination URL */}
                    <div className="space-y-2.5">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-subheading font-medium text-neutral-500 uppercase tracking-wider">
                          Button Label
                        </Label>
                        <div className="relative">
                          <Type className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
                          <Input
                            value={cta.text}
                            onChange={(e) =>
                              updateField(cta.id, "text", e.target.value)
                            }
                            placeholder="e.g. Visit our website"
                            className="h-8.5 rounded-lg bg-white pl-8 text-xs shadow-xs focus-visible:ring-1 focus-visible:ring-black/20"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-subheading font-medium text-neutral-500 uppercase tracking-wider">
                          Destination URL
                        </Label>
                        <div className="relative">
                          <Link2 className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
                          <Input
                            value={cta.url}
                            onChange={(e) =>
                              updateField(cta.id, "url", e.target.value)
                            }
                            placeholder="https://example.com"
                            className="h-8.5 rounded-lg bg-white pl-8 text-xs shadow-xs focus-visible:ring-1 focus-visible:ring-black/20"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Timing Trigger Windows */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-subheading font-medium text-neutral-500 uppercase tracking-wider">
                          Start Time
                        </Label>
                        <div className="relative">
                          <Clock className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
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
                            className={`h-8.5 rounded-lg bg-white pl-8 font-mono text-xs shadow-xs focus-visible:ring-1 focus-visible:ring-black/20 ${
                              timeErrors[cta.id]?.start
                                ? "border-rose-400 focus-visible:ring-rose-400"
                                : ""
                            }`}
                          />
                        </div>
                        {timeErrors[cta.id]?.start && (
                          <p className="text-[10px] text-rose-500 font-subheading">
                            {timeErrors[cta.id].start}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-subheading font-medium text-neutral-500 uppercase tracking-wider">
                          End Time
                        </Label>
                        <div className="relative">
                          <Clock className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
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
                            className={`h-8.5 rounded-lg bg-white pl-8 font-mono text-xs shadow-xs focus-visible:ring-1 focus-visible:ring-black/20 ${
                              timeErrors[cta.id]?.end
                                ? "border-rose-400 focus-visible:ring-rose-400"
                                : ""
                            }`}
                          />
                        </div>
                        {timeErrors[cta.id]?.end && (
                          <p className="text-[10px] text-rose-500 font-subheading">
                            {timeErrors[cta.id].end}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Colors */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <ColorPicker
                        label="Background"
                        color={cta.bgColor}
                        onChange={(hex) => updateField(cta.id, "bgColor", hex)}
                      />
                      <ColorPicker
                        label="Text Color"
                        color={cta.fontColor}
                        onChange={(hex) => updateField(cta.id, "fontColor", hex)}
                      />
                    </div>

                    {/* Placement & Behavior */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-subheading font-medium text-neutral-500 uppercase tracking-wider">
                          Position
                        </Label>
                        <Select
                          value={cta.position}
                          onValueChange={(val) =>
                            updateField(
                              cta.id,
                              "position",
                              val as CTA["position"],
                            )
                          }
                        >
                          <SelectTrigger className="h-8.5 w-full rounded-lg bg-white text-xs shadow-xs">
                            <SelectValue placeholder="Position" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl shadow-lg border-neutral-200">
                            {POSITION_OPTIONS.map((opt) => (
                              <SelectItem
                                className="text-xs font-content"
                                key={opt.value}
                                value={opt.value}
                              >
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-subheading font-medium text-neutral-500 uppercase tracking-wider">
                          Open In
                        </Label>
                        <Select
                          value={cta.openIn}
                          onValueChange={(val) =>
                            updateField(cta.id, "openIn", val as CTA["openIn"])
                          }
                        >
                          <SelectTrigger className="h-8.5 w-full rounded-lg bg-white text-xs shadow-xs">
                            <SelectValue placeholder="Target" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl shadow-lg border-neutral-200">
                            {OPEN_IN_OPTIONS.map((opt) => (
                              <SelectItem
                                className="text-xs font-content"
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
              );
            })
          )}
        </div>

        {/* Add CTA Button */}
        {videoCtas.length > 0 && (
          <div className="px-3.5 sm:px-4 pb-3.5">
            <button
              type="button"
              onClick={addCTA}
              disabled={!canAdd}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f5f5f5] hover:bg-neutral-200/80 px-4 py-2 text-xs font-subheading font-medium text-foreground transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Plus className="size-3.5" />
              {atFreeLimit
                ? `Limit of ${MAX_FREE_CTAS} CTAs reached`
                : "Add Call to Action"}
            </button>

            {hasErrors && (
              <p className="mt-2 text-center text-xs text-rose-500 font-subheading">
                Fix highlighted time errors before saving.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Action Footer with Save Button */}
      {videoCtas.length > 0 && (
        <div className="flex justify-end px-1">
          <Button
            disabled={hasErrors || mutateSave.isPending}
            onClick={handleSubmit}
            className="h-9 rounded-full bg-main-btn px-6 text-xs font-subheading font-semibold tracking-wider text-white capitalize transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-sm hover:opacity-90"
          >
            {mutateSave.isPending ? "Saving..." : "Save CTAs"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default CTAShow;