import { Button } from "@/components/ui/button";
import {
  Bolt,
  CarTaxiFront,
  FilePenLine,
  Settings2,
  ShieldEllipsis,
  Subtitles,
  Zap,
} from "lucide-react";
import React, { createContext, useContext, useState } from "react";
import SettingsContent from "./SettingsContent";
import { ColorResult } from "@uiw/react-color";
import { VideoPlayerSettings } from "@/modules/types";

interface PlayerContextType {
  selectedOption: string;
  setSelectOption: (e: string) => void;
  playerSettings: VideoPlayerSettings;
  setPlayerSettings: React.Dispatch<React.SetStateAction<VideoPlayerSettings>>;
}

const settingContext = createContext<PlayerContextType | null>(null);

export function Settings({
  children,
  playerSettings,
  setPlayerSettings,
}: {
  children: React.ReactNode;
  playerSettings: VideoPlayerSettings;
  setPlayerSettings: React.Dispatch<React.SetStateAction<VideoPlayerSettings>>;
}) {
  const [selectedOption, setSelectOption] = useState<string>("general");

  // const [playerSettings,setPlayerSettings]=useState<VideoPlayerSettings>()

  return (
    <settingContext.Provider
      value={{
        selectedOption,
        setSelectOption,
        playerSettings,
        setPlayerSettings,
      }}
    >
      <section className="setting-control h-full grid grid-cols-1 gap-2 md:gap-4 lg:gap-8 md:grid-cols-6">
        {children}
      </section>
    </settingContext.Provider>
  );
}

const Menu = () => {
  const menuContext = useContext(settingContext);

  const items = [
    {
      label: "general",
      icon: <Zap className="size-4" />,
    },
    {
      label: "controls",
      icon: <Bolt className="size-4" />,
    },
    {
      label: "branding",
      icon: <FilePenLine className="size-4" />,
    },
    {
      label: "security",
      icon: <ShieldEllipsis className="size-4" />,
    },
  ];

  const isActive = (label: string) => label == menuContext?.selectedOption;

  const handleChange = (label: string) => menuContext?.setSelectOption(label);

  return (
    <div className="w-full h-full bg-stone-50 col-span-2 border-[1px]a rounded-lg">
      <div className="flex flex-row md:flex-col  gap-2 flex-1">
        {items.map((e) => (
          <div key={e.label}>
            <Button
              onClick={() => handleChange(e.label)}
              variant={"outline"}
              className={`w-full rounded-lg ${isActive(e.label) ? "bg-[#bca3f612] text-black" : "bg-transparent"} px-2 py-2 md:py-2 border-none outline-none font-medium tracking-wide flex font-headinga hover:bg-[#bca3f612] hover:text-stone-800 justify-start md:px-4 gap-2 md:gap-6 cursor-pointer`}
            >
              {e.icon}
              <span className=" capitalize text-sm md:text-md ">{e.label}</span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

const Content = () => {
  const context = useContext(settingContext);

  return (
    <div className="col-span-4    w-full h-full max-h-156  rounded-md">
      <SettingsContent activeOption={context?.selectedOption} />
    </div>
  );
};

Settings.Menu = Menu;
Settings.Content = Content;

export const useSetting = () => {
  const setting = useContext(settingContext);

  return setting;
};
