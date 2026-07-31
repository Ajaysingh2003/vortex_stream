"use client";

import { Button } from "@/components/ui/button";
import { VideoAsset, WorkspaceType } from "@/modules/types";
import { useTRPC } from "@/trpc/client";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Clock, Plus, X } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface Chapter {
  id: string;
  startTime: string; // normalized "MM:SS" or "HH:MM:SS"
  name: string;
}

// Generates a fresh id per call — must be a function, not a value computed once.
const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `chapter-${Date.now()}-${Math.random().toString(36).slice(2)}`;

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

const MAX_FREE_CHAPTERS = 5;

function ChaptersShow({ isPremium }: { isPremium: boolean }) {
  const trpc = useTRPC();




  const { data: workspace } = useSuspenseQuery(
    trpc.user.getWorkspace.queryOptions()
  );
  const workspaceData = workspace as WorkspaceType;
  
  const params = useParams();
  const videoId = params.id;
  

  const { data: videoData } = useSuspenseQuery(
    trpc.video.getVideoFromWorkspace.queryOptions({
      videoId: videoId as string,
      workspaceID: workspaceData.id,
    })
  );

  const videoDataType = videoData as VideoAsset;
  const videoDurationSeconds = videoDataType?.duration as number | undefined;

  const { data: chaptersData } = useSuspenseQuery(
    trpc.video.getVideoChapters.queryOptions({videoId:videoDataType.id})
  );



  console.log(chaptersData,"chapter are here")

  const mutateChapter=useMutation(trpc.video.VideoChapter.mutationOptions({
    onSuccess:()=>{
        toast.success("Video Chapter Saved Successfully")
    },
    onError:(err)=>{
        toast.error(err.message ?? "somethng went wrong")
    }
  }))



  const [chapters, setChapters] = useState<Chapter[]>(() => [
    { id: makeId(), startTime: "00:00", name: "" },
  ]);

  const [draftTimes, setDraftTimes] = useState<Record<string, string>>(() => {
    // Will be populated on first render from the initial chapter
    return {};
  });

  const [timeErrors, setTimeErrors] = useState<Record<string, string>>({});

  // Keep draftTimes in sync for any chapter that doesn't have a draft yet
  // (initial chapter + newly added ones)
  React.useEffect(() => {
    setDraftTimes((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const c of chapters) {
        if (!(c.id in next)) {
          next[c.id] = c.startTime;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [chapters]);

  const updateName = (id: string, name: string) => {
    setChapters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name } : c))
    );
  };

  const handleTimeChange = (id: string, value: string) => {
    setDraftTimes((prev) => ({ ...prev, [id]: value }));
    // Clear error while typing so the user isn't stuck with a stale message
    if (timeErrors[id]) {
      setTimeErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const commitTime = (id: string) => {
    const raw = draftTimes[id] ?? "";
    const seconds = parseTimeToSeconds(raw);

    if (seconds === null) {
      setTimeErrors((prev) => ({ ...prev, [id]: "Invalid time format" }));
      return;
    }

    if (videoDurationSeconds != null && seconds > videoDurationSeconds) {
      setTimeErrors((prev) => ({
        ...prev,
        [id]: `Exceeds video length (${formatSeconds(videoDurationSeconds)})`,
      }));
      return;
    }

    // Check against the previous chapter in the current ordered list
    const index = chapters.findIndex((c) => c.id === id);
    const previous = chapters[index - 1];
    if (previous) {
      const prevSeconds = parseTimeToSeconds(previous.startTime) ?? 0;
      if (seconds <= prevSeconds) {
        setTimeErrors((prev) => ({
          ...prev,
          [id]: `Must be after ${previous.startTime}`,
        }));
        return;
      }
    }

    // Also guard against colliding with the next chapter
    const nextChapter = chapters[index + 1];
    if (nextChapter) {
      const nextSeconds = parseTimeToSeconds(nextChapter.startTime) ?? 0;
      if (seconds >= nextSeconds) {
        setTimeErrors((prev) => ({
          ...prev,
          [id]: `Must be before ${nextChapter.startTime}`,
        }));
        return;
      }
    }

    const normalized = formatSeconds(seconds);

    setChapters((prev) => {
      const updated = prev.map((c) =>
        c.id === id ? { ...c, startTime: normalized } : c
      );
      // Keep chronological order
      return [...updated].sort(
        (a, b) =>
          (parseTimeToSeconds(a.startTime) ?? 0) -
          (parseTimeToSeconds(b.startTime) ?? 0)
      );
    });

    setDraftTimes((prev) => ({ ...prev, [id]: normalized }));
    setTimeErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const canAdd =
    (isPremium || chapters.length < MAX_FREE_CHAPTERS) &&
    // Don't allow adding if the last chapter is already at (or past) the end
    (() => {
      if (videoDurationSeconds == null) return true;
      const last = chapters[chapters.length - 1];
      const lastSeconds = last
        ? parseTimeToSeconds(last.startTime) ?? 0
        : 0;
      return lastSeconds < videoDurationSeconds;
    })();

  const addChapter = () => {
    if (!canAdd) return;

    const last = chapters[chapters.length - 1];
    const lastSeconds = last
      ? parseTimeToSeconds(last.startTime) ?? 0
      : 0;

    let suggestedSeconds = lastSeconds + 10;
    if (
      videoDurationSeconds != null &&
      suggestedSeconds > videoDurationSeconds
    ) {
      suggestedSeconds = videoDurationSeconds;
    }

    // Final safety: never suggest a time that isn't strictly after the previous
    if (suggestedSeconds <= lastSeconds) return;

    const suggested = formatSeconds(suggestedSeconds);
    const chapter: Chapter = {
      id: makeId(),
      startTime: suggested,
      name: "",
    };

    setChapters((prev) => [...prev, chapter]);
    setDraftTimes((prev) => ({ ...prev, [chapter.id]: suggested }));
  };

  const removeChapter = (id: string) => {
    if (chapters.length <= 1) return;

    setChapters((prev) => prev.filter((c) => c.id !== id));
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


  const handleSubmit = async () => {
  // ✅ Wrapped object inside map callback with parentheses ()
  await mutateChapter.mutateAsync({
    video_id: videoDataType.id,
    workspaceID: workspaceData.id,
    items: chapters.map((e) => ({
      label: e.name,
      time: e.startTime
    }))
  });
};
  const hasErrors = Object.keys(timeErrors).length > 0;
  const atFreeLimit = !isPremium && chapters.length >= MAX_FREE_CHAPTERS;

  return (
    <div className="w-full rounded-2xl bordezr border-neutral-200 bg-transparent px-3 pt-5 ">
      <div className="flex flex-col border-[1px] border-stone-200 rounded-2xl p-3">
        <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-heading font-semibold text-neutral-900">Chapters</h3>
          <p className="mt-0.5 text-sm text-neutral-500">
            Mark key moments so viewers can jump straight to them.
          </p>
        </div>
        {!isPremium && (
          <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-500">
            {chapters.length}/{MAX_FREE_CHAPTERS} chapters
          </span>
        )}
      </div>

      {chapters.length > 0 && (
        <div className="mb-2 hidden grid-cols-[140px_1fr] gap-3 px-0.5 text-xs font-medium text-neutral-400 md:grid">
          <span>Start Time</span>
          <span>Name</span>
          <span />
        </div>
      )}

      <div className="flex flex-col gap-3">
        {chapters.map((chapter, index) => (
          <div
            key={chapter.id}
            className="grid grid-cols-1 gap-2 rounded-xl border border-neutral-100 bg-neutral-50/60 p-3 md:grid-cols-[140px_1fr] md:items-start md:gap-3 md:border-none md:bg-transparent md:p-0"
          >
            {/* Time */}
            <div>
              <div
                className={`flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2 transition-colors ${
                  timeErrors[chapter.id]
                    ? "border-rose-400"
                    : "border-neutral-200 focus-within:border-indigo-400"
                }`}
              >
                <input
                  value={draftTimes[chapter.id] ?? chapter.startTime}
                  onChange={(e) =>
                    handleTimeChange(chapter.id, e.target.value)
                  }
                  onBlur={() => commitTime(chapter.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    }
                  }}
                  placeholder="00:00"
                  aria-label={`Start time for chapter ${index + 1}`}
                  className="w-full bg-transparent text-sm text-neutral-800 outline-none"
                  inputMode="numeric"
                />
                <Clock className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
              </div>
              {timeErrors[chapter.id] && (
                <p className="mt-1 text-[11px] text-rose-500">
                  {timeErrors[chapter.id]}
                </p>
              )}
            </div>

            {/* Name + remove (mobile) / Name only (desktop) */}
            <div className="relative flex w-full items-center rounded-lg border border-neutral-200 bg-white focus-within:border-stone-400">
              <input
                value={chapter.name}
                onChange={(e) => updateName(chapter.id, e.target.value)}
                placeholder="Chapter name"
                aria-label={`Name for chapter ${index + 1}`}
                className="w-full flex-1 bg-transparent py-2 pl-3 pr-10 text-sm text-neutral-800 outline-none transition-colors"
              />
              {/* Remove button visible on mobile inside the name field */}
              <button
                type="button"
                onClick={() => removeChapter(chapter.id)}
                disabled={chapters.length === 1}
                aria-label="Remove chapter"
                className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-neutral-400 transition-colors hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-neutral-400 mdz:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Remove button – desktop only */}
            {/* <button
              type="button"
              onClick={() => removeChapter(chapter.id)}
              disabled={chapters.length === 1}
              aria-label="Remove chapter"
              className="hidden h-9 w-9 shrink-0 items-center justify-center justify-self-end rounded-lg text-neutral-400 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent md:flex"
            >
              <X className="h-4 w-4" />
            </button> */}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addChapter}
        disabled={!canAdd}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-500 transition-all duration-200 hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-neutral-300 disabled:hover:bg-transparent disabled:hover:text-neutral-500"
      >
        <Plus className="h-4 w-4 stroke-[2]" />
        {atFreeLimit
          ? `Limit of ${MAX_FREE_CHAPTERS} chapters reached`
          : "Add Chapter"}
      </button>

      {hasErrors && (
        <p className="mt-3 text-xs text-rose-500">
          Fix the highlighted times before saving.
        </p>
      )}
      </div>

        <div className="border-t-[1px]z  py-2 px-2 mt-2 border-black/5">
          <div className="flex justify-end flex-row gap-2 w-full">
            <Button
            disabled={hasErrors || mutateChapter.isPending}
              // disabled={subtitles.filter((s) => s.file !== null).length == 0 || upsertVideoSubtitleSave.isPending}
              onClick={handleSubmit}
              className="tracking-wider h-8 bg-main-btn capitalize px-3 text-xs font-semibold cursor-pointer border rounded-full md:text-sm transition-all duration-200"
            >
              Save
            </Button>
          </div>
        </div>
    </div>
  );
}

export default ChaptersShow;