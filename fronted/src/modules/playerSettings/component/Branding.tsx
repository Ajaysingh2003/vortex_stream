import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sticker, LayoutTemplate } from "lucide-react";
import React from "react";

import { brandingType, useSetting } from "./Settings";

function Branding() {
  const { playerSettings, setPlayerSettings } = useSetting()!;

  const handleBrandingChange = <K extends keyof brandingType>(
    key: K,
    value: brandingType[K],
  ) => {
    setPlayerSettings((prev) => ({
      ...prev,
      branding: {
        ...prev.branding,
        [key]: value,
      },
    }));
  };

  return (
    <div className="w-full h-full ">
      <div className="flex flex-col gap-2 md:gap-2 px-3 pt-2 pb-1">
        <div className="heading">
          <h3 className="font-heading font-semibold text-md lg:text-md tracking-wide">
            Branding Setting
          </h3>
        </div>
        <div className="w-full flex flex-col gap-2 md:gap-3">
          <section className="w-full border-b-[0.5px] border-stone-200">
            <div className="w-full grid grid-cols-[40px_1fr_auto] pb-3 gap-3">
              <div className="flex items-center justify-center">
                <div className="bg-stone-100  rounded-md px-2 py-2">
                  <Sticker />
                </div>
              </div>
              <div className=" flex items-scenter justify-center  flex-col space-y-0.5 ">
                <h3 className="text-[14px] font-medium text-stone-800 capitalize leading-none">
                  Logo url
                </h3>
                <p className=" capitalize text-stone-500 text-[13px] leading-relaxed">
                  logo for display on the video
                </p>
              </div>
              <div className=" flex items-center justify-center  pr-4">
                <Input
                  value={playerSettings.branding.logoUrl}
                  onChange={(e) =>
                    handleBrandingChange("logoUrl", e.target.value)
                  }
                  type="text"
                  className="w-36 placeholder:text-black h-8 rounded-md shadow-none"
                  placeholder="logo url"
                />
              </div>
            </div>
          </section>
          <section className="w-full border-b-[0.5px] border-stone-200">
            <div className="w-full grid grid-cols-[40px_1fr_auto] pb-3 gap-3">
              <div className="flex items-center justify-center">
                <div className="bg-stone-100  rounded-md px-2 py-2">
                  <LayoutTemplate />
                </div>
              </div>
              <div className=" flex items-scenter justify-center  flex-col space-y-0.5 ">
                <h3 className="text-[14px] font-medium text-stone-800 capitalize leading-none">
                  Logo Position
                </h3>
                <p className=" capitalize text-stone-500 text-[13px] leading-relaxed">
                  logo for display on the video
                </p>
              </div>
              <div className=" flex items-center justify-center  pr-4">
                <Select
                  value={playerSettings.branding.logoPosition}
                  onValueChange={(e) => {
                    handleBrandingChange("logoPosition", e);
                  }}
                >
                  <SelectTrigger className="w-[150px] rounded-md max-h-8">
                    <SelectValue placeholder="Theme" />
                  </SelectTrigger>
                  <SelectContent
                    side="top"
                    sideOffset={64}
                    className="rounded-md  shadow-none"
                  >
                    <SelectGroup className="rounded-md">
                      <SelectItem
                        className="py-1 rounded-md hover:bg-stone-100"
                        value="top_right"
                      >
                        Top Right
                      </SelectItem>
                      <SelectItem
                        className="py-1 rounded-md hover:bg-stone-100"
                        value="top_left"
                      >
                        Top Left
                      </SelectItem>
                      <SelectItem
                        className="py-1 rounded-md hover:bg-stone-100"
                        value="bottom_right"
                      >
                        Bottom Right
                      </SelectItem>
                      <SelectItem
                        className="py-1 rounded-md hover:bg-stone-100"
                        value="bottom_left"
                      >
                        Bottom Left
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
          <section className="w-full border-b-[0.5px] border-stone-200">
            <div className="w-full grid grid-cols-[40px_1fr_auto] pb-3 gap-3">
              <div className="flex items-center justify-center">
                <div className="bg-stone-100  rounded-md px-2 py-2">
                  <Sticker />
                </div>
              </div>
              <div className=" flex items-scenter justify-center  flex-col space-y-0.5 ">
                <h3 className="text-[14px] font-medium text-stone-800 capitalize leading-none">
                  Logo width
                </h3>
                <p className=" capitalize text-stone-500 text-[13px] leading-relaxed">
                  Choose the logo size.
                </p>
              </div>
              <div className=" flex items-center justify-center  pr-4">
                <Input
                  value={playerSettings.branding.logoWidth || ""}
                  onChange={(e) => {
                    const stringValue = e.target.value;
                    const numericValue =
                      stringValue === "" ? 0 : parseInt(stringValue, 10);

                    if (!isNaN(numericValue)) {
                      handleBrandingChange("logoWidth", numericValue);
                    }
                  }}
                  type="number" // Change to number for clean mobile/desktop arrow selection
                  className="w-36 h-8 placeholder:text-stone-400 rounded-md shadow-none focus-visible:ring-indigo-500"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Branding;
