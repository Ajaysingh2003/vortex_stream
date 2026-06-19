import { AlignCenter, AlignLeft, AlignRight } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import React, { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sketch } from "@uiw/react-color";
import { useVideoContext } from "../context/VideoContext";

export default function FormStyle() {
  const { layout, setBackground, background, setLayout } = useVideoContext()!;
  const layouts = [
    {
      value: "left" as const,
      label: "Left",
      icon: AlignLeft,
    },
    {
      value: "center" as const,
      label: "Center",
      icon: AlignCenter,
    },
    {
      value: "right" as const,
      label: "Right",
      icon: AlignRight,
    },
  ];

  return (
    <div className="space-y-3 px-2 py-1">
      <div>
        <h3 className="text-sm font-semibold text-neutral-800">
          Form Position
        </h3>
        <p className="mt-1 text-xs text-neutral-500">
          Choose where the form appears on the video.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1">
        {layouts.map((item) => {
          const active = layout === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setLayout(item.value)}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-lg px-1 py-1 transition-all duration-200",
                active
                  ? "bg-white shadow-sm ring-1 ring-neutral-200"
                  : "hover:bg-white/70",
              )}
            >
              <HugeiconsIcon
                icon={item.icon}
                size={15}
                className={active ? "text-neutral-900" : "text-neutral-400"}
              />
            </button>
          );
        })}
      </div>

      <div className="overlays w-full flex items-center justify-between ">
        <div className=" flex items-scenter justify-center  flex-col space-y-0.5 ">
          <h3 className="text-[14px] font-medium text-stone-800 capitalize leading-none">
            Color
          </h3>
          {/* <p className=" capitalize text-stone-500 text-[13px] leading-relaxed">
                  Primary color in Player
                </p> */}
        </div>
        <div className=" flex items-center justify-center  pr-4">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div
                style={{
                  border: "0.5px solid black",
                  background: background,
                }}
                className="rounded-full size-5"
              ></div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full  bg-transparent shadow-none outline-none  flex items-center justify-center">
              <Sketch
                className="m-0"
                // style={{ marginLeft: 20 }}
                color={background}
                onChange={(color) => {
                  setBackground(color.hexa);
                }}
              />
            </DropdownMenuContent>
          </DropdownMenu>

          {/* {playerSettings.branding.primaryColor} */}
        </div>
      </div>
    </div>
  );
}
