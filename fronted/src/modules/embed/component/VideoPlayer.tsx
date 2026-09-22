import React from "react";

import { useTRPC } from "@/trpc/client";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
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

  const experience = useQuery(trpc.videoPlayer.getExperience.queryOptions({ videoId: asset.id, workspaceId: asset.WorkspaceId }));

  const playerMetaData = {
    ...defaultPlayer,
    ...(player as Partial<VideoPlayerMetaData> | null),
    general_settings: { ...defaultPlayer.general_settings, ...(player as Partial<VideoPlayerMetaData> | null)?.general_settings },
    control_settings: { ...defaultPlayer.control_settings, ...(player as Partial<VideoPlayerMetaData> | null)?.control_settings },
    branding_settings: { ...defaultPlayer.branding_settings, ...(player as Partial<VideoPlayerMetaData> | null)?.branding_settings },
    security_settings: { ...defaultPlayer.security_settings, ...(player as Partial<VideoPlayerMetaData> | null)?.security_settings },
  };
  
  if (experience.isPending) return <div role="status" className="grid h-full place-items-center bg-black text-sm text-white/70">Loading video…</div>;
  if (experience.isError) return <div role="alert" className="flex h-full flex-col items-center justify-center gap-3 bg-black p-6 text-center text-sm text-white"><p>Unable to load this video’s settings.</p><button className="rounded-lg bg-primary px-4 py-2 text-neutral-950" onClick={() => void experience.refetch()}>Try again</button></div>;

  return (
    <div className="h-full w-full">
      <ProductionVideoPlayer
        key={asset.id}
        asset={asset}
        experience={experience.data}
        player={playerMetaData}
        cdnBaseUrl={process.env.NEXT_PUBLIC_CDN_URL || ""}
      />
    </div>
  );
}

export default VideoPlayer;
