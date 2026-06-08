import React from "react";
import ItemRow from "./ItemRow";
import { Captions, ExternalLink, Infinity, Play, PlayCircle, Timer } from "lucide-react";
// import { useConsoleContext } from "@/modules/console/context/ConsoleContext";
import {  useSetting } from "./Settings";
import { generalType } from "@/modules/types";

interface GeneralItemConfig {
  scope: keyof generalType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

function GeneralSetting() {
  // const context=useSetting()
  const { playerSettings, setPlayerSettings } = useSetting()!;

  const handleGeneralChange = (key: keyof generalType, value: boolean) => {
    setPlayerSettings((prev) => ({
      ...prev,
      general: {
        ...prev.general,
        [key]: value,
      },
    }));
  };
  // const handleChange=(scope:string)=> context?.setPlayerSettings((item)=>item.general[scope])

  console.log(playerSettings, "uyuy");
  let item: GeneralItemConfig[] = [

    {
      scope: "ctaEnabled",
      label: "cta enabled",
      description: "Enable Cta on the video",
      // onChange: () => {},
      icon: <ExternalLink className="size-4" />,
    },
    {
      scope: "autoplay",
      label: "autoplay",
      description: "Automatically play the video when the player loads.",
      // onChange: () => {},
      icon: <Play className="size-4" />,
    },
    {
      scope: "preload",
      label: "preload video",
      description:
        "Preload video metadata when the player loads, enabling faster playback.",
      icon: <Timer className="size-4" />,
    },
    {
      scope: "loop",
      label: "Loop",
      description: "video will restart when it reaches the end ",
      // onChange: () => {},
      icon: <Infinity className="size-4" />,
    },
    {
      scope: "captions",
      label: "captions",
      description: "Enable Captions",
      // onChange: () => {},
      icon: <Captions className="size-4" />,
    },
  ];

  return (
    <div className="w-full h-full ">
      <div className="flex flex-col gap-2 md:gap-2 px-3 pt-2 pb-1">
        <div className="heading">
          <h3 className="font-heading font-semibold text-md lg:text-md tracking-wide">
            General Setting
          </h3>
        </div>
        <div className="w-full flex flex-col gap-2 md:gap-3">
          {item.map((e) => (
            <ItemRow
              checked={playerSettings.general[e.scope]}
              key={e.label}
              label={e.label}
              description={e.description}
              onChange={(checked) => handleGeneralChange(e.scope, checked)}
              icon={e.icon}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default GeneralSetting;
