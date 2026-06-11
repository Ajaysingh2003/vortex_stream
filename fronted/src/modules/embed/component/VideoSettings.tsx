import { ChevronLeft, ChevronRight, Settings, Settings2 } from "lucide-react";
import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import CustomVolum from "./CustomSpeed";
import CustomVolume from "./CustomSpeed";
import CustomQuality from "./CustomQuality";
import { Button } from "@/components/ui/button";
import CustomSpeed from "./CustomSpeed";
function VideoSettings({
  iconColor,
  handleSpeedChange,
  handleQualityChange,
}: {
  iconColor: string;
  handleSpeedChange: (e:number) => void;
  handleQualityChange: (e:number) => void;
}) {
  const [selected, setSelected] = useState<"volume" | "quality" | null>();

  return (
    <div className="">
      <Popover>
        <PopoverTrigger asChild>
          <button className="">
            <Settings
              className=" size-4 md:size-5  lg:size-6"
              style={{ color: iconColor }}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align={"start"}
          className="mb-5 max-w-[250px] rounded-md  bg-stone-800 overflow-hidden md:bg-black/80 text-white px-2 py-2 backdrop-blur-md md:max-w-full"
        >
          {selected != null && (
            <PopoverHeader className="w-full border-b pb-0.5 border-stone-400 md:border-stone-600">
              <div className="flex items-center capitalize   gap-4">
                <Button
                  onClick={() => setSelected(null)}
                  className=" bg-transparent tracking-wider  text-md  rounded-md w-fit hover:bg-white/30"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="flex-1">{selected}</span>
              </div>
            </PopoverHeader>
          )}

          {selected == "volume" ? (
            <CustomSpeed handleSpeedChange={handleSpeedChange} />
          ) : selected == "quality" ? (
            <CustomQuality handleQualityChange={handleQualityChange} />
          ) : (
            <div className="flex items-center flex-col gap-0">
              <Button
                className="w-full text-md tracking-wider flex items-center justify-between  rounded-md bg-transparent capitalize hover:bg-white/30"
                onClick={() => setSelected("quality")}
              >
                <span>{" Quality "} </span>
                <span className="flex items-center gap-1">
                  {"Auto "} <ChevronRight className="size-3" />
                </span>
              </Button>
              <Button
                className="w-full text-md tracking-wider flex items-center justify-between  rounded-md bg-transparent capitalize hover:bg-white/30"
                onClick={() => setSelected("volume")}
              >
                <span>{" Volume "}</span>
                <span className="flex items-center gap-1">
                  {"Auto"} <ChevronRight className="size-3" />
                </span>
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default VideoSettings;
