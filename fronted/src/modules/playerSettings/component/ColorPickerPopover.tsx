"use client";

import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ColorPickerPopoverProps {
  color: string;
  onChange: (hex: string) => void;
  label?: string;
  className?: string;
}

const PRESET_COLORS = [
  { name: "Lime", hex: "#B3E61D" },
  { name: "Cyan", hex: "#00ADEF" },
  { name: "Purple", hex: "#8B5CF6" },
  { name: "Rose", hex: "#F43F5E" },
  { name: "Amber", hex: "#F59E0B" },
  { name: "Emerald", hex: "#10B981" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Dark", hex: "#050608" },
];

export default function ColorPickerPopover({
  color,
  onChange,
  className,
}: ColorPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const currentColor = color || "#B3E61D";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 h-8 px-2.5 rounded-lg border border-black/[0.08] dark:border-white/[0.08]",
            "bg-zinc-50 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer outline-none",
            className,
          )}
        >
          <span
            className="size-3.5 rounded-[3px] border border-black/15 dark:border-white/15 shrink-0 shadow-xs"
            style={{ backgroundColor: currentColor }}
          />
          <span className="font-subheading text-[12px] font-medium tracking-tight text-zinc-700 dark:text-zinc-200 uppercase">
            {currentColor}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-56 p-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-zinc-900 shadow-xl"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-subheading text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Select Color
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className="size-3.5 rounded-[3px] border border-black/10 dark:border-white/10"
                style={{ backgroundColor: currentColor }}
              />
              <span className="font-mono text-[11px] text-zinc-500 uppercase">
                {currentColor}
              </span>
            </div>
          </div>

          {/* Quick Preset Swatches */}
          <div className="grid grid-cols-4 gap-1.5">
            {PRESET_COLORS.map((preset) => {
              const isSelected =
                currentColor.toLowerCase() === preset.hex.toLowerCase();
              return (
                <button
                  key={preset.hex}
                  type="button"
                  title={preset.name}
                  onClick={() => onChange(preset.hex)}
                  className={cn(
                    "h-6 w-full rounded-md border transition-transform hover:scale-105 cursor-pointer relative",
                    isSelected
                      ? "ring-2 ring-zinc-950 dark:ring-white border-transparent"
                      : "border-black/10 dark:border-white/10",
                  )}
                  style={{ backgroundColor: preset.hex }}
                />
              );
            })}
          </div>

          {/* Custom Color Input */}
          <div className="flex items-center gap-2 pt-1 border-t border-black/[0.06] dark:border-white/[0.06]">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => onChange(e.target.value)}
              className="size-7 rounded-md cursor-pointer border-0 bg-transparent p-0"
            />
            <input
              type="text"
              value={currentColor}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#B3E61D"
              className="flex-1 h-7 px-2 font-mono text-xs rounded-md border border-black/10 dark:border-white/10 bg-transparent text-zinc-800 dark:text-zinc-200 outline-none uppercase"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
