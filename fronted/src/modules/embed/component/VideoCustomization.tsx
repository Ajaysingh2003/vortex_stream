"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Image from "next/image";
import { ExperienceOverlay, PlayerNavigation, usePlayerExperience } from "./PlayerExperience";
import type { VideoExperience } from "../lib/experience";
import { Play } from "lucide-react";
import { motion } from "motion/react";

import {
  MediaControlBar,
  MediaController,
  MediaFullscreenButton,
  MediaLoadingIndicator,
  MediaPipButton,
  MediaPlayButton,
  MediaPlaybackRateButton,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaTimeDisplay,
  MediaTimeRange,
} from "media-chrome/react";

import VolumeControls from "./VolumeControls";
import BrandLogo from "./BrandLogo";
import VideoSettings from "./VideoSettings";

import {
  brandingType,
  ProductionVideoPlayerProps,
  VideoPlayerMetaData,
  VideoResolutionType,
} from "@/modules/types";

import {
  buildSources,
  joinCdnUrl,
  LogoOverlay,
  useHlsSource,
  Watermark,
} from "./temp";

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
  experience,
}: ProductionVideoPlayerProps & { experience: VideoExperience }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const experienceState = usePlayerExperience(videoRef, experience);
  const progressTickRef = useRef(0);

  const [hasStarted, setHasStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);


  const [settingsOpen, setSettingsOpen] = useState(false);

  const [selectedSourceIndex] = useState(0);

  const [currentResolution, setCurrentResolution] =
    useState<VideoResolutionType>({
      index: -1,
      resolution: "Auto",
    });

  const [currentSpeed, setCurrentSpeed] = useState(1);

  const general = player.general_settings;
  const controls = player.control_settings;

  const branding = {
    ...DEFAULT_BRAND,
    ...player.branding_settings,
  };

  const security = player.security_settings;

  const advanced: NonNullable<VideoPlayerMetaData["advanced_settings"]> =
    player.advanced_settings || {};


  /*
   * -------------------------------------------------------
   * Sources
   * -------------------------------------------------------
   */

  const sources = useMemo(
    () => buildSources(asset, cdnBaseUrl),
    [asset, cdnBaseUrl],
  );

  const selectedSource =
    sources[selectedSourceIndex] || sources[0];

  const poster = asset.thumbnail
    ? joinCdnUrl(cdnBaseUrl, asset.thumbnail)
    : undefined;

  const { hlsRef, isNativeSafari } = useHlsSource(
    videoRef,
    selectedSource,
  );

  /*
   * -------------------------------------------------------
   * CSS variables
   * -------------------------------------------------------
   */

  const cssVars = {
    fontFamily: "var(--font-subheading, Inter), ui-sans-serif, system-ui, sans-serif",
    containerType: "size",
    "--vp-primary": branding.primaryColor,
    "--vp-accent": branding.accentColor,
    "--vp-icon": branding.iconColor,
    "--vp-bg": branding.backgroundColor,

    "--media-primary-color": branding.primaryColor,
    "--media-accent-color": branding.accentColor,
    "--media-icon-color": branding.iconColor,

    "--media-control-background": "transparent",
    "--media-control-hover-background": "transparent",

    "--media-range-bar-color": branding.accentColor,
    "--media-range-thumb-background": branding.accentColor,

    "--media-font-family":
      "Inter, ui-sans-serif, system-ui, sans-serif",
  } as React.CSSProperties;

  /*
   * -------------------------------------------------------
   * Playback
   * -------------------------------------------------------
   */

  const togglePlay = useCallback(async () => {
    const video = videoRef.current;

    if (!video || experienceState.blocked) return;

    try {
      if (video.paused) {
        setHasStarted(true);

        await video.play();

        return;
      }

      video.pause();
    } catch (error) {
      console.error("Unable to toggle video playback:", error);
    }
  }, [experienceState.blocked]);

  /*
   * -------------------------------------------------------
   * Progress
   * -------------------------------------------------------
   */

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;

    if (!video) return;

    if (
      onProgress &&
      video.currentTime - progressTickRef.current >= 5
    ) {
      progressTickRef.current = video.currentTime;

      onProgress({
        videoId: asset.id,
        currentTime: video.currentTime,
      });
    }
  }, [
    asset.id,
    onProgress,
  ]);

  /*
   * -------------------------------------------------------
   * Quality
   * -------------------------------------------------------
   */

  const handleQualityChange = useCallback(
    (resolution: VideoResolutionType) => {
      setSettingsOpen(false);

      setCurrentResolution(resolution);

      if (!hlsRef.current) return;

      /*
       * Important:
       *
       * level 0 is valid, so don't use:
       * resolution.index || -1
       */
      hlsRef.current.currentLevel =
        resolution.index ?? -1;
    },
    [hlsRef],
  );

  /*
   * -------------------------------------------------------
   * Playback speed
   * -------------------------------------------------------
   */

  const handleSpeedChange = useCallback((speed: number) => {
    const video = videoRef.current;

    if (!video) return;

    video.playbackRate = speed;

    setCurrentSpeed(speed);
    setSettingsOpen(false);
  }, []);

  /*
   * -------------------------------------------------------
   * Video events
   * -------------------------------------------------------
   */

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const handlePlay = () => {
      setHasStarted(true);
      setIsPlaying(true);
    };

    const handlePause = () => {
      setSettingsOpen(false);
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setSettingsOpen(false);
      setIsPlaying(false);

      onEnded?.({
        videoId: asset.id,
      });
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

  /*
   * -------------------------------------------------------
   * Keyboard shortcuts
   * -------------------------------------------------------
   */

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const video = videoRef.current;

      if (!video || experienceState.blocked) return;

      const activeElement = document.activeElement;

      const tagName =
        activeElement?.tagName?.toLowerCase();

      if (
        tagName === "button" ||
        tagName === "a" ||
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        activeElement?.getAttribute("contenteditable") === "true"
      ) {
        return;
      }

      if (event.key === " ") {
        event.preventDefault();

        void togglePlay();

        return;
      }

      if (
        !controls.disableSeekbar &&
        event.key === "ArrowRight"
      ) {
        video.currentTime = Math.min(
          video.duration || Infinity,
          video.currentTime + 10,
        );

        return;
      }

      if (
        !controls.disableSeekbar &&
        event.key === "ArrowLeft"
      ) {
        video.currentTime = Math.max(
          0,
          video.currentTime - 10,
        );

        return;
      }

      if (event.key.toLowerCase() === "m") {
        video.muted = !video.muted;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    controls.disableSeekbar,
    experienceState.blocked,
    togglePlay,
  ]);

  /*
   * -------------------------------------------------------
   * Media Chrome shared styles
   * -------------------------------------------------------
   */

  const controlStyle: React.CSSProperties = {
    background: "transparent",
    padding: 0,
    margin: 0,
    color: branding.iconColor,
  };

  return (
    <div
      className={cx(
        `
        relative
        flex
        h-full
        min-h-0
        min-w-0
        w-full
        items-center
        justify-center
        overflow-hidden
        bg-transparent
        `,
        className,
      )}
      style={cssVars}
    >
      <MediaController
        noHotkeys
        className="
          relative
          block
          h-full
          min-h-0
          min-w-0
          w-full
          overflow-visible
          font-sans
        "
        style={{
          ["--media-background-color" as string]:
            "transparent",

          width: "100%",
          height: "100%",
          display: "block",

          /*
           * Important for VideoSettings dropdown.
           */
          overflow: "visible",
        }}
      >
        {/* ================================================= */}
        {/* PLAYER CLICK AREA */}
        {/* ================================================= */}

        <button
          type="button"
          disabled={experienceState.blocked}
          aria-hidden={experienceState.blocked}
          tabIndex={experienceState.blocked ? -1 : 0}
          aria-label={
            isPlaying
              ? "Pause video"
              : "Play video"
          }
          onClick={togglePlay}
          className="
            absolute
            inset-0
            z-[1]
            cursor-pointer
            border-0
            bg-transparent
            p-0
            outline-none
          "
        />

        {/* ================================================= */}
        {/* VIDEO */}
        {/* ================================================= */}

        <video
          ref={videoRef}
          slot="media"
          poster={poster}
          playsInline
          muted={general.autoplay}
          autoPlay={general.autoplay && !experienceState.blocked}
          loop={general.loop && !experience.endScreen && experience.form?.placement !== "after_video"}
          preload={
            general.autoplay
              ? "auto"
              : "metadata"
          }
          crossOrigin="anonymous"
          controlsList={
            asset.isPrivate
              ? "nodownload noplaybackrate"
              : undefined
          }
          disablePictureInPicture={
            !controls.pipButton
          }
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          className="
            absolute
            inset-0
            z-0
            h-full
            w-full
            cursor-pointer
            bg-transparent
            object-contain
            object-center
          "
        >
          {selectedSource?.type !==
            "application/x-mpegURL" &&
          selectedSource?.src ? (
            <source
              src={selectedSource.src}
              type={selectedSource.type}
            />
          ) : null}


        </video>

        {/* ================================================= */}
        {/* POSTER */}
        {/* ================================================= */}

        {!hasStarted && poster && !experienceState.blocked && (
          <button
            type="button"
            aria-label="Play video"
            onClick={togglePlay}
            className="
              absolute
              inset-0
              z-20
              block
              h-full
              w-full
              cursor-pointer
              border-0
              bg-transparent
              p-0
            "
          >
            <Image
              src={poster}
              alt="Video thumbnail"
              fill
              unoptimized
              priority
              sizes="100vw"
              className="
                object-contain
                object-center
              "
            />
          </button>
        )}

        {/* ================================================= */}
        {/* LOADING */}
        {/* ================================================= */}

        <MediaLoadingIndicator
          slot="centered-chrome"
          className="
            z-30
            scale-110
            text-[color:var(--vp-accent)]

            sm:scale-125
          "
        />

        {/* ================================================= */}
        {/* CENTER PLAY BUTTON */}
        {/* ================================================= */}

        {!isPlaying && !experienceState.blocked && (
          <div
            className="
              pointer-events-none
              absolute
              inset-0
              z-30
              grid
              place-items-center
            "
          >
            <motion.button
              type="button"
              aria-label="Play video"
              onClick={(event) => {
                event.stopPropagation();

                void togglePlay();
              }}
              initial={{
                opacity: 0,
                scale: 0.72,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 28,
              }}
              whileHover={{
                scale: 1.05,
              }}
              whileTap={{
                scale: 0.96,
              }}
              style={{
                background:
                  branding.primaryColor,

                color:
                  branding.backgroundColor,
              }}
              className="
                pointer-events-auto
                grid
                size-12
                place-items-center
                rounded-full
                border-0
                shadow-[0_12px_35px_rgba(0,0,0,0.3)]
                outline-none
                ring-1
                ring-white/10

                sm:size-16

                md:size-[72px]

                lg:size-20

                focus-visible:ring-2
                focus-visible:ring-white
                focus-visible:ring-offset-2
                focus-visible:ring-offset-black
              "
            >
              <Play
                fill="currentColor"
                strokeWidth={1.8}
                className="
                  ml-0.5
                  size-5

                  sm:size-6

                  md:size-8

                  lg:size-9
                "
              />
            </motion.button>
          </div>
        )}

        {/* ================================================= */}
        {/* LOGO */}
        {/* ================================================= */}

        <LogoOverlay branding={branding} />

        {/* ================================================= */}
        {/* WATERMARK */}
        {/* ================================================= */}

        <Watermark
          security={security}
          viewerEmail={advanced.viewerEmail}
          viewerIp={advanced.viewerIp}
        />

        {/* ================================================= */}
        {/* CTA */}
        {/* ================================================= */}

        <ExperienceOverlay experience={experience} state={experienceState} videoId={asset.id} cdnBaseUrl={cdnBaseUrl} />
        <div inert={experienceState.blocked} className={experienceState.blocked ? "invisible" : ""}>
          <PlayerNavigation experience={experience} videoRef={videoRef} currentTime={experienceState.currentTime} disableSeek={controls.disableSeekbar} cdnBaseUrl={cdnBaseUrl} defaultCaptions={general.captions} />
        </div>

        {/* ================================================= */}
        {/* PLAYER CONTROLS */}
        {/* ================================================= */}

        <section
          hidden={!controls.showControls || experienceState.blocked}
          inert={experienceState.blocked}
          className="
            pointer-events-none
            absolute
            inset-x-0
            bottom-0
            z-[100]
            w-full
            overflow-visible

            px-1.5
            pb-1.5

            sm:px-2.5
            sm:pb-2.5

            md:px-3
            md:pb-3
          "
        >
          <div
            style={{
              background:
                branding.backgroundColor,
            }}
            className="
              pointer-events-auto
              relative
              z-[100]
              w-full
              min-w-0
              overflow-visible

              rounded-lg

              px-1.5
              py-1

              shadow-[0_8px_30px_rgba(0,0,0,0.15)]

              sm:rounded-xl
              sm:px-2
              sm:py-1.5

              md:px-2.5
            "
            onClick={(event) => {
              /*
               * Prevent any control clicks from bubbling
               * into the player click layer.
               */
              event.stopPropagation();
            }}
          >
            <MediaControlBar
              style={{
                [
                  "--media-control-bar-background" as string
                ]: "transparent",

                [
                  "--media-control-hover-background" as string
                ]: "transparent",

                boxShadow: "none",
                background: "transparent",
                margin: 0,
                padding: 0,

                overflow: "visible",
              }}
              className="
                relative
                z-[110]
                flex
                h-8
                min-h-8
                w-full
                min-w-0
                items-center

                gap-1

                overflow-visible
                border-none
                bg-transparent
                p-0
                outline-none

                sm:h-9
                sm:min-h-9
                sm:gap-1.5

                md:h-10
                md:min-h-10
                md:gap-2
              "
            >
              {/* ========================================== */}
              {/* LEFT CONTROLS */}
              {/* ========================================== */}

              <div
                className="
                  relative
                  z-[120]
                  flex
                  shrink-0
                  items-center

                  gap-0.5

                  sm:gap-1

                  md:gap-1.5
                "
              >
                {/* PLAY */}

                <MediaPlayButton
                  aria-label="Play or pause"
                  style={controlStyle}
                  className="
                    !m-0
                    !grid
                    !size-7
                    shrink-0
                    place-items-center
                    !p-0

                    sm:!size-8

                    md:!size-9
                  "
                />

                {/* BACKWARD */}

                {controls.skipBackward && (
                  <MediaSeekBackwardButton
                    seekOffset={10}
                    style={controlStyle}
                    className="
                      !m-0
                      !hidden
                      !size-8
                      shrink-0
                      place-items-center
                      !p-0

                      md:!grid

                      lg:!size-9
                    "
                  />
                )}

                {/* FORWARD */}

                {controls.skipForward && (
                  <MediaSeekForwardButton
                    seekOffset={10}
                    style={controlStyle}
                    className="
                      !m-0
                      !hidden
                      !size-8
                      shrink-0
                      place-items-center
                      !p-0

                      md:!grid

                      lg:!size-9
                    "
                  />
                )}

                {/* VOLUME */}

                {controls.volume && (
                  <div
                    className="
                      relative
                      z-[130]
                      flex
                      size-7
                      shrink-0
                      items-center
                      justify-center
                      overflow-visible

                      sm:size-8

                      md:size-9
                    "
                  >
                    <VolumeControls
                      trackColor={
                        branding.accentColor
                      }
                      videoRef={videoRef}
                      iconColor={
                        branding.iconColor
                      }
                    />
                  </div>
                )}

                {/* CURRENT TIME */}

                <MediaTimeDisplay
                  remaining={false}
                  show-duration={false}
                  style={{
                    background:
                      "transparent",

                    color:
                      branding.iconColor,

                    padding: 0,
                    margin: 0,
                  }}
                  className="
                    !hidden
                    shrink-0
                    whitespace-nowrap

                    px-0.5

                    text-[11px]
                    font-medium
                    leading-none

                    md:!block
                    md:text-xs

                    lg:text-[13px]
                  "
                />
              </div>

              {/* ========================================== */}
              {/* SEEK BAR */}
              {/* ========================================== */}

              <div
                className="
                  relative
                  z-[120]
                  flex
                  min-w-0
                  flex-1
                  items-center

                  px-0.5

                  sm:px-1

                  md:px-1.5
                "
              >
                <MediaTimeRange
                  style={{
                    background:
                      "transparent",
                  }}
                  className={cx(
                    `
                    h-7
                    min-w-[44px]
                    flex-1

                    sm:h-8
                    sm:min-w-[70px]

                    md:min-w-[100px]

                    lg:min-w-[160px]
                    `,
                    controls.disableSeekbar &&
                      "pointer-events-none opacity-60",
                  )}
                />
              </div>

              {/* ========================================== */}
              {/* RIGHT CONTROLS */}
              {/* ========================================== */}

              <div
                className="
                  relative
                  z-[150]
                  flex
                  shrink-0
                  items-center
                  justify-end
                  overflow-visible

                  gap-0.5

                  sm:gap-1

                  md:gap-1.5
                "
              >
                {/* ======================================== */}
                {/* SETTINGS */}
                {/* ======================================== */}

                <div
                  className="
                    pointer-events-auto
                    relative
                    z-[300]
                    flex
                    size-7
                    shrink-0
                    items-center
                    justify-center
                    overflow-visible

                    sm:size-8

                    md:size-9
                  "
                  onPointerDown={(event) => {
                    /*
                     * Prevent media controller from treating
                     * this as a video interaction.
                     */
                    event.stopPropagation();
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                >
                  <VideoSettings
                    isNativeSafari={
                      isNativeSafari
                    }
                    currentSpeed={
                      currentSpeed
                    }
                    currentResolution={
                      currentResolution
                    }
                    settingOpen={
                      settingsOpen && !experienceState.blocked
                    }
                    setSettingOpen={
                      setSettingsOpen
                    }
                    handleSpeedChange={
                      handleSpeedChange
                    }
                    handleQualityChange={
                      handleQualityChange
                    }
                    iconColor={
                      branding.iconColor
                    }
                  />
                </div>

                {/* CAPTIONS */}


                {/* PLAYBACK RATE */}

                {controls.playbackRate && (
                  <MediaPlaybackRateButton
                    style={controlStyle}
                    className="
                      !m-0
                      !hidden
                      !size-8
                      shrink-0
                      place-items-center
                      !p-0

                      xl:!grid
                      xl:!size-9
                    "
                  />
                )}

                {/* PIP */}

                {controls.pipButton && (
                  <MediaPipButton
                    style={controlStyle}
                    className="
                      !m-0
                      !hidden
                      !size-8
                      shrink-0
                      place-items-center
                      !p-0

                      lg:!grid

                      xl:!size-9
                    "
                  />
                )}

                {/* FULLSCREEN */}

                {controls.fullScreen && (
                  <MediaFullscreenButton
                    style={controlStyle}
                    className="
                      !m-0
                      !grid
                      !size-7
                      shrink-0
                      place-items-center
                      !p-0

                      sm:!size-8

                      md:!size-9
                    "
                  />
                )}

                {/* BRAND */}

                <div
                  className="
                    hidden
                    shrink-0
                    items-center
                    justify-center

                    2xl:flex
                  "
                >
                  <BrandLogo />
                </div>
              </div>
            </MediaControlBar>
          </div>
        </section>
      </MediaController>
    </div>
  );
}