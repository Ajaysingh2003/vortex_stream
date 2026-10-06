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

  const [liveSettings, setLiveSettings] = React.useState<Partial<VideoPlayerMetaData> | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined" && window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "PLAYER_EMBED_READY" }, "*");
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "UPDATE_PLAYER_SETTINGS" && event.data.settings) {
        const s = event.data.settings;
        setLiveSettings({
          general_settings: s.general,
          control_settings: s.controls,
          branding_settings: s.branding,
          security_settings: s.security,
        });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const experience = useQuery(trpc.videoPlayer.getExperience.queryOptions({ videoId: asset.id, workspaceId: asset.WorkspaceId }));

  const playerMetaData = {
    ...defaultPlayer,
    ...(player as Partial<VideoPlayerMetaData> | null),
    ...(liveSettings || {}),
    general_settings: {
      ...defaultPlayer.general_settings,
      ...(player as Partial<VideoPlayerMetaData> | null)?.general_settings,
      ...(liveSettings?.general_settings || {}),
    },
    control_settings: {
      ...defaultPlayer.control_settings,
      ...(player as Partial<VideoPlayerMetaData> | null)?.control_settings,
      ...(liveSettings?.control_settings || {}),
    },
    branding_settings: {
      ...defaultPlayer.branding_settings,
      ...(player as Partial<VideoPlayerMetaData> | null)?.branding_settings,
      ...(liveSettings?.branding_settings || {}),
    },
    security_settings: {
      ...defaultPlayer.security_settings,
      ...(player as Partial<VideoPlayerMetaData> | null)?.security_settings,
      ...(liveSettings?.security_settings || {}),
    },
  };
  
  const fallbackExperience = React.useMemo(() => ({
    form: null,
    chapters: [],
    ctas: [],
    subtitles: [],
    endScreen: null,
  }), []);

  const experienceData = experience.data || fallbackExperience;

  return (
    <div className="h-full w-full overflow-hidden border-0 outline-none">
      <ProductionVideoPlayer
        key={asset.id}
        asset={asset}
        experience={experienceData}
        player={playerMetaData}
        cdnBaseUrl={process.env.NEXT_PUBLIC_CDN_URL || ""}
      />
    </div>
  );
}

export default VideoPlayer;
