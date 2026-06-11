"use client";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { Save, RotateCcw } from "lucide-react";
// import Settings from '../component/Settings'
import Preview from "../component/Preview";
import { Settings, useSetting } from "../component/Settings";
import {
  VideoPlayerMetaData,
  VideoPlayerSettings,
  WorkspaceType,
} from "@/modules/types";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import toast from "react-hot-toast";
function PlayerSettingsView() {
  // const {playerSettings,setPlayerSettings}=useSetting()!

  const trpc = useTRPC();

  const { data: player } = useSuspenseQuery(
    trpc.videoPlayer.getPlayerMetaDataServer.queryOptions(),
  );

  const playerSettingData = player as VideoPlayerMetaData;
  const [playerSettings, setPlayerSettings] = useState<VideoPlayerSettings>({
    general: {
      ctaEnabled: playerSettingData.general_settings.ctaEnabled ?? false,
      autoplay: playerSettingData.general_settings.autoplay ?? false,
      preload: playerSettingData.general_settings.preload ?? true,
      loop: playerSettingData.general_settings.loop ?? false,
      captions: playerSettingData.general_settings.captions ?? false,
    },
    controls: {
      disableSeekbar:
      playerSettingData.control_settings.disableSeekbar ?? false,
      downloadButton:
      playerSettingData.control_settings.downloadButton ?? false,
      showControls: playerSettingData.control_settings.showControls ?? true,
      skipForward: playerSettingData.control_settings.skipForward ?? false,
      skipBackward: playerSettingData.control_settings.skipBackward ?? true,
      fullScreen: playerSettingData.control_settings.fullScreen ?? true,
      volume: playerSettingData.control_settings.volume ?? true,

      playbackRate: playerSettingData.control_settings.playbackRate ?? false,
      pipButton: playerSettingData.control_settings.pipButton ?? false,
      muteButton: playerSettingData.control_settings.muteButton ?? false,
    },
    branding: {
      logoUrl: playerSettingData.branding_settings.logoUrl ?? "",
      logoPosition: playerSettingData.branding_settings.logoPosition ?? "top_right",
      logoWidth: playerSettingData.branding_settings.logoWidth ?? 50,
      backgroundColor: playerSettingData.branding_settings.backgroundColor ?? "#000000",
      primaryColor: playerSettingData.branding_settings.primaryColor ?? "#000000",
      accentColor: playerSettingData.branding_settings.accentColor ?? "#000000",
      iconColor: playerSettingData.branding_settings.iconColor ?? "#000000",
    },
    security: {
      watermarkEnabled: playerSettingData.security_settings.watermarkEnabled ?? false,
      watermarkTextType: playerSettingData.security_settings.watermarkTextType ?? "none",
      watermarkImage: playerSettingData.security_settings.watermarkImage ?? "",
    },
  });

  // const trpc = useTRPC();
  const { data: workspace } = useSuspenseQuery(
    trpc.user.getWorkspace.queryOptions(),
  );
  const workspaceData = workspace as WorkspaceType;
  const playerMutate = useMutation(
    trpc.videoPlayer.createVideoPlayerSettings.mutationOptions({
      onError: (err) => {
        toast.error(err.message || "Something went wrong");
      },
      onSuccess: () => {
        toast.success("Changes Saved.");
      },
    }),
  );

  const handleChanges = async () => {
    if (!workspaceData.id) return;
    await playerMutate.mutateAsync({
      workspace_id: workspaceData.id,
      general: playerSettings.general,
      control: playerSettings.controls,
      security: playerSettings.security,
      branding: playerSettings.branding,
    });
  };

  return (
    <div className=" w-full h-full px-4  p-3 md:px-8  md:py-4">
      {/* {JSON.stringify(playerSettingData, null, 2)} */}
      <div className="flex items-center justify-between  my-2 md:my-4">
        <div className="right ">
          <h3 className="font-heading leading-8 font-bold tracking-wider text-lg md:text-xl lg:2xl capitalize">
            Player Settings
          </h3>
          <p className="font-content text-sm md:text-[15px]">
            build the perfect experience for your audience
          </p>
        </div>
        <div className="left flex items-center gap-4">
          <Button variant={"outline"} font-heading className="rounded-lg">
            <RotateCcw className="size-4" />{" "}
            <span className="text-sm tracking-tight">Reset to default</span>
          </Button>
          <Button
            disabled={playerMutate.isPending}
            onClick={handleChanges}
            style={{ padding: "10px" }}
            className="rounded-lg font-heading font-bold text-sm md:text-sm tracking-wide md:-tracking-wide bg-[#7067f3]  bg-primary-btn px-2"
          >
            {" "}
            <Save className="size-4" /> Save Changes
          </Button>
        </div>
      </div>
      <div className=" grid grid-cols-1 md:grid-cols-12 gap-3  h-full w-full">
        <div className=" col-span-7  h-full     w-full">
          <Settings
            playerSettings={playerSettings}
            setPlayerSettings={setPlayerSettings}
          >
            <Settings.Menu />
            <Settings.Content />
          </Settings>
        </div>
        <div className=" col-span-5 w-full">
          <Preview />
        </div>
      </div>
    </div>
  );
  
}

export default PlayerSettingsView;
