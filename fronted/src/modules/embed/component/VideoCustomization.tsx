"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  MediaCaptionsButton,
  MediaControlBar,
  MediaController,
  MediaFullscreenButton,
  MediaLoadingIndicator,
  MediaMuteButton,
  MediaPipButton,
  MediaPlayButton,
  MediaPlaybackRateButton,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaTimeDisplay,
  MediaTimeRange,
  MediaVolumeRange,
} from "media-chrome/react";
import Hls from "hls.js";
import {
  Download,
  ListVideo,
  Pause,
  Play,
  RotateCcw,
  Settings,
  X,
} from "lucide-react";

import VolumeControls from "./VolumeControls";

export type generalType = {
  ctaEnabled: boolean;
  autoplay: boolean;
  preload: boolean;
  loop: boolean;
  captions: boolean;
};

export type controlsType = {
  downloadButton: boolean;
  disableSeekbar: boolean;
  showControls: boolean;
  skipForward: boolean;
  skipBackward: boolean;
  fullScreen: boolean;
  volume: boolean;
  playbackRate: boolean;
  pipButton: boolean;
  muteButton: boolean;
};

export type brandingType = {
  logoUrl: string;
  logoPosition: string;
  logoWidth: number;
  primaryColor: string;
  accentColor: string;
  iconColor: string;
  backgroundColor: string;
};

export type securityType = {
  watermarkEnabled: boolean;
  watermarkTextType: "viewer_email" | "viewer_ip" | "none";
  watermarkImage: string;
};

export type ctaType = {
  ctaEnabled: boolean;
  timeTrigger: number;
  heading: string;
  buttonText: string;
  redirectUrl: string;
};

export type VideoPlayerSettings = {
  general: generalType;
  controls: controlsType;
  branding: brandingType;
  security: securityType;
  cta?: ctaType;
};

