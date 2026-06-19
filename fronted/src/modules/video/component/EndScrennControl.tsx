import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { endScreenType } from "@/modules/types";
import { useVideoContext } from "../context/VideoContext";
import EndScreenOption from "./EndScreenOption";

function EndScreenControl() {
  const { endScreen, setEndScreen } = useVideoContext()!;

  const endScreenLabels: Record<endScreenType, string> = {
    more_video: "More Videos",
    call_to_action: "Call To Action",
    custom_image: "Custom Image",
    share_button: "Share Button",
    custom_message: "Custom Message",
    empty: "None (Empty)",
  };

  return (
    <div className="w-full h-full">
      <div className="px-2 py-2">
        <Select
          value={endScreen}
          onValueChange={(value) => setEndScreen(value as endScreenType)}
        >
          <SelectTrigger className="w-full bg-transparent focus-visible:ring-0 shadow-none rounded-lg h-10 border border-gray-200 shadow-2xs px-3">
            <SelectValue placeholder="Select end screen type..." />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-lg bg-white  shadow-md">
            <SelectGroup>
              {Object.entries(endScreenLabels).map(([key, label]) => (
                <SelectItem
                  key={key}
                  value={key}
                  className="capitalize text-accent py-1.5  rounded-lg hover:bg-black/5 text-[13px] focus-visible:bg-black/5"
                >
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <div className="w-full mt-2">
                <EndScreenOption />
        </div>
      </div>
    </div>
  );
}

export default EndScreenControl;
