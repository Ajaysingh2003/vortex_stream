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
import { Button } from "@/components/ui/button";

function EndScreenControl() {
  const {
    endScreen,
    setEndScreen,
    setCtaBtnText,
    setCtaBtnUrl,
    setSubCtaTitle,
    setCtaTitle,
    setFacebookUrl,
    setInstagramUrl,
    setLinkedinUrl,

    setMail,
    setXUrl,
    setCustomImagePreview,
    setCustomDescription,
    setCustomTitle,
    setSelectMoreVideo,
  } = useVideoContext()!;

  const endScreenLabels: Record<endScreenType, string> = {
    more_video: "More Videos",
    call_to_action: "Call To Action",
    custom_image: "Custom Image",
    share_button: "Share Button",
    custom_message: "Custom Message",
    empty: "None (Empty)",
  };

  const valueChange = (value: endScreenType) => {
    setSelectMoreVideo([]);

    setCtaTitle("");
    setSubCtaTitle("");
    setCtaBtnText("");
    setCtaBtnUrl("");

    setCustomImagePreview("");

    setXUrl("");
    setFacebookUrl("");
    setInstagramUrl("");
    setLinkedinUrl("");
    setMail("");

    setCustomTitle("");
    setCustomDescription("");

    setEndScreen(value as endScreenType);
  };

  return (
    <div className="w-full h-full">
      <div className="px-4 pt-3 pb-2">
        <h3 className="text-black/80 text-sm font-heading tracking-wide">
          Select End Screen Type
        </h3>
      </div>

      <div className="px-2 py-2">
        <Select
          value={endScreen}
          onValueChange={(value) => valueChange(value as endScreenType)}
        >
          <SelectTrigger className="w-full bg-transparent focus-visible:ring-0  rounded-lg h-10 border border-gray-200 shadow-2xs px-3">
            <SelectValue placeholder="Select end screen type..." />
          </SelectTrigger>
          <SelectContent
            align="center"
            position="popper"
            className="rounded-lg bg-white  shadow-md"
          >
            <SelectGroup>
              {Object.entries(endScreenLabels).map(([key, label]) => (
                <SelectItem
                  key={key}
                  value={key}
                  className="capitalize text-accent py-1.5 focus-within:bg-black/5  rounded-lg hover:bg-black/5 text-[13px] focus-visible:bg-black/5"
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
      <div className="border-t-[1px] py-2 px-2 mt-2 border-black/5">
        <div className="flex justify-end flex-row gap-2 w-full">
          <Button
            // onClick={handleupsertForm}
            // disabled={videoUpsertMutate.isPending}
            className="tracking-wider h-8  bg-main-btn  capitalize px-3 text-xs  font-semibold cursor-pointer border rounded-full md:text-sm transition-all duration-200"
          >
            save
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EndScreenControl;
