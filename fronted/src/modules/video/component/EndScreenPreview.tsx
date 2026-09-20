"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { useVideoContext } from "../context/VideoContext";
import { RotateCcw, Sparkles, Tv } from "lucide-react";
import toast from "react-hot-toast";
import EndScreenShowOff from "./EndScreenShowOff";

const END_SCREEN_LABELS: Record<string, string> = {
  cta_action: "Call To Action",
  more_video: "Recommended Videos",
  custom_image: "Custom Image",
  share_button: "Social Share",
  custom_message: "Custom Message",
  empty: "No End Screen",
};

const getThumbnailUrl = (thumb?: string | null) => {
  if (!thumb) return "/video-player.png";
  if (thumb.startsWith("http://") || thumb.startsWith("https://")) return thumb;
  const cdn =
    process.env.NEXT_PUBLIC_CDN_URL ||
    "https://pub-576a14c59513475e922c49a33696cd1f.r2.dev/";
  return `${cdn}${thumb.startsWith("/") ? thumb.slice(1) : thumb}`;
};

function EndScreenPreview() {
  const { videoAssets, endScreen } = useVideoContext()!;
  const [replayKey, setReplayKey] = useState<number>(0);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);

  const resolvedThumbnail = getThumbnailUrl(videoAssets?.thumbnail);

  const handleReplay = () => {
    setIsReplaying(true);
    setReplayKey((prev) => prev + 1);
    toast.success("Replaying end screen", { duration: 1200 });
    setTimeout(() => setIsReplaying(false), 400);
  };

  return (
    <aside className="w-full max-w-4xl mx-auto space-y-5 pb-12 font-sans font-[family-name:var(--font-sans)]">
      {/* ── Top Header Bar ── */}
      <section className="rounded-2xl shadow-sm bg-white overflow-hidden border border-black/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#f5f5f5] px-5 py-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-black/5 text-foreground">
                <Tv className="size-3.5" />
              </span>
              <h1 className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground">
                End Screen Live Preview
              </h1>
            </div>
            <p className="font-sans text-xs text-muted-foreground">
              Simulated video player end-screen showing what viewers see when video playback finishes.
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 shadow-xs text-xs font-sans font-medium text-foreground border border-black/5 self-start sm:self-center">
            <span className="size-2 rounded-full bg-violet-600 animate-pulse" />
            <span>{END_SCREEN_LABELS[endScreen] || "End Screen"}</span>
          </span>
        </div>

        {/* ── Video Player Stage ── */}
        <div className="p-3 sm:p-5 bg-neutral-950/5">
          <div className="relative w-full aspect-video min-h-[440px] sm:min-h-[500px] lg:min-h-[560px] rounded-2xl overflow-hidden bg-black ring-1 ring-white/10 shadow-2xl flex items-center justify-center select-none">
            {/* Frozen Video Frame */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
              {resolvedThumbnail ? (
                <Image
                  src={resolvedThumbnail}
                  alt="Final video frame"
                  fill
                  unoptimized
                  priority
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-neutral-900" />
              )}
            </div>

            {/* Clean, Uniform Darkened Overlay */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-[3px] pointer-events-none" />

            {/* Single Clean, Subtle "Replay" Button in the Top Corner */}
            <button
              type="button"
              onClick={handleReplay}
              className="absolute top-4 right-4 z-20 inline-flex items-center gap-1.5 bg-black/40 hover:bg-black/60 text-white/80 hover:text-white rounded-full px-3 py-1.5 text-xs backdrop-blur-md transition-colors cursor-pointer active:scale-95 border border-white/10"
              title="Replay video end screen"
            >
              <RotateCcw
                className={`size-3.5 ${isReplaying ? "animate-spin" : ""}`}
              />
              <span>Replay</span>
            </button>

            {/* End Screen Content (Directly on overlay, strictly centered vertically) */}
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${replayKey}-${endScreen}`}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="w-full h-full flex flex-col items-center justify-center"
                >
                  <EndScreenShowOff />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Quick Footer Context */}
        <div className="px-5 py-3 border-t border-black/[0.04] bg-white flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-violet-600 shrink-0" />
          <span>
            Changes made in the left configuration panel update this preview in real time.
          </span>
        </div>
      </section>
    </aside>
  );
}

export default EndScreenPreview;