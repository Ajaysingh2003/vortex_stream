import React from "react";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { VideoAsset, VideoPlayerMetaData } from "@/modules/types";
import ProductionVideoPlayer from "./VideoCustomization";

const defaultPlayer: VideoPlayerMetaData = {
  id: "",
  workspaceId: "",
  general_settings: { ctaEnabled: false, autoplay: false, preload: true, loop: false, captions: false },
  control_settings: { downloadButton: false, disableSeekbar: false, showControls: true, skipForward: false, skipBackward: true, fullScreen: true, volume: true, playbackRate: false, pipButton: false, muteButton: false },
  branding_settings: { logoUrl: "", logoPosition: "top-right", logoWidth: 80, primaryColor: "#ffffff", accentColor: "#00adef", iconColor: "#ffffff", backgroundColor: "#050608" },
  security_settings: { watermarkEnabled: false, watermarkTextType: "none", watermarkImage: "" },
  advanced_settings: {},
};

function VideoPlayer({ asset }: { asset: VideoAsset }) {
  const trpc = useTRPC();

  const { data: player } = useSuspenseQuery(
    trpc.videoPlayer.getPlayerMetaData.queryOptions({
      workspaceID: asset.WorkspaceId,
    }),
  );

  const playerMetaData = {
    ...defaultPlayer,
    ...(player as Partial<VideoPlayerMetaData> | null),
    general_settings: { ...defaultPlayer.general_settings, ...(player as Partial<VideoPlayerMetaData> | null)?.general_settings },
    control_settings: { ...defaultPlayer.control_settings, ...(player as Partial<VideoPlayerMetaData> | null)?.control_settings },
    branding_settings: { ...defaultPlayer.branding_settings, ...(player as Partial<VideoPlayerMetaData> | null)?.branding_settings },
    security_settings: { ...defaultPlayer.security_settings, ...(player as Partial<VideoPlayerMetaData> | null)?.security_settings },
  };
  
  return (
    <div className="h-full w-full">
      <ProductionVideoPlayer
        asset={asset}
        player={playerMetaData}
        cdnBaseUrl={process.env.NEXT_PUBLIC_CDN_URL!}
      />
    </div>
  );
}

export default VideoPlayer;
