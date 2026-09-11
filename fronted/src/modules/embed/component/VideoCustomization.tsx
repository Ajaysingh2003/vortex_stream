// "use client";

// import React, {
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import {
//   MediaCaptionsButton,
//   MediaControlBar,
//   MediaController,
//   MediaFullscreenButton,
//   MediaLoadingIndicator,
//   MediaMuteButton,
//   MediaPipButton,
//   MediaPlayButton,
//   MediaPlaybackRateButton,
//   MediaSeekBackwardButton,
//   MediaSeekForwardButton,
//   MediaTimeDisplay,
//   MediaTimeRange,
//   MediaVolumeRange,
// } from "media-chrome/react";
// import { Pause, Play } from "lucide-react";

// import { motion } from "motion/react";
// import VolumeControls from "./VolumeControls";
// import {
//   brandingType,
//   ProductionVideoPlayerProps,
//   VideoPlayerMetaData,
//   VideoResolutionType,
// } from "@/modules/types";
// import {
//   buildSources,
//   CtaOverlay,
//   joinCdnUrl,
//   LogoOverlay,
//   useHlsSource,
//   Watermark,
// } from "./temp";
// import Image from "next/image";
// import BrandLogo from "./BrandLogo";
// import VideoSettings from "./VideoSettings";

// const DEFAULT_BRAND: brandingType = {
//   logoUrl: "",
//   logoPosition: "top-right",
//   logoWidth: 80,
//   primaryColor: "#ffffff",
//   accentColor: "#00adef",
//   iconColor: "#ffffff",
//   backgroundColor: "#050608",
// };

// function cx(...values: Array<string | false | null | undefined>) {
//   return values.filter(Boolean).join(" ");
// }

// export default function ProductionVideoPlayer({
//   asset,
//   player,
//   cdnBaseUrl,
//   className,
//   onProgress,
//   onEnded,
// }: ProductionVideoPlayerProps) {
//   const [hasStarted, setHasStarted] = useState(false);
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const ctaShownRef = useRef(false);
//   const progressTickRef = useRef(0);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [showCta, setShowCta] = useState(false);
//   const [settingsOpen, setSettingsOpen] = useState(false);
//   const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);
//   const [currentResolution, setCurrentResolution] =
//     useState<VideoResolutionType>({ index:-1,resolution:"Auto"});
//   const general = player.general_settings;
//   const controls = player.control_settings;
//   const branding = { ...DEFAULT_BRAND, ...player.branding_settings };
//   const security = player.security_settings;

//   const advanced: NonNullable<VideoPlayerMetaData["advanced_settings"]> =
//     player.advanced_settings || {};
//   const cta = advanced.cta;

//   const sources = useMemo(
//     () => buildSources(asset, cdnBaseUrl),
//     [asset, cdnBaseUrl],
//   );

//   const selectedSource = sources[selectedSourceIndex] || sources[0];
//   const [currentSpeed, setCurrentSpeed ] = useState<number>(1);
//   console.log(selectedSource, "ocean");

//   const poster = asset.thumbnail
//     ? joinCdnUrl(cdnBaseUrl, asset.thumbnail)
//     : undefined;
//   console.log()
//   const { hlsRef, isSupported , isNativeSafari } = useHlsSource(videoRef, selectedSource);

//   console.log(isSupported,"lollolajay")
//   const cssVars = {
//     "--vp-primary": branding.primaryColor,
//     "--vp-accent": branding.accentColor,
//     "--vp-icon": branding.iconColor,
//     "--vp-bg": branding.backgroundColor,
//     "--media-primary-color": branding.primaryColor,
//     "--media-accent-color": branding.accentColor,
//     "--media-icon-color": branding.iconColor,
//     "--media-control-background":
//       "linear-gradient(180deg, transparent, rgba(0,0,0,.78))",
//     "--media-range-bar-color": branding.accentColor,
//     "--media-range-thumb-background": branding.accentColor,
//     "--media-font-family": "Inter, ui-sans-serif, system-ui, sans-serif",
//   } as React.CSSProperties;

//   const togglePlay = useCallback(async () => {
//     const video = videoRef.current;
//     if (!video) return;

//     if (video.paused) {
//       setHasStarted(true);
//       await video.play();
//       return;
//     }

//     video.pause();
//   }, []);

//   const replay = useCallback(() => {
//     const video = videoRef.current;
//     if (!video) return;
//     video.currentTime = 0;
//     void video.play();
//   }, []);

//   const handleTimeUpdate = useCallback(() => {
//     const video = videoRef.current;
//     if (!video) return;

//     if (
//       general.ctaEnabled &&
//       cta?.ctaEnabled &&
//       !ctaShownRef.current &&
//       video.currentTime >= Math.max(0, cta.timeTrigger || 0)
//     ) {
//       ctaShownRef.current = true;
//       video.pause();
//       setShowCta(true);
//     }

//     if (onProgress && video.currentTime - progressTickRef.current >= 5) {
//       progressTickRef.current = video.currentTime;
//       onProgress({ videoId: asset.id, currentTime: video.currentTime });
//     }
//   }, [asset.id, cta, general.ctaEnabled, onProgress]);

//   const handleQualityChange = useCallback(
//     (resolution: VideoResolutionType) => {
//       if (!hlsRef.current) return;
//       setSettingsOpen(false);
//       setCurrentResolution(resolution);
//       hlsRef.current.currentLevel = resolution.index || -1;
//     },
//     [cdnBaseUrl, asset.masterKey],
//   );

//   useEffect(() => {
//     const video = videoRef.current;
//     if (!video) return;

//     const handlePlay = () => setIsPlaying(true);
//     const handlePause = () => setIsPlaying(false);
//     const handleEnded = () => {
//       setIsPlaying(false);
//       onEnded?.({ videoId: asset.id });
//     };

//     video.addEventListener("play", handlePlay);
//     video.addEventListener("pause", handlePause);
//     video.addEventListener("ended", handleEnded);

//     return () => {
//       video.removeEventListener("play", handlePlay);
//       video.removeEventListener("pause", handlePause);
//       video.removeEventListener("ended", handleEnded);
//     };
//   }, [asset.id, onEnded]);

//   useEffect(() => {
//     const handleKeyDown = (event: KeyboardEvent) => {
//       const video = videoRef.current;
//       if (!video) return;

//       const tagName = document.activeElement?.tagName.toLowerCase();
//       if (
//         tagName === "input" ||
//         tagName === "textarea" ||
//         tagName === "select"
//       ) {
//         return;
//       }

//       if (event.key === " ") {
//         event.preventDefault();
//         void togglePlay();
//       }

//       if (!controls.disableSeekbar && event.key === "ArrowRight") {
//         video.currentTime += 10;
//       }

//       if (!controls.disableSeekbar && event.key === "ArrowLeft") {
//         video.currentTime -= 10;
//       }

//       if (event.key.toLowerCase() === "m") {
//         video.muted = !video.muted;
//       }
//     };

//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [controls.disableSeekbar, togglePlay]);

//   const handleSpeedChange = (speed: number) => {
//     if (videoRef.current) {
//       videoRef.current.playbackRate = speed;

//       setCurrentSpeed(speed);
//       setSettingsOpen(false);
//     }
//   };

//   return (

//       <div
//         className={cx(
//           "flex h-full min-h-0 w-full flex-col items-center overflow-hidden relative",
//           className,
//         )}
//         style={cssVars}
//       >

//       <MediaController
//         style={{
//           ["--media-background-color" as any]: "transparent",
//           width: "100%",
//           height: "100%",
//           display: "block",
//           flexDirection: "column",
//         }}
//         className="relative z-0 h-full w-full font-sans"
//       >
//         <button
//           type="button"
//           className="absolute inset-0 z-10 cursor-pointer bg-transparent"
//           aria-label={isPlaying ? "Pause video" : "Play video"}
//           onClick={togglePlay}
//         />

//         {!hasStarted && poster && (
//           <Image
//             height={100}
//             width={100}
//             unoptimized
//             src={
//               poster
//             }
//             alt="Video Thumbnail Placeholder"
//             className="absolute inset-0 z-20 w-full h-full cursor-pointer poster-img object-contain bg-transparent"
//             onClick={togglePlay}
//           />
//         )}

//         <video
//           poster= {asset.thumbnail}
//           ref={videoRef}
//           slot="media"
//           className="h-full w-full cursor-pointer video-ref-embed object-contain bg-transparent"
//           playsInline
//           muted={general.autoplay}
//           autoPlay={general.autoplay}
//           loop={general.loop}
//           preload={general.autoplay ? "auto" : "none"}
//           crossOrigin="anonymous"
//           controlsList={
//             asset.isPrivate ? "nodownload noplaybackrate" : undefined
//           }
//           disablePictureInPicture={!controls.pipButton}
//           onClick={togglePlay}
//           onTimeUpdate={handleTimeUpdate}
//         >
//           {selectedSource?.type !== "application/x-mpegURL" &&
//           selectedSource?.src ? (
//             <source src={selectedSource.src} type={selectedSource.type} />
//           ) : null}

//           {general.captions &&
//             advanced.captions?.map((track: any) => (
//               <track
//                 key={`${track.srcLang}-${track.src}`}
//                 kind="subtitles"
//                 src={track.src}
//                 srcLang={track.srcLang}
//                 label={track.label}
//                 default={track.default}
//               />
//             ))}
//         </video>

//         <MediaLoadingIndicator
//           slot="centered-chrome"
//           className="scale-125 text-[color:var(--vp-accent)]"
//         />
//         {!isPlaying && (
//           <div className="pointer-events-none relative w-full h-full inset-0 flex items-center justify-center bg-transparent">
//             <motion.div
//               className="absolute z-20  translate-1/2"
//               initial={{ opacity: 0, scale: 0.3, y: "-50%", x: "-50%" }}
//               animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
//               transition={{
//                 type: "spring",
//                 stiffness: 800,
//                 damping: 25,
//                 duration: 0.3,
//               }}
//             >
//               <button
//                 style={{ background: branding.primaryColor }}
//                 className={cx(
//                   "  pointer-events-auto grid size-12 sm:size-14 md:size-20 place-items-center rounded-full border-none bg-[color:var(--vp-accent)] text-white shadow-[0_18px_45px_rgba(0,0,0,0.35)] transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white amax-sm:h-[58px] amax-sm:w-[58px]",
//                   isPlaying && "pointer-events-none opacity-0",
//                 )}
//                 slot="centered-chrome"
//                 type="button"
//                 aria-label={isPlaying ? "Pause" : "Play"}
//                 onClick={togglePlay}
//               >
//                 {isPlaying ? (
//                   <Pause className="size-6 md:size-10" fill="currentColor" />
//                 ) : (
//                   <Play fill="currentColor" className="size-6 md:size-10" />
//                 )}
//               </button>
//             </motion.div>
//           </div>
//         )}

//         <LogoOverlay branding={branding} />

//         <Watermark
//           security={security}
//           viewerEmail={advanced.viewerEmail}
//           viewerIp={advanced.viewerIp}
//         />

//         {showCta && cta ? (
//           <CtaOverlay
//             cta={cta}
//             accentColor={branding.accentColor}
//             onClose={() => {
//               setShowCta(false);
//               void videoRef.current?.play();
//             }}
//           />
//         ) : null}

//         <section className="absolute bottom-0 left-0 right-0 z-30 w-full overflow-visible px-2 pb-1 sm:px-3 sm:pb-3">
//           <div
//             style={{
//               background: branding.backgroundColor,
//             }}
//             className="relative flex max-h-6 min-h-8 md:max-h-full md:min-h-10 w-full items-center justify-center overflow-visible rounded-lg px-1.5 sm:px-2"
//           >
//             <MediaControlBar
//               style={{
//                 ["--media-control-bar-background" as any]: "transparent",
//                 ["--media-control-hover-background" as any]: "transparent",
//                 boxShadow: "none",
//                 background: "transparent",
//                 margin: 0,
//                 bottom: 0,
//               }}
//               className="relative flex md:h-10 md:min-h-10 w-full min-w-0 items-center gap-1 overflow-visible border-none bg-transparent px-0.5 outline-none sm:gap-2 sm:px-1"
//             >
//               <MediaPlayButton
//                 className=" size-4 md:size-5  lg:size-6 shrink-0"
//                 style={{ background: "transparent" }}
//               />

//               {controls.skipBackward && (
//                 <MediaSeekBackwardButton
//                   className="hidden  size-4 md:size-5  lg:size-6 shrink-0 sm:block"
//                   style={{ background: "transparent" }}
//                   seekOffset={10}
//                 />
//               )}
//               {controls.skipForward && (
//                 <MediaSeekForwardButton
//                   className="hidden  size-4 md:size-5  lg:size-6 shrink-0 sm:block"
//                   seekOffset={10}
//                   style={{ background: "transparent" }}
//                 />
//               )}

//               {controls.volume && (
//                 <div className="relative flex h-full w-8 shrink-0 items-center justify-center">
//                   <VolumeControls
//                     trackColor={branding.accentColor}
//                     videoRef={videoRef}
//                     iconColor={branding.iconColor}
//                   />
//                 </div>
//               )}

//               <MediaTimeDisplay
//                 className="hidden shrink-0 px-1 text-[12.40px] md:text-[14px] lg:text-[16px] leading-none sm:block font-medium"
//                 remaining={false}
//                 show-duration={false}
//                 style={{
//                   background: "transparent",
//                   color: branding.iconColor,
//                   lineHeight: "32px",
//                 }}
//               />

//               <MediaTimeRange
//                 className="h-8 min-w-0 flex-1"
//                 style={{ background: "transparent" }}
//               />

//               {
//                 <VideoSettings
//                   isNativeSafari={isNativeSafari}
//                   currentSpeed={currentSpeed}
//                   currentResolution={currentResolution}
//                   settingOpen={settingsOpen}
//                   setSettingOpen={setSettingsOpen}
//                   handleSpeedChange={handleSpeedChange}
//                   handleQualityChange={handleQualityChange}
//                   iconColor={branding.iconColor}
//                 />
//               }

//               {general.captions && (
//                 <MediaCaptionsButton
//                   className="hidden  size-4 md:size-5  lg:size-6 shrink-0 sm:block"
//                   style={{ background: "transparent" }}
//                 />
//               )}

//               {controls.playbackRate && (
//                 <MediaPlaybackRateButton
//                   className="hidden  size-4 md:size-5  lg:size-6 shrink-0 sm:block"
//                   style={{ background: "transparent" }}
//                 />
//               )}

//               {controls.pipButton && (
//                 <MediaPipButton
//                   className="hidden  size-4 md:size-5  lg:size-6 shrink-0 sm:block"
//                   style={{ background: "transparent" }}
//                 />
//               )}

//               {controls.fullScreen && (
//                 <MediaFullscreenButton
//                   className=" size-4 md:size-5  lg:size-6 shrink-0"
//                   style={{ background: "transparent" }}
//                 />
//               )}

//               {true && <BrandLogo />}
//             </MediaControlBar>
//           </div>
//         </section>
//       </MediaController>
      
//        </div>
       
//   );
// }



"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Image from "next/image";
import { Play } from "lucide-react";
import { motion } from "motion/react";

import {
  MediaCaptionsButton,
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
  CtaOverlay,
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
}: ProductionVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const ctaShownRef = useRef(false);
  const progressTickRef = useRef(0);

  const [hasStarted, setHasStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [showCta, setShowCta] = useState(false);

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

  const cta = advanced.cta;

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

    if (!video) return;

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
  }, []);

  /*
   * -------------------------------------------------------
   * Progress
   * -------------------------------------------------------
   */

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
    cta,
    general.ctaEnabled,
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
      setIsPlaying(false);
    };

    const handleEnded = () => {
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

      if (!video) return;

      const activeElement = document.activeElement;

      const tagName =
        activeElement?.tagName?.toLowerCase();

      if (
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
          ["--media-background-color" as any]:
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
          autoPlay={general.autoplay}
          loop={general.loop}
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

          {general.captions &&
            advanced.captions?.map(
              (track: any) => (
                <track
                  key={`${track.srcLang}-${track.src}`}
                  kind="subtitles"
                  src={track.src}
                  srcLang={track.srcLang}
                  label={track.label}
                  default={track.default}
                />
              ),
            )}
        </video>

        {/* ================================================= */}
        {/* POSTER */}
        {/* ================================================= */}

        {!hasStarted && poster && (
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

        {!isPlaying && (
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

        {showCta && cta ? (
          <CtaOverlay
            cta={cta}
            accentColor={
              branding.accentColor
            }
            onClose={() => {
              setShowCta(false);

              void videoRef.current?.play();
            }}
          />
        ) : null}

        {/* ================================================= */}
        {/* PLAYER CONTROLS */}
        {/* ================================================= */}

        <section
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
                  "--media-control-bar-background" as any
                ]: "transparent",

                [
                  "--media-control-hover-background" as any
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
                      settingsOpen
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

                {general.captions && (
                  <MediaCaptionsButton
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