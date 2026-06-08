import React from "react";
import ItemRow from "./ItemRow";
import {
  ChartBarDecreasing,
  ChevronRightCircleIcon,
  Download,
  FullscreenIcon,
  GripHorizontal,
  Infinity,
  MonitorOff,
  Play,
  PlayCircle,
  SoapDispenserDroplet,
  Timer,
  Volume,
  Volume1,
} from "lucide-react";
import { FullScreenIcon } from "@hugeicons/core-free-icons";
import {  useSetting } from "./Settings";
import { controlsType } from "@/modules/types";

interface ControlItemConfig {
  scope: keyof controlsType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

function ControlsSetting() {
  const { playerSettings, setPlayerSettings } = useSetting()!;

  let item: ControlItemConfig[] = [
    {
      label: "Download Button",
      description: "Enable Download button",
      scope: "downloadButton",
      icon: <Download className="size-5" />,
    },
    {
      label: "disable seek bar",
      description: "Prevent users from skipping through the video.",
      scope: "disableSeekbar",
      icon: <GripHorizontal className="size-5" />,
    },
    {
      label: "Skip forward",
      description: "Decide how many seconds to skip",
      scope: "skipForward",
      icon: <Infinity className="" />,
    },
    {
      label: "Skip backward",
      description: "Decide how many seconds to skip",
      scope: "skipBackward",
      icon: <Infinity className="" />,
    },
    {
      label: "Controls",
      description: "Allow users to cast the video to other devices.",
      scope: "showControls",
      icon: <ChartBarDecreasing className="" />,
    },
    {
      label: "fullscreen",
      description: "Show fullscreen button",
      scope: "fullScreen",
      icon: <FullscreenIcon className="" />,
    },
    {
      label: "volume",
      description: "Show volume control",
      scope: "volume",
      icon: <Volume1 className="" />,
    },
    {
      label: "playback rate",
      description: "Button for Controlling video speed",
      scope: "playbackRate",
      icon: <SoapDispenserDroplet className="" />,
    },
  ];

  const handleControlChange = (key: keyof controlsType, value: boolean) => {
    setPlayerSettings((prev) => ({
      ...prev,
      controls: {
        ...prev.controls,
        [key]: value,
      },
    }));
  };

  return (
    <div className="w-full h-full ">
      <div className="flex flex-col gap-2 md:gap-2 px-3 pt-2 pb-1">
        <div className="heading">
          <h3 className="font-heading font-semibold text-md lg:text-md tracking-wide">
            Controls Setting
          </h3>
        </div>
        <div className="w-full flex flex-col gap-2 md:gap-3">
          {item.map((e) => (
            <ItemRow
              checked={playerSettings.controls[e.scope]}
              key={e.label}
              label={e.label}
              description={e.description}
              onChange={(checked) => handleControlChange(e.scope, checked)}
              icon={e.icon}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ControlsSetting;
