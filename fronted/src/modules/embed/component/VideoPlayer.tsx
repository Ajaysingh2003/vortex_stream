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
        cdnBaseUrl={process.env.NEXT_PUBLIC_CDN_URL!}
      />
    </div>
  );
}

export default VideoPlayer;
