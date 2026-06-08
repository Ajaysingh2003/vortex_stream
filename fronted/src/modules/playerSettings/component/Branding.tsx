import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sticker, LayoutTemplate, Pipette, Baseline, SprayCan, Brush, Globe, LayoutDashboard } from "lucide-react";
import React from "react";
import { ColorResult, hsvaToHex, hexToHsva } from "@uiw/react-color";
import { brandingType, useSetting } from "./Settings";
import {
  Slider,
  Sketch,
  Material,
  Colorful,
  Compact,
  Circle,
  Swatch,
  Wheel,
  Block,
  Github,
  Chrome,
} from "@uiw/react-color";
import {
  Alpha,
  Hue,
  ShadeSlider,
  Saturation,
  hsvaToHslaString,
} from "@uiw/react-color";
import {
  EditableInput,
  EditableInputRGBA,
  EditableInputHSLA,
} from "@uiw/react-color";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
                  <Globe className="size-4" />
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
                  <LayoutDashboard className="size-4" />
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
                  <Sticker className="size-4" />
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

          <section className="w-full">
            <div className="w-full grid grid-cols-[40px_1fr_auto] pb-3 gap-3">
              <div className="flex items-center justify-center">
                <div className="bg-stone-100  rounded-md px-2 py-2">
                  <Pipette className="size-4" />
                </div>
              </div>
              <div className=" flex items-scenter justify-center  flex-col space-y-0.5 ">
                <h3 className="text-[14px] font-medium text-stone-800 capitalize leading-none">
                  Primary Color
                </h3>
                <p className=" capitalize text-stone-500 text-[13px] leading-relaxed">
                  Primary color in Player
                </p>
              </div>
              <div className=" flex items-center justify-center  pr-4">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <div
                      style={{
                        background: playerSettings.branding.primaryColor,
                      }}
                      className="rounded-full size-5"
                    ></div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full  bg-transparent shadow-none outline-none  flex items-center justify-center">
                    <Sketch
                      className="m-0"
                      // style={{ marginLeft: 20 }}
                      color={playerSettings.branding.primaryColor}
                      onChange={(color) => {
                        handleBrandingChange("primaryColor", color.hex);
                      }}
                    />
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* {playerSettings.branding.primaryColor} */}
              </div>
            </div>
          </section>

          <section className="w-full">
            <div className="w-full grid grid-cols-[40px_1fr_auto] pb-3 gap-3">
              <div className="flex items-center justify-center">
                <div className="bg-stone-100  rounded-md px-2 py-2">
                  <SprayCan className="size-4" />
                </div>
              </div>
              <div className=" flex items-scenter justify-center  flex-col space-y-0.5 ">
                <h3 className="text-[14px] font-medium text-stone-800 capitalize leading-none">
                  Accent Color
                </h3>
                <p className=" capitalize text-stone-500 text-[13px] leading-relaxed">
                  Accent color in Player
                </p>
              </div>
              <div className=" flex items-center justify-center  pr-4">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <div
                      style={{
                        background: playerSettings.branding.accentColor,
                      }}
                      className="rounded-full size-5"
                    ></div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full  bg-transparent shadow-none outline-none  flex items-center justify-center">
                    <Sketch
                      className="m-0"
                      // style={{ marginLeft: 20 }}
                      color={playerSettings.branding.accentColor}
                      onChange={(color) => {
                        handleBrandingChange("accentColor", color.hex);
                      }}
                    />
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* {playerSettings.branding.primaryColor} */}
              </div>
            </div>
          </section>
          <section className="w-full">
            <div className="w-full grid grid-cols-[40px_1fr_auto] pb-3 gap-3">
              <div className="flex items-center justify-center">
                <div className="bg-stone-100  rounded-md px-2 py-2">
                  <Baseline className="size-4" />
                </div>
              </div>
              <div className=" flex items-scenter justify-center  flex-col space-y-0.5 ">
                <h3 className="text-[14px] font-medium text-stone-800 capitalize leading-none">
                  Text and icon Color
                </h3>
                <p className=" capitalize text-stone-500 text-[13px] leading-relaxed">
                  text color in Player
                </p>
              </div>
              <div className=" flex items-center justify-center  pr-4">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <div
                      style={{
                        background: playerSettings.branding.iconColor,
                      }}
                      className="rounded-full size-5"
                    ></div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full  bg-transparent shadow-none outline-none  flex items-center justify-center">
                    <Sketch
                      className="m-0"
                      // style={{ marginLeft: 20 }}
                      color={playerSettings.branding.accentColor}
                      onChange={(color) => {
                        handleBrandingChange("iconColor", color.hex);
                      }}
                    />
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* {playerSettings.branding.primaryColor} */}
              </div>
            </div>
          </section>

          <section className="w-full">
            <div className="w-full grid grid-cols-[40px_1fr_auto] pb-3 gap-3">
              <div className="flex items-center justify-center">
                <div className="bg-stone-100  rounded-md px-2 py-2">
                  <Brush className="size-4" />
                </div>
              </div>
              <div className=" flex items-scenter justify-center  flex-col space-y-0.5 ">
                <h3 className="text-[14px] font-medium text-stone-800 capitalize leading-none">
                  Background Color
                </h3>
                <p className=" capitalize text-stone-500 text-[13px] leading-relaxed">
                  Background Color in Player
                </p>
              </div>
              <div className=" flex items-center justify-center  pr-4">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <div
                      style={{
                        background: playerSettings.branding.backgroundColor,
                      }}
                      className="rounded-full size-5"
                    ></div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full  bg-transparent shadow-none outline-none  flex items-center justify-center">
                    <Sketch
                      className="m-0"
                      // style={{ marginLeft: 20 }}
                      color={playerSettings.branding.backgroundColor}
                      onChange={(color) => {
                        handleBrandingChange("backgroundColor", color.hex);
                      }}
                    />
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* {playerSettings.branding.primaryColor} */}
              </div>
            </div>
          </section>

          
        </div>
      </div>
    </div>
  );
}

export default Branding;
