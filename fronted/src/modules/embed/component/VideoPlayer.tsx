import React from "react";

import {
  MediaController,
  MediaControlBar,
  MediaTimeRange,
  MediaTimeDisplay,
  MediaVolumeRange,
  MediaPlayButton,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaMuteButton,
  MediaPipButton,
  MediaPlaybackRateButton,
  MediaFullscreenButton,
  MediaLoadingIndicator,
  MediaPosterImage,
  MediaCaptionsButton,
  MediaTextDisplay,
  MediaCastButton,
  MediaPreviewChapterDisplay,
} from "media-chrome/react";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { VideoAsset, VideoPlayerMetaData } from "@/modules/types";
import ProductionVideoPlayer from "./VideoCustomization";

function VideoPlayer({ videoId }: { videoId: string }) {
  const trpc = useTRPC();
  const { data: video } = useSuspenseQuery(
    trpc.video.getVideo.queryOptions({ videoId }),
  );
  const videoData = video as VideoAsset;

  const { data: player } = useSuspenseQuery(
    trpc.videoPlayer.getPlayerMetaData.queryOptions({
      workspaceID: videoData.WorkspaceId,
    }),
  );

  const playerMetaData = player as VideoPlayerMetaData;

  console.log(playerMetaData, "jxl");

  const customThemeStyles = {
    width: "100%",
    height: "100%",
    "--media-primary-color": "white",
    "--media-icon-hover-color": "black",
    "--media-range-bar-color": "white",
    "--media-control-background": "rgba(15, 23, 42, 0.8)",
    "--media-control-hover-background": "rgba(30, 41, 59, 0.95)",
    backdropFilter: "blur(8px)",
  };

  return (
    // <MediaController style={customThemeStyles} autoFocus className="w-full">
    //   <video
    //     // ref={videoRef}
    //     src={
    //       "https://pub-8a5942cb01e54d70af415184ac8ed7b9.r2.dev/uploads/117d76fe-8d16-417e-b7dd-bf28fff6f040-socio-home.mp4"
    //     }
    //     slot="media"
    //     // crossOrigin="anonymous"
    //     playsInline
    //     muted={true} // Must be muted for automatic activation mechanics
    //   />

    //   {/* Centered Loading Indicator component */}
    //   <MediaLoadingIndicator
    //     slot="centered-chrome"
    //     style={{ transform: "scale(1.5)" }}
    //   />
    //   {playerMetaData.control_settings.showControls && (
    //     <MediaControlBar>
    //       <MediaPreviewChapterDisplay />
    //       <MediaPlayButton />

    //       {playerMetaData.control_settings.skipBackward && (
    //         <MediaSeekBackwardButton seekOffset={10} />
    //       )}
    //       {playerMetaData.control_settings.skipForward && (
    //         <MediaSeekForwardButton seekOffset={10} />
    //       )}

    //       {playerMetaData.control_settings.muteButton && <MediaMuteButton />}
    //       {playerMetaData.control_settings.volume && <MediaVolumeRange />}

    //       <MediaTimeDisplay showDuration />
    //       <MediaTimeRange />
    //       {playerMetaData.general_settings.captions && <MediaCaptionsButton />}
    //       {<MediaPlaybackRateButton />}
    //       {playerMetaData.control_settings.pipButton && <MediaPipButton />}
    //       {playerMetaData.control_settings.fullScreen && (
    //         <MediaFullscreenButton />
    //       )}
    //     </MediaControlBar>
    //   )}
    // </MediaController>

<div className="w-full">

    <ProductionVideoPlayer asset={videoData} player={playerMetaData} cdnBaseUrl="https://pub-12dc6da8688f4147b2b3d9ded1fb45c4.r2.dev/"/>

</div>
  );
}

export default VideoPlayer;
