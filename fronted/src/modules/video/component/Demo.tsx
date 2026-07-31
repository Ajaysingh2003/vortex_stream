"use client";

import React, { useState } from "react";
import { Clock, Plus, Trash2 } from "lucide-react";

interface Chapter {
  id: string;
  startTime: string; // normalized "MM:SS" or "HH:MM:SS"
  name: string;
}


interface ChaptersEditorProps {
  videoDurationSeconds?: number; // used to cap/validate start times, if known
  initialChapters?: Chapter[];
  onSave?: (chapters: Chapter[]) => void;
}

// Converts "MM:SS", "HH:MM:SS", or loose digit input into total seconds.
// Returns null if the string can't be parsed as a sane time.
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
  const s = totalSeconds % 60;

  if (h > 0) {
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

let idCounter = 0;
const nextId = () => `chapter-${Date.now()}-${idCounter++}`;

function ChaptersEditor({
  videoDurationSeconds,
  initialChapters,
  onSave,
}: ChaptersEditorProps) {
  const [chapters, setChapters] = useState<Chapter[]>(
    initialChapters?.length
      ? initialChapters
      : [{ id: nextId(), startTime: "00:00", name: "" }]
  );

  // Draft text per row lets the user type freely (e.g. mid-way through "1:2")
  // before it gets validated/normalized on blur, rather than fighting them
  // keystroke by keystroke.
  const [draftTimes, setDraftTimes] = useState<Record<string, string>>(() =>
    Object.fromEntries(chapters.map((c) => [c.id, c.startTime]))
  );
  const [timeErrors, setTimeErrors] = useState<Record<string, string>>({});

  const updateName = (id: string, name: string) => {
    setChapters((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
  };

  const handleTimeChange = (id: string, value: string) => {
    setDraftTimes((prev) => ({ ...prev, [id]: value }));
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

    const normalized = formatSeconds(seconds);
    setChapters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, startTime: normalized } : c))
    );
    setDraftTimes((prev) => ({ ...prev, [id]: normalized }));
    setTimeErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const addChapter = () => {
    const last = chapters[chapters.length - 1];
    const lastSeconds = last ? parseTimeToSeconds(last.startTime) ?? 0 : 0;
    const suggested = formatSeconds(lastSeconds + 10);

    const chapter: Chapter = { id: nextId(), startTime: suggested, name: "" };
    setChapters((prev) => [...prev, chapter]);
    setDraftTimes((prev) => ({ ...prev, [chapter.id]: suggested }));
  };

  const removeChapter = (id: string) => {
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

  const hasErrors = Object.keys(timeErrors).length > 0;

  const handleSave = () => {
    if (hasErrors) return;
    onSave?.(chapters);
  };

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="mb-5 text-lg font-semibold text-neutral-900">Chapters</h2>

      <div className="mb-2 grid grid-cols-[140px_1fr_32px] gap-3 px-0.5 text-xs font-medium text-neutral-500">
        <span>Start Time</span>
        <span>Name</span>
        <span />
      </div>

      <div className="flex flex-col gap-2">
        {chapters.map((chapter) => (
          <div key={chapter.id} className="grid grid-cols-[140px_1fr_32px] items-start gap-3">
            <div>
              <div
                className={`flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2 ${
                  timeErrors[chapter.id]
                    ? "border-rose-400"
                    : "border-neutral-200 focus-within:border-indigo-400"
                }`}
              >
                <input
                  value={draftTimes[chapter.id] ?? ""}
                  onChange={(e) => handleTimeChange(chapter.id, e.target.value)}
                  onBlur={() => commitTime(chapter.id)}
                  placeholder="00:00"
                  className="w-full bg-transparent text-sm text-neutral-800 outline-none"
                  inputMode="numeric"
                />
                <Clock className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
              </div>
              {timeErrors[chapter.id] && (
                <p className="mt-1 text-[11px] text-rose-500">{timeErrors[chapter.id]}</p>
              )}
            </div>

            <input
              value={chapter.name}
              onChange={(e) => updateName(chapter.id, e.target.value)}
              placeholder="Chapter name"
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 outline-none focus:border-indigo-400"
            />

            <button
              type="button"
              onClick={() => removeChapter(chapter.id)}
              disabled={chapters.length === 1}
              aria-label="Remove chapter"
              className="flex h-9 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addChapter}
        className="mt-4 flex items-center gap-1.5 text-sm font-medium text-neutral-600 transition-colors hover:text-indigo-600"
      >
        <Plus className="h-4 w-4" />
        Add Chapter
      </button>

      <button
        type="button"
        onClick={handleSave}
        disabled={hasErrors}
        className="mt-6 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Save Changes
      </button>
    </div>
  );
}

export default ChaptersEditor;