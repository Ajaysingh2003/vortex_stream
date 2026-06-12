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
import { Pause, Play } from "lucide-react";

import { motion } from "motion/react";
import VolumeControls from "./VolumeControls";
import {
  brandingType,
  ProductionVideoPlayerProps,
  VideoPlayerMetaData,
  VideoResolutionType,
} from "@/modules/types";
import {
  buildSources,
  CtaOverlay,
  joinCdnUrl,
  LogoOverlay,
  useHlsSource,
  Watermark,
} from "./temp";
import Image from "next/image";
import BrandLogo from "./BrandLogo";
import VideoSettings from "./VideoSettings";

const DEFAULT_BRAND: brandingType = {
  logoUrl: "",
  logoPosition: "top-right",
  logoWidth: 80,
  primaryColor: "#ffffff",
  accentColor: "#00adef",
  iconColor: "#ffffff",
  backgroundColor: "#050608",
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
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
  const [currentResolution, setCurrentResolution] =
    useState<VideoResolutionType | null>(null);
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
  const [currentVolume, setCurrentVolume] = useState<number>(0);
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

  const handleQualityChange = useCallback(
    (resolutions: VideoResolutionType | null) => {
      const video = videoRef.current;

      if (!video) return;

      const wasPlaying = !video.paused;
      const currentTime = video.currentTime;
      console.log(currentTime,200) 
      const currentQualityUrl= resolutions?.playlist_path !=null ? cdnBaseUrl+resolutions.playlist_path : null
      const masterUrl=cdnBaseUrl + asset.masterKey

      setSettingsOpen(false);
      setCurrentResolution(resolutions);

      const nextQualityVersion=currentQualityUrl || masterUrl
      
      video.src=nextQualityVersion
      
      video.addEventListener("loadedmetadata",async()=>{
        video.currentTime=currentTime

        if (wasPlaying) {
          await video.play()
        }
      },{once:true})

    },
    [],
  );

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

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setCurrentVolume((e) => speed);
    }
  };

  return (
    <div
      className={cx(
        "flex h-full min-h-0 w-full flex-col items-center overflow-hidden relative",
        className,
      )}
      style={cssVars}
    >
      {/* <div className="bg-red-200 absolute">
      a
      </div> */}

      {/* <div className="bg-black absolute w-full h-full z-0 "/> */}

      <MediaController
        style={{
          ["--media-background-color" as any]: "transparent",
          width: "100%",
          height: "100%",
          display: "block",
          flexDirection: "column",
        }}
        className="relative z-0 h-full w-full font-sans"
      >
        <button
          type="button"
          className="absolute inset-0 z-10 cursor-pointer bg-transparent"
          aria-label={isPlaying ? "Pause video" : "Play video"}
          onClick={togglePlay}
        />

        {/* {!hasStarted && poster && (
          <Image
            height={100}
            width={100}
            unoptimized
            src={
              "https://pub-db02f4666efb4ae9b337950ff0610772.r2.dev/blogimages/IMG_20240527_091317-1200x630.jpg"
            }
            alt="Video Thumbnail Placeholder"
            className="absolute inset-0 z-20 w-full h-full cursor-pointer poster-img object-contain lg:object-covezr bg-black"
            onClick={togglePlay}
          />
        )} */}

        <video
          ref={videoRef}
          slot="media"
          className="h-full w-full cursor-pointer  video-ref-embed object-contain bg-black"
          playsInline
          muted={general.autoplay}
          autoPlay={general.autoplay}
          loop={general.loop}
          preload={general.autoplay ? "auto" : "none"}
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
            advanced.captions?.map((track: any) => (
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
        {!isPlaying && (
          <div className="pointer-events-none relative w-full h-full inset-0 flex items-center justify-center bg-transparent">
            <motion.div
              className="absolute z-20  translate-1/2"
              initial={{ opacity: 0, scale: 0.3, y: "-50%", x: "-50%" }}
              animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
              transition={{
                type: "spring",
                stiffness: 800,
                damping: 25,
                duration: 0.3,
              }}
            >
              <button
                style={{ background: branding.primaryColor }}
                className={cx(
                  "  pointer-events-auto grid size-12 sm:size-14 md:size-20 place-items-center rounded-full border-none bg-[color:var(--vp-accent)] text-white shadow-[0_18px_45px_rgba(0,0,0,0.35)] transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white amax-sm:h-[58px] amax-sm:w-[58px]",
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
            </motion.div>
          </div>
        )}

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

        <section className="absolute bottom-0 left-0 right-0 z-30 w-full overflow-visible px-2 pb-1 sm:px-3 sm:pb-3">
          <div
            style={{
              background: branding.backgroundColor,
            }}
            className="relative flex max-h-6 min-h-8 md:max-h-full md:min-h-10 w-full items-center justify-center overflow-visible rounded-lg px-1.5 sm:px-2"
          >
            <MediaControlBar
              style={{
                ["--media-control-bar-background" as any]: "transparent",
                ["--media-control-hover-background" as any]: "transparent",
                boxShadow: "none",
                background: "transparent",
                margin: 0,
                bottom: 0,
              }}
              className="relative flex md:h-10 md:min-h-10 w-full min-w-0 items-center gap-1 overflow-visible border-none bg-transparent px-0.5 outline-none sm:gap-2 sm:px-1"
            >
              <MediaPlayButton
                className=" size-4 md:size-5  lg:size-6 shrink-0"
                style={{ background: "transparent" }}
              />

              {controls.skipBackward && (
                <MediaSeekBackwardButton
                  className="hidden  size-4 md:size-5  lg:size-6 shrink-0 sm:block"
                  style={{ background: "transparent" }}
                  seekOffset={10}
                />
              )}
              {controls.skipForward && (
                <MediaSeekForwardButton
                  className="hidden  size-4 md:size-5  lg:size-6 shrink-0 sm:block"
                  seekOffset={10}
                  style={{ background: "transparent" }}
                />
              )}

              {controls.volume && (
                <div className="relative flex h-full w-8 shrink-0 items-center justify-center">
                  <VolumeControls
                    trackColor={branding.accentColor}
                    videoRef={videoRef}
                    iconColor={branding.iconColor}
                  />
                </div>
              )}

              <MediaTimeDisplay
                className="hidden shrink-0 px-1 text-[12.40px] md:text-[14px] lg:text-[16px] leading-none sm:block font-medium"
                remaining={false}
                show-duration={false}
                style={{
                  background: "transparent",
                  color: branding.iconColor,
                  lineHeight: "32px",
                }}
              />

              <MediaTimeRange
                className="h-8 min-w-0 flex-1"
                style={{ background: "transparent" }}
              />

              <VideoSettings
                currentVolume={currentVolume}
                currentResolution={currentResolution}
                resolutions={asset.resolutions}
                handleSpeedChange={handleSpeedChange}
                handleQualityChange={handleQualityChange}
                iconColor={branding.iconColor}
              />

              {general.captions && (
                <MediaCaptionsButton
                  className="hidden  size-4 md:size-5  lg:size-6 shrink-0 sm:block"
                  style={{ background: "transparent" }}
                />
              )}

              {controls.playbackRate && (
                <MediaPlaybackRateButton
                  className="hidden  size-4 md:size-5  lg:size-6 shrink-0 sm:block"
                  style={{ background: "transparent" }}
                />
              )}

              {controls.pipButton && (
                <MediaPipButton
                  className="hidden  size-4 md:size-5  lg:size-6 shrink-0 sm:block"
                  style={{ background: "transparent" }}
                />
              )}

              {controls.fullScreen && (
                <MediaFullscreenButton
                  className=" size-4 md:size-5  lg:size-6 shrink-0"
                  style={{ background: "transparent" }}
                />
              )}

              {true && <BrandLogo />}
            </MediaControlBar>
          </div>
        </section>
      </MediaController>
    </div>
  );
}
