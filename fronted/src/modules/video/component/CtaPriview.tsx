"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowUpRight,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Layers,
  RotateCcw,
  Sparkles,
  Tv,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";

import { useVideoContext, CTA } from "../context/VideoContext";

const POSITION_CLASS_MAP: Record<CTA["position"], string> = {
  top_left: "top-4 left-4 sm:top-6 sm:left-6",
  top_right: "top-4 right-4 sm:top-6 sm:right-6",
  bottom_left: "bottom-14 left-4 sm:bottom-16 sm:left-6",
  bottom_right: "bottom-14 right-4 sm:bottom-16 sm:right-6",
  center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
};

const POSITION_LABELS: Record<CTA["position"], string> = {
  top_left: "Top Left",
  top_right: "Top Right",
  bottom_left: "Bottom Left",
  bottom_right: "Bottom Right",
  center: "Center",
};

function parseTimeToSeconds(raw?: string): number {
  if (!raw) return 0;
  const parts = raw.split(":").map((p) => Number(p.trim()));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 1) return parts[0] || 0;
  if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
  if (parts.length === 3)
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  return 0;
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

function CtaPriview() {
  const {
    videoCtas,
    activeCtaId,
    setActiveCtaId,
    videoAssets,
  } = useVideoContext()!;

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [previewMode, setPreviewMode] = useState<"timed" | "always">("timed");
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Live playback state received from the real embedded video player
  const [playerCurrentTime, setPlayerCurrentTime] = useState<number>(0);
  const [playerDuration, setPlayerDuration] = useState<number>(0);
  const [playerHasStarted, setPlayerHasStarted] = useState<boolean>(false);
  const [playerIsPaused, setPlayerIsPaused] = useState<boolean>(true);

  const activeCta = useMemo(() => {
    if (!videoCtas || videoCtas.length === 0) return null;
    return videoCtas.find((c) => c.id === activeCtaId) || videoCtas[0];
  }, [videoCtas, activeCtaId]);

  // Safely synchronize playback state with same-origin iframe video element
  useEffect(() => {
    let attachedVideo: HTMLVideoElement | null = null;

    const syncVideo = () => {
      try {
        const iframe = iframeRef.current;
        const iframeDoc =
          iframe?.contentDocument || iframe?.contentWindow?.document;
        if (!iframeDoc) return;

        const video = iframeDoc.querySelector("video");
        if (!video) return;

        setPlayerCurrentTime(video.currentTime);
        setPlayerDuration(video.duration || 0);
        setPlayerIsPaused(video.paused);
        if (!video.paused || video.currentTime > 0) {
          setPlayerHasStarted(true);
        }

        if (video !== attachedVideo) {
          attachedVideo = video;
          const onTimeUpdate = () => {
            setPlayerCurrentTime(video.currentTime);
            setPlayerDuration(video.duration || 0);
            setPlayerIsPaused(video.paused);
            if (!video.paused || video.currentTime > 0) {
              setPlayerHasStarted(true);
            }
          };
          const onPlay = () => {
            setPlayerHasStarted(true);
            setPlayerIsPaused(false);
          };
          const onPause = () => {
            setPlayerIsPaused(true);
          };

          video.addEventListener("timeupdate", onTimeUpdate);
          video.addEventListener("play", onPlay);
          video.addEventListener("pause", onPause);
          video.addEventListener("seeked", onTimeUpdate);
        }
      } catch {
        // Safe cross-origin / loading fallback
      }
    };

    const interval = setInterval(syncVideo, 250);
    return () => {
      clearInterval(interval);
    };
  }, [iframeKey]);

  const reloadIframe = useCallback(() => {
    setIframeKey((k) => k + 1);
    setPlayerCurrentTime(0);
    setPlayerHasStarted(false);
    toast.success("Player reloaded");
  }, []);

  // Time calculations for active CTA
  const startSec = useMemo(
    () => parseTimeToSeconds(activeCta?.startTime || "00:00"),
    [activeCta?.startTime],
  );
  const endSec = useMemo(
    () => parseTimeToSeconds(activeCta?.endTime || "00:05"),
    [activeCta?.endTime],
  );

  const isWithinTimeWindow =
    playerCurrentTime >= startSec && playerCurrentTime <= endSec;

  // "it should show between start and end time once the video start start"
  const isCtaVisible =
    showOverlay &&
    (previewMode === "always" || (playerHasStarted && isWithinTimeWindow));

  // Quick jump helper to seek the real iframe player directly to the CTA start time
  const jumpToCtaTime = useCallback(() => {
    try {
      const iframe = iframeRef.current;
      const iframeDoc =
        iframe?.contentDocument || iframe?.contentWindow?.document;
      const video = iframeDoc?.querySelector("video");
      if (video) {
        video.currentTime = startSec;
        setPlayerHasStarted(true);
        setPlayerCurrentTime(startSec);
        setPlayerIsPaused(false);
        void video.play();
        toast.success(`Jumped video to ${activeCta?.startTime || "00:00"}`);
        return;
      }
    } catch {}

    setPlayerHasStarted(true);
    setPlayerCurrentTime(startSec);
    toast.success(`Previewing at ${activeCta?.startTime || "00:00"}`);
  }, [startSec, activeCta?.startTime]);

  const handleCtaClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!activeCta?.url) {
      toast("No redirect URL specified for this CTA", { icon: "ℹ️" });
      return;
    }

    toast.success(
      `Simulated click: ${activeCta.url} (${activeCta.openIn === "new_tab" ? "New Tab" : "Same Tab"})`,
    );

    if (activeCta.openIn === "new_tab") {
      window.open(activeCta.url, "_blank", "noopener,noreferrer");
    } else {
      toast(`In production, this opens ${activeCta.url} in the same tab.`);
    }
  };

  const copyUrl = () => {
    if (!activeCta?.url) return;
    navigator.clipboard.writeText(activeCta.url);
    setCopiedUrl(true);
    toast.success("CTA URL copied to clipboard");
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <aside className="w-full max-w-4xl mx-auto space-y-5 pb-12 font-content">
      {/* Header & Overview Card */}
      <section className="rounded-2xl shadow-sm bg-white overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#f5f5f5] px-5 py-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-black/5 text-foreground">
                <Tv className="size-3.5" />
              </span>
              <h1 className="font-heading text-base sm:text-lg font-semibold tracking-tight text-foreground">
                Real Player CTA Preview
              </h1>
            </div>
            <p className="font-subheading text-xs text-muted-foreground">
              {previewMode === "timed"
                ? "Active mode: CTA displays strictly between start and end time during playback."
                : "Styling mode: CTA is forced visible for live design adjustment."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            {/* Primary toggles: Mode + Overlay */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setPreviewMode((prev) =>
                    prev === "timed" ? "always" : "timed",
                  )
                }
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 shadow-xs text-xs font-subheading font-medium transition-colors cursor-pointer ${
                  previewMode === "timed"
                    ? "bg-black text-white"
                    : "bg-white text-muted-foreground hover:bg-neutral-100"
                }`}
                title="Toggle timed sync vs always visible mode"
              >
                <Clock className="size-3.5" />
                <span>
                  {previewMode === "timed" ? "Mode: Timed" : "Mode: Always on"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowOverlay((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 shadow-xs text-xs font-subheading font-medium text-foreground hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                {showOverlay ? (
                  <>
                    <Eye className="size-3.5 text-emerald-600" />
                    <span>Overlay: On</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="size-3.5 text-muted-foreground/50" />
                    <span>Overlay: Off</span>
                  </>
                )}
              </button>
            </div>

            {/* Secondary utility actions */}
            <div className="flex items-center gap-0.5 pl-1.5 ml-0.5 border-l border-black/10">
              <button
                type="button"
                onClick={reloadIframe}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-subheading font-medium text-muted-foreground hover:bg-neutral-100 hover:text-foreground transition-colors cursor-pointer"
                title="Reload embed player"
              >
                <RotateCcw className="size-3.5" />
                <span>Reload</span>
              </button>

              {videoAssets?.id && (
                <a
                  href={`/embed/${videoAssets.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-subheading font-medium text-muted-foreground hover:bg-neutral-100 hover:text-foreground transition-colors"
                >
                  <span>Open</span>
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* CTA Pills Switcher (if multiple CTAs exist) */}
        {videoCtas && videoCtas.length > 0 && (
          <div className="flex items-center gap-2 px-5 py-3 border-b border-black/[0.04] bg-white overflow-x-auto">
            <span className="font-subheading text-[11px] font-medium text-muted-foreground shrink-0 flex items-center gap-1.5">
              <Layers className="size-3" />
              Select CTA:
            </span>
            <div className="flex items-center gap-1.5">
              {videoCtas.map((cta, idx) => {
                const isSelected = activeCta?.id === cta.id;
                return (
                  <button
                    key={cta.id}
                    type="button"
                    onClick={() => setActiveCtaId(cta.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-subheading transition-all cursor-pointer ${
                      isSelected
                        ? "bg-black text-white font-medium shadow-xs"
                        : "bg-[#f5f5f5] text-muted-foreground hover:bg-neutral-100"
                    }`}
                  >
                    <span>CTA {idx + 1}</span>
                    {cta.text && (
                      <span className="max-w-[100px] truncate text-[11px] opacity-80">
                        ({cta.text})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Video Canvas Container with Embed Video Player */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="aspect-video w-full rounded-2xl overflow-hidden relative shadow-sm bg-black select-none">
            {/* Real Embedded Video Player */}
            {videoAssets?.id ? (
              <iframe
                ref={iframeRef}
                key={iframeKey}
                src={`/embed/${videoAssets.id}`}
                title={`Live CTA Preview of ${videoAssets.title || "Video"}`}
                className="block h-full w-full border-0"
                style={{ border: 0, outline: "none", display: "block" }}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-white/60 text-sm">
                Loading video player...
              </div>
            )}

            {/* Interactive Live CTA Button Overlay - Appears only between start & end time once video starts */}
            <AnimatePresence>
              {isCtaVisible && activeCta && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  <motion.div
                    key={`${activeCta.id}-${activeCta.position}-${activeCta.bgColor}-${activeCta.fontColor}-${activeCta.text}`}
                    initial={{ opacity: 0, scale: 0.85, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: 6 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className={`absolute ${
                      POSITION_CLASS_MAP[activeCta.position] ||
                      POSITION_CLASS_MAP.top_right
                    } pointer-events-auto`}
                  >
                    <a
                      href={activeCta.url || "#"}
                      onClick={handleCtaClick}
                      style={{
                        backgroundColor: activeCta.bgColor || "#7C3AED",
                        color: activeCta.fontColor || "#FFFFFF",
                      }}
                      className="group/cta inline-flex items-center gap-2 rounded-full px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-white/30 hover:ring-white/50 backdrop-blur-xs"
                    >
                      <span className="max-w-[200px] sm:max-w-[280px] truncate">
                        {activeCta.text.trim() || "Click to visit link"}
                      </span>
                      <ArrowUpRight className="size-3.5 sm:size-4 transition-transform group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5" />
                    </a>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Interactive Timeline Sync Tracker & Quick Jump Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs bg-[#f5f5f5] rounded-xl px-4 py-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Playback status dot */}
              {isCtaVisible ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-subheading font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  CTA active now
                </span>
              ) : !playerHasStarted ? (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground font-subheading font-medium bg-white px-2 py-0.5 rounded-full">
                  <span className="size-2 rounded-full bg-neutral-400" />
                  Waiting for play
                </span>
              ) : playerCurrentTime < startSec ? (
                <span className="inline-flex items-center gap-1.5 text-amber-700 font-subheading font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                  <span className="size-2 rounded-full bg-amber-500" />
                  Upcoming at {activeCta?.startTime}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground font-subheading font-medium bg-white px-2 py-0.5 rounded-full">
                  <span className="size-2 rounded-full bg-neutral-400" />
                  Window passed ({activeCta?.endTime})
                </span>
              )}

              {/* Timestamp info */}
              <span className="text-muted-foreground text-xs font-content">
                Video time:{" "}
                <strong className="font-mono text-foreground font-semibold">
                  {formatSeconds(playerCurrentTime)}
                </strong>
                {playerDuration > 0 && ` / ${formatSeconds(playerDuration)}`}
              </span>

              <span className="text-muted-foreground/30 hidden sm:inline">
                •
              </span>

              <span className="text-muted-foreground text-xs">
                Trigger window:{" "}
                <span className="font-mono text-foreground/80 font-medium">
                  {activeCta?.startTime || "00:00"} →{" "}
                  {activeCta?.endTime || "00:05"}
                </span>
              </span>
            </div>

            {/* Jump straight to CTA time button */}
            <button
              type="button"
              onClick={jumpToCtaTime}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-subheading font-medium text-foreground hover:bg-neutral-100 transition-colors shadow-xs cursor-pointer shrink-0"
              title="Seek the real video player directly to CTA start time"
            >
              <Zap className="size-3 text-amber-500" />
              <span>Jump to CTA ({activeCta?.startTime || "00:00"})</span>
            </button>
          </div>
        </div>
      </section>

      {/* CTA Inspector & Quick Info Card */}
      {activeCta && (
        <section className="rounded-2xl shadow-sm bg-white overflow-hidden">
          <div className="bg-[#f5f5f5] px-5 py-3.5">
            <h2 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="size-4 text-foreground/60" />
              Active CTA Inspector
            </h2>
            <p className="font-subheading text-xs text-muted-foreground">
              Live styling and placement properties currently applied.
            </p>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-content">
            {/* Position */}
            <div className="space-y-1">
              <span className="font-subheading text-[11px] font-medium text-muted-foreground">
                Position
              </span>
              <div className="font-medium text-foreground">
                <span className="inline-block rounded-md bg-[#f5f5f5] px-2.5 py-1 text-xs font-subheading font-medium">
                  {POSITION_LABELS[activeCta.position] || "Top Right"}
                </span>
              </div>
            </div>

            {/* Timing Range */}
            <div className="space-y-1">
              <span className="font-subheading text-[11px] font-medium text-muted-foreground">
                Trigger window
              </span>
              <div className="font-mono text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#f5f5f5] px-2.5 py-1 text-foreground">
                  <Clock className="size-3 text-muted-foreground" />
                  {activeCta.startTime || "00:00"} → {activeCta.endTime || "00:05"}
                </span>
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-1">
              <span className="font-subheading text-[11px] font-medium text-muted-foreground">
                Color palette
              </span>
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1.5 rounded-md bg-[#f5f5f5] px-2 py-1"
                  title="Background Color"
                >
                  <span
                    className="size-3 rounded-full border border-black/10"
                    style={{ backgroundColor: activeCta.bgColor }}
                  />
                  <span className="font-mono text-[11px] uppercase">
                    {activeCta.bgColor}
                  </span>
                </div>
                <div
                  className="flex items-center gap-1.5 rounded-md bg-[#f5f5f5] px-2 py-1"
                  title="Font Color"
                >
                  <span
                    className="size-3 rounded-full border border-black/10"
                    style={{ backgroundColor: activeCta.fontColor }}
                  />
                  <span className="font-mono text-[11px] uppercase">
                    {activeCta.fontColor}
                  </span>
                </div>
              </div>
            </div>

            {/* Target URL */}
            <div className="space-y-1">
              <span className="font-subheading text-[11px] font-medium text-muted-foreground">
                Redirect destination
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={copyUrl}
                  disabled={!activeCta.url}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#f5f5f5] hover:bg-neutral-100 px-2.5 py-1 text-foreground font-mono text-[11px] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed truncate max-w-full"
                >
                  <span className="truncate max-w-[120px]">
                    {activeCta.url || "No link set"}
                  </span>
                  {copiedUrl ? (
                    <Check className="size-3 text-emerald-600 shrink-0" />
                  ) : (
                    <Copy className="size-3 text-muted-foreground shrink-0" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </aside>
  );
}

export default CtaPriview;