import React from "react";

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

  return (
    <div className="h-full w-full">
      <ProductionVideoPlayer
        asset={videoData}
        
        player={playerMetaData}
        cdnBaseUrl="https://pub-12dc6da8688f4147b2b3d9ded1fb45c4.r2.dev/"
      />
    </div>
  );
}

export default VideoPlayer;