export interface VideoAsset {
  id: string;
  title: string;
  videoKey: string;
  size: number;
  duration: number;
  isPrivate: boolean;
  status: string;
  thumbnail: string;
  masterKey: string;
  resolutions: string[] | any[];
  folderId: string | null;
  WorkspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoPlayerMetaData {
  id: string;
  workspaceId: string;
  general_settings: generalType;
  control_settings: controlsType;
  branding_settings: brandingType;
  security_settings: securityType;
  advanced_settings: {
    cta?: ctaType;
    captions?: CaptionTrack[];
    viewerEmail?: string;
    viewerIp?: string;
    signedDownloadUrl?: string;
  } | null;
}

type CaptionTrack = {
  src: string;
  label: string;
  srcLang: string;
  default?: boolean;
};

type PlayerSource = {
  label: string;
  src: string;
  type?: "video/mp4" | "application/x-mpegURL";
};

type ProductionVideoPlayerProps = {
  asset: VideoAsset;
  player: VideoPlayerMetaData;
  cdnBaseUrl: string;
  className?: string;
  onProgress?: (payload: { videoId: string; currentTime: number }) => void;
  onEnded?: (payload: { videoId: string }) => void;
};

const DEFAULT_BRAND: brandingType = {
  logoUrl: "",
  logoPosition: "top-right",
  logoWidth: 80,
  primaryColor: "#ffffff",
  accentColor: "#00adef",
  iconColor: "#ffffff",
  backgroundColor: "#050608",
};

const chromeButtonClass =
  "grid h-9 w-9 shrink-0 place-items-center rounded-md text-[color:var(--vp-icon)] transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--vp-accent)]";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function joinCdnUrl(baseUrl: string, key: string) {
  if (!key) return "";
  if (/^https?:\/\//i.test(key)) return key;
  return `${baseUrl.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
}

function parseSourceType(src: string): PlayerSource["type"] {
  return src.includes(".m3u8") ? "application/x-mpegURL" : "video/mp4";
}

function buildSources(asset: VideoAsset, cdnBaseUrl: string): PlayerSource[] {
  const masterSrc = joinCdnUrl(cdnBaseUrl, asset.masterKey || asset.videoKey);
  const sources: PlayerSource[] = masterSrc
    ? [
        {
          label: asset.masterKey?.includes(".m3u8") ? "Auto" : "Original",
          src: masterSrc,
          type: parseSourceType(masterSrc),
        },
      ]
    : [];

  for (const item of asset.resolutions || []) {
    if (typeof item === "string") {
      const src = joinCdnUrl(cdnBaseUrl, item);
      sources.push({
        label: item.match(/(\d{3,4}p)/)?.[1] || "MP4",
        src,
        type: parseSourceType(src),
      });
      continue;
    }

    if (item?.url || item?.key) {
      const src = joinCdnUrl(cdnBaseUrl, item.url || item.key);
      sources.push({
        label: item.label || item.quality || item.resolution || "MP4",
        src,
        type: parseSourceType(src),
      });
    }
  }

  const source = Array.from(
    new Map(
      sources
        .filter((source) => source.src)
        .map((source) => [source.src, source]),
    ).values(),
  );

  console.log(source, "789456123");
  return source;
}

function useHlsSource(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  source?: PlayerSource,
) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !source?.src) return;

    if (source.type !== "application/x-mpegURL") {
      video.src = source.src;
      return;
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source.src;
      return;
    }

    if (!Hls.isSupported()) return;

    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90,
    });

    hls.loadSource(source.src);
    hls.attachMedia(video);

    return () => hls.destroy();
  }, [source, videoRef]);
}

function OverlayButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={chromeButtonClass}
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function LogoOverlay({ branding }: { branding: brandingType }) {
  if (!branding.logoUrl) return null;

  const positionClass: Record<string, string> = {
    "top-left": "left-4 top-4",
    "top-right": "right-4 top-4",
    "bottom-left": "bottom-[74px] left-4",
    "bottom-right": "bottom-[74px] right-4",
  };

  return (
    <img
      className={cx(
        "pointer-events-none absolute z-20 h-auto max-w-[22%] drop-shadow-[0_5px_12px_rgba(0,0,0,0.35)]",
        positionClass[branding.logoPosition] || positionClass["top-right"],
      )}
      src={branding.logoUrl}
      alt=""
      style={{ width: Math.max(32, branding.logoWidth || 80) }}
    />
  );
}

function Watermark({
  security,
  viewerEmail,
  viewerIp,
}: {
  security: securityType;
  viewerEmail?: string;
  viewerIp?: string;
}) {
  if (!security.watermarkEnabled) return null;

  const text =
    security.watermarkTextType === "viewer_email"
      ? viewerEmail
      : security.watermarkTextType === "viewer_ip"
        ? viewerIp
        : "";

  if (security.watermarkImage) {
    return (
      <img
        className="pointer-events-none absolute left-[10%] top-[18%] z-20 h-auto w-[min(160px,22%)] select-none opacity-40"
        src={security.watermarkImage}
        alt=""
      />
    );
  }

  if (!text) return null;

  return (
    <span className="pointer-events-none absolute left-[10%] top-[18%] z-20 select-none rounded border border-white/15 bg-black/25 px-2 py-1 font-mono text-xs leading-none text-white/65 opacity-45">
      {text}
    </span>
  );
}

function CtaOverlay({
  cta,
  accentColor,
  onClose,
}: {
  cta: ctaType;
  accentColor: string;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-40 grid place-items-center bg-black/75 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={cta.heading}
    >
      <button
        className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        type="button"
        aria-label="Close CTA"
        onClick={onClose}
      >
        <X size={18} />
      </button>

      <div className="w-full max-w-[420px] rounded-lg border border-white/15 bg-[#0a0c10]/95 p-7 text-center shadow-2xl shadow-black/40">
        <p className="mb-5 text-balance text-xl font-bold leading-tight text-white sm:text-2xl">
          {cta.heading}
        </p>
        <a
          className="inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-bold text-[#061015] no-underline transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          href={cta.redirectUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ backgroundColor: accentColor }}
        >
          {cta.buttonText || "Learn more"}
        </a>
      </div>
    </div>
  );
}

export default function ProductionVideoPlayer({
  asset,
  player,
  cdnBaseUrl,
  className,
  onProgress,
  onEnded,
}: ProductionVideoPlayerProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ctaShownRef = useRef(false);
  const progressTickRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);

  const general = player.general_settings;
  const controls = player.control_settings;
  const branding = { ...DEFAULT_BRAND, ...player.branding_settings };
  const security = player.security_settings;
  const advanced: NonNullable<VideoPlayerMetaData["advanced_settings"]> =
    player.advanced_settings || {};
  const cta = advanced.cta;

  const sources = useMemo(
    () => buildSources(asset, cdnBaseUrl),
    [asset, cdnBaseUrl],
  );
  const selectedSource = sources[selectedSourceIndex] || sources[0];

  console.log(selectedSource, "ocean");
  const poster = asset.thumbnail
    ? joinCdnUrl(cdnBaseUrl, asset.thumbnail)
    : undefined;

  useHlsSource(videoRef, selectedSource);

  const cssVars = {
    "--vp-primary": branding.primaryColor,
    "--vp-accent": branding.accentColor,
    "--vp-icon": branding.iconColor,
    "--vp-bg": branding.backgroundColor,
    "--media-primary-color": branding.primaryColor,
    "--media-accent-color": branding.accentColor,
    "--media-icon-color": branding.iconColor,
    "--media-control-background":
      "linear-gradient(180deg, transparent, rgba(0,0,0,.78))",
    "--media-range-bar-color": branding.accentColor,
    "--media-range-thumb-background": branding.accentColor,
    "--media-font-family": "Inter, ui-sans-serif, system-ui, sans-serif",
  } as React.CSSProperties;

  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      setHasStarted(true);
      await video.play();
      return;
    }

    video.pause();
  }, []);

  const replay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play();
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (
      general.ctaEnabled &&
      cta?.ctaEnabled &&
      !ctaShownRef.current &&
      video.currentTime >= Math.max(0, cta.timeTrigger || 0)
    ) {
      ctaShownRef.current = true;
      video.pause();
      setShowCta(true);
    }

    if (onProgress && video.currentTime - progressTickRef.current >= 5) {
      progressTickRef.current = video.currentTime;
      onProgress({ videoId: asset.id, currentTime: video.currentTime });
    }
  }, [asset.id, cta, general.ctaEnabled, onProgress]);

  const handleQualityChange = useCallback((index: number) => {
    const video = videoRef.current;
    const wasPlaying = video ? !video.paused : false;
    const currentTime = video?.currentTime || 0;

    setSelectedSourceIndex(index);
    setSettingsOpen(false);

    requestAnimationFrame(() => {
      const nextVideo = videoRef.current;
      if (!nextVideo) return;
      nextVideo.currentTime = currentTime;
      if (wasPlaying) void nextVideo.play();
    });
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.({ videoId: asset.id });
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
    };
  }, [asset.id, onEnded]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      const tagName = document.activeElement?.tagName.toLowerCase();
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select"
      ) {
        return;
      }

      if (event.key === " ") {
        event.preventDefault();
        void togglePlay();
      }

      if (!controls.disableSeekbar && event.key === "ArrowRight") {
        video.currentTime += 10;
      }

      if (!controls.disableSeekbar && event.key === "ArrowLeft") {
        video.currentTime -= 10;
      }

      if (event.key.toLowerCase() === "m") {
        video.muted = !video.muted;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [controls.disableSeekbar, togglePlay]);

  return (
    <div className={cx("w-full overflow-hidden ", className)} style={cssVars}>
      <MediaController
        style={{ ["--media-background-color" as any]: "transparent" }}
        className="relative z-0 aspect-video w-full abg-[color:var(--vp-bg)] font-sans"
      >
        <button
          type="button"
          className="absolute inset-0 z-10 cursor-pointer bg-transparent"
          aria-label={isPlaying ? "Pause video" : "Play video"}
          onClick={togglePlay}
        />
        <video
          ref={videoRef}
          // src={""}
          slot="media"
          className="h-full w-full cursor-pointer object-contain"
          poster={
            "https://pub-db02f4666efb4ae9b337950ff0610772.r2.dev/blogimages/4372937.webp"
          }
          playsInline
          muted={general.autoplay}
          autoPlay={general.autoplay}
          loop={general.loop}
          preload={general.preload ? "auto" : "metadata"}
          crossOrigin="anonymous"
          controlsList={
            asset.isPrivate ? "nodownload noplaybackrate" : undefined
          }
          disablePictureInPicture={!controls.pipButton}
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
        >
          {selectedSource?.type !== "application/x-mpegURL" &&
          selectedSource?.src ? (
            <source src={selectedSource.src} type={selectedSource.type} />
          ) : null}

          {general.captions &&
            advanced.captions?.map((track) => (
              <track
                key={`${track.srcLang}-${track.src}`}
                kind="subtitles"
                src={track.src}
                srcLang={track.srcLang}
                label={track.label}
                default={track.default}
              />
            ))}
        </video>

        <MediaLoadingIndicator
          slot="centered-chrome"
          className="scale-125 text-[color:var(--vp-accent)]"
        />
       { !isPlaying && <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-transparent">
          <button
            style={{ background: branding.primaryColor }}
            className={cx(
              "pointer-events-auto grid size-12 sm:size-14 md:size-18 place-items-center rounded-full border-0 bg-[color:var(--vp-accent)] text-white shadow-[0_18px_45px_rgba(0,0,0,0.35)] transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white amax-sm:h-[58px] amax-sm:w-[58px]",
              isPlaying && "pointer-events-none opacity-0",
            )}
            slot="centered-chrome"
            type="button"
            aria-label={isPlaying ? "Pause" : "Play"}
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="size-6 md:size-10" fill="currentColor" />
            ) : (
              <Play fill="currentColor" className="size-6 md:size-10" />
            )}
          </button>
        </div>}

        <LogoOverlay branding={branding} />

        <Watermark
          security={security}
          viewerEmail={advanced.viewerEmail}
          viewerIp={advanced.viewerIp}
        />

        {showCta && cta ? (
          <CtaOverlay
            cta={cta}
            accentColor={branding.accentColor}
            onClose={() => {
              setShowCta(false);
              void videoRef.current?.play();
            }}
          />
        ) : null}

        <section className="absolute bottom-0 left-0 right-0 z-30  w-full px-3 pb-3">
          <div
            style={{
              background: branding.backgroundColor,
            }}
            className="flex w-full items-center justify-center px-2 h-8 rounded-lg relative overflow-visible"
          >
            <MediaControlBar
              style={{
                ["--media-control-bar-background" as any]: "transparent",
                ["--media-control-hover-background" as any]: "transparent",
                boxShadow: "none",
                background: "transparent",
                // 🚀 Locks execution strictly flat against the container canvas bounds
                margin: 0,
                bottom: 0,
              }}
              className="w-full relative bg-transparent border-none outline-none flex items-center h-11"
            >
              <MediaPlayButton
                className="size-4 lg:size-5"
                style={{ background: "transparent" }}
              />

              {controls.skipBackward && (
                <MediaSeekBackwardButton
                  className="size-4 lg:size-5"
                  style={{ background: "transparent" }}
                  seekOffset={10}
                />
              )}
              {controls.skipForward && (
                <MediaSeekForwardButton
                  className="size-4 lg:size-5"
                  seekOffset={10}
                  style={{ background: "transparent" }}
                />
              )}

              {controls.volume && (
                <VolumeControls
                  // className="size-4 lg:size-5"
                  videoRef={videoRef}
                  iconColor={branding.iconColor}
                />
              )}

              <MediaTimeDisplay
                className="size-4 lg:size-5"
                remaining={false}
                show-duration={false}
                style={{ background: "transparent", color: branding.iconColor }}
              />

              <MediaTimeRange
                className="size-4 lg:size-5"
                style={{ background: "transparent" }}
              />

              {general.captions && (
                <MediaCaptionsButton
                  className="size-4 lg:size-5"
                  style={{ background: "transparent" }}
                />
              )}

              {controls.playbackRate && (
                <MediaPlaybackRateButton
                  className="size-4 lg:size-5"
                  style={{ background: "transparent" }}
                />
              )}

              {controls.pipButton && (
                <MediaPipButton
                  className="size-4 lg:size-5"
                  style={{ background: "transparent" }}
                />
              )}

              {controls.fullScreen && (
                <MediaFullscreenButton
                  className="size-4 lg:size-5"
                  style={{ background: "transparent" }}
                />
              )}
            </MediaControlBar>
          </div>
        </section>
      </MediaController>
    </div>
  );
}
