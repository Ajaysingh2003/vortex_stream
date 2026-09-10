"use client";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { Save, RotateCcw } from "lucide-react";
// import Settings from '../component/Settings'
import Preview from "../component/Preview";
import { Settings } from "../component/Settings";
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

  // A workspace may not have saved player settings yet. Keep the editor usable
  // with its built-in defaults until settings are saved for the first time.
  const playerSettingData = player as Partial<VideoPlayerMetaData> | null;
  const generalSettings = playerSettingData?.general_settings;
  const controlSettings = playerSettingData?.control_settings;
  const brandingSettings = playerSettingData?.branding_settings;
  const securitySettings = playerSettingData?.security_settings;
  const [playerSettings, setPlayerSettings] = useState<VideoPlayerSettings>({
    general: {
      ctaEnabled: generalSettings?.ctaEnabled ?? false,
      autoplay: generalSettings?.autoplay ?? false,
      preload: generalSettings?.preload ?? true,
      loop: generalSettings?.loop ?? false,
      captions: generalSettings?.captions ?? false,
    },
    controls: {
      disableSeekbar:
      controlSettings?.disableSeekbar ?? false,
      downloadButton:
      controlSettings?.downloadButton ?? false,
      showControls: controlSettings?.showControls ?? true,
      skipForward: controlSettings?.skipForward ?? false,
      skipBackward: controlSettings?.skipBackward ?? true,
      fullScreen: controlSettings?.fullScreen ?? true,
      volume: controlSettings?.volume ?? true,

      playbackRate: controlSettings?.playbackRate ?? false,
      pipButton: controlSettings?.pipButton ?? false,
      muteButton: controlSettings?.muteButton ?? false,
    },
    branding: {
      logoUrl: brandingSettings?.logoUrl ?? "",
      logoPosition: brandingSettings?.logoPosition ?? "top_right",
      logoWidth: brandingSettings?.logoWidth ?? 50,
      backgroundColor: brandingSettings?.backgroundColor ?? "#000000",
      primaryColor: brandingSettings?.primaryColor ?? "#000000",
      accentColor: brandingSettings?.accentColor ?? "#000000",
      iconColor: brandingSettings?.iconColor ?? "#000000",
    },
    security: {
      watermarkEnabled: securitySettings?.watermarkEnabled ?? false,
      watermarkTextType: securitySettings?.watermarkTextType ?? "none",
      watermarkImage: securitySettings?.watermarkImage ?? "",
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
