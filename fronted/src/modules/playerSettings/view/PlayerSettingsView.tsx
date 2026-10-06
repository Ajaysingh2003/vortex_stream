"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, RotateCcw, Loader2 } from "lucide-react";
import Preview from "../component/Preview";
import Settings from "../component/Settings";
import {
  VideoListType,
  VideoPlayerMetaData,
  VideoPlayerSettings,
  WorkspaceType,
} from "@/modules/types";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import toast from "react-hot-toast";
import TopHeader from "@/modules/console/component/TopHeader";

const DEFAULT_SETTINGS: VideoPlayerSettings = {
  general: {
    ctaEnabled: false,
    autoplay: false,
    preload: true,
    loop: false,
    captions: false,
  },
  controls: {
    disableSeekbar: false,
    downloadButton: false,
    showControls: true,
    skipForward: false,
    skipBackward: true,
    fullScreen: true,
    volume: true,
    playbackRate: false,
    pipButton: false,
    muteButton: false,
  },
  branding: {
    logoUrl: "",
    logoPosition: "top_right",
    logoWidth: 50,
    backgroundColor: "#050608",
    primaryColor: "#ffffff",
    accentColor: "#B3E61D",
    iconColor: "#ffffff",
  },
  security: {
    watermarkEnabled: false,
    watermarkTextType: "none",
    watermarkImage: "",
  },
};

export default function PlayerSettingsView() {
  const trpc = useTRPC();

  const { data: workspace } = useSuspenseQuery(
    trpc.user.getWorkspace.queryOptions(),
  );
  const workspaceData = workspace as WorkspaceType;

  // Retrieve optional video for preview (fallback to verified sample video)
  const { data: videoData } = useQuery(
    trpc.video.videoListFromWorkspace.queryOptions({
      workspaceId: workspaceData?.id || "",
      limit: 1,
      cursor: "",
      date: "any",
      visibility: "all",
      sort: "created_desc",
    }),
  );
  const videos = (videoData as VideoListType | undefined)?.items ?? [];
  const previewVideoId =
    videos[0]?.id || "6c82db12-723a-4678-a31f-9cb214a91d06";

  const { data: player } = useSuspenseQuery(
    trpc.videoPlayer.getPlayerMetaDataServer.queryOptions(),
  );

  const playerSettingData = player as Partial<VideoPlayerMetaData> | null;
  const generalSettings = playerSettingData?.general_settings;
  const controlSettings = playerSettingData?.control_settings;
  const brandingSettings = playerSettingData?.branding_settings;
  const securitySettings = playerSettingData?.security_settings;

  const [playerSettings, setPlayerSettings] = useState<VideoPlayerSettings>({
    general: {
      ctaEnabled:
        generalSettings?.ctaEnabled ?? DEFAULT_SETTINGS.general.ctaEnabled,
      autoplay: generalSettings?.autoplay ?? DEFAULT_SETTINGS.general.autoplay,
      preload: generalSettings?.preload ?? DEFAULT_SETTINGS.general.preload,
      loop: generalSettings?.loop ?? DEFAULT_SETTINGS.general.loop,
      captions: generalSettings?.captions ?? DEFAULT_SETTINGS.general.captions,
    },
    controls: {
      disableSeekbar:
        controlSettings?.disableSeekbar ??
        DEFAULT_SETTINGS.controls.disableSeekbar,
      downloadButton:
        controlSettings?.downloadButton ??
        DEFAULT_SETTINGS.controls.downloadButton,
      showControls:
        controlSettings?.showControls ?? DEFAULT_SETTINGS.controls.showControls,
      skipForward:
        controlSettings?.skipForward ?? DEFAULT_SETTINGS.controls.skipForward,
      skipBackward:
        controlSettings?.skipBackward ?? DEFAULT_SETTINGS.controls.skipBackward,
      fullScreen:
        controlSettings?.fullScreen ?? DEFAULT_SETTINGS.controls.fullScreen,
      volume: controlSettings?.volume ?? DEFAULT_SETTINGS.controls.volume,
      playbackRate:
        controlSettings?.playbackRate ?? DEFAULT_SETTINGS.controls.playbackRate,
      pipButton:
        controlSettings?.pipButton ?? DEFAULT_SETTINGS.controls.pipButton,
      muteButton:
        controlSettings?.muteButton ?? DEFAULT_SETTINGS.controls.muteButton,
    },
    branding: {
      logoUrl: brandingSettings?.logoUrl ?? DEFAULT_SETTINGS.branding.logoUrl,
      logoPosition:
        brandingSettings?.logoPosition ??
        DEFAULT_SETTINGS.branding.logoPosition,
      logoWidth:
        brandingSettings?.logoWidth ?? DEFAULT_SETTINGS.branding.logoWidth,
      backgroundColor:
        brandingSettings?.backgroundColor ??
        DEFAULT_SETTINGS.branding.backgroundColor,
      primaryColor:
        brandingSettings?.primaryColor ??
        DEFAULT_SETTINGS.branding.primaryColor,
      accentColor:
        brandingSettings?.accentColor ?? DEFAULT_SETTINGS.branding.accentColor,
      iconColor:
        brandingSettings?.iconColor ?? DEFAULT_SETTINGS.branding.iconColor,
    },
    security: {
      watermarkEnabled:
        securitySettings?.watermarkEnabled ??
        DEFAULT_SETTINGS.security.watermarkEnabled,
      watermarkTextType:
        securitySettings?.watermarkTextType ??
        DEFAULT_SETTINGS.security.watermarkTextType,
      watermarkImage:
        securitySettings?.watermarkImage ??
        DEFAULT_SETTINGS.security.watermarkImage,
    },
  });

  const playerMutate = useMutation(
    trpc.videoPlayer.createVideoPlayerSettings.mutationOptions({
      onError: (err) => {
        toast.error(err.message || "Failed to save settings");
      },
      onSuccess: () => {
        toast.success("Player settings saved successfully");
      },
    }),
  );

  const handleSaveChanges = async () => {
    if (!workspaceData?.id) return;
    await playerMutate.mutateAsync({
      workspace_id: workspaceData.id,
      general: playerSettings.general,
      control: playerSettings.controls,
      security: playerSettings.security,
      branding: playerSettings.branding,
    });
  };

  const handleReset = () => {
    setPlayerSettings(DEFAULT_SETTINGS);
    toast.success("Reset settings to default");
  };

  return (
    <div className="w-full min-h-screen px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Top Action Bar */}

      <TopHeader
      otherLine={true}
        Header="Player Settings"
        Btnchild={
          <div className="flex flex-row gap-3">
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="h-9 px-3 rounded-lg secondary-btn border border-black/10 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <RotateCcw className="size-3.5 text-zinc-500 mr-1.5" />
                <span className="font-subheading text-xs font-medium text-zinc-700 dark:text-zinc-200">
                  Reset to default
                </span>
              </Button>

              <button
                type="button"
                disabled={playerMutate.isPending}
                onClick={handleSaveChanges}
                className="h-9 px-4 rounded-lg primary-btn  font-subheadingz text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {playerMutate.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        }
      />

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full">
        {/* Left Column: Real-time Video Preview */}
        <div className="lg:col-span-7 xl:col-span-8 w-full lg:sticky lg:top-6">
          <Preview videoId={previewVideoId} playerSettings={playerSettings} />
        </div>

        {/* Right Column: Player Settings Panel */}
        <div className="lg:col-span-5 xl:col-span-4 w-full">
          <Settings
            playerSettings={playerSettings}
            setPlayerSettings={setPlayerSettings}
          />
        </div>
      </div>
    </div>
  );
}
