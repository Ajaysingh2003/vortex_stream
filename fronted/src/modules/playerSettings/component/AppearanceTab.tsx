"use client";

import React from "react";
import ColorPickerPopover from "./ColorPickerPopover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sun,
  Moon,
  Sparkles,
  ArrowUpRight,
  ArrowUpLeft,
  ArrowDownRight,
  ArrowDownLeft,
} from "lucide-react";
import { useSetting } from "./Settings";
import { brandingType } from "@/modules/types";

export default function AppearanceTab() {
  const { playerSettings, setPlayerSettings } = useSetting();

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

  const currentBg = (playerSettings.branding.backgroundColor || "").toLowerCase();
  const currentTheme =
    currentBg === "#ffffff"
      ? "light"
      : currentBg === "#090d16"
        ? "midnight"
        : "dark";

  const handleThemeChange = (theme: string) => {
    if (theme === "light") {
      setPlayerSettings((prev) => ({
        ...prev,
        branding: {
          ...prev.branding,
          backgroundColor: "#ffffff",
          iconColor: "#18181b",
        },
      }));
    } else if (theme === "midnight") {
      setPlayerSettings((prev) => ({
        ...prev,
        branding: {
          ...prev.branding,
          backgroundColor: "#090d16",
          iconColor: "#f1f5f9",
        },
      }));
    } else {
      setPlayerSettings((prev) => ({
        ...prev,
        branding: {
          ...prev.branding,
          backgroundColor: "#050608",
          iconColor: "#ffffff",
        },
      }));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ---------------- Theme & Colors ---------------- */}
      <section className="flex flex-col">
        <h4 className="font-heading font-semibold text-[13px] text-zinc-900 dark:text-zinc-100 tracking-tight mb-3 px-1">
          Theme & Colors
        </h4>

        <div className="flex flex-col gap-3 px-1">
          {/* Theme Preset */}
          <div className="flex items-center justify-between">
            <span className="font-subheading text-[13px] font-medium text-zinc-700 dark:text-zinc-200">
              Theme Preset
            </span>
            <Select value={currentTheme} onValueChange={handleThemeChange}>
              <SelectTrigger className="h-8.5 w-34 rounded-lg border border-border/70 bg-background/80 px-2.5 text-xs font-medium text-foreground shadow-2xs backdrop-blur-sm transition-all hover:border-border hover:bg-muted/40 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20">
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent
                align="end"
                className="min-w-[9rem] overflow-hidden rounded-xl border border-border/80 bg-popover/95 p-1 shadow-lg backdrop-blur-md"
              >
                <SelectItem
                  value="light"
                  className="flex cursor-pointer items-center gap-2 rounded-lg py-1.5 pl-2 pr-2 text-xs font-medium transition-colors "
                >
                  <div className="flex items-center gap-2">
                    <Sun className="size-3.5 text-amber-500" />
                    <span>Light</span>
                  </div>
                </SelectItem>
                <SelectItem
                  value="dark"
                  className="flex cursor-pointer items-center gap-2 rounded-lg py-1.5 pl-2 pr-2 text-xs font-medium transition-colors "
                >
                  <div className="flex items-center gap-2">
                    <Moon className="size-3.5 text-zinc-400" />
                    <span>Dark</span>
                  </div>
                </SelectItem>
                <SelectItem
                  value="midnight"
                  className="flex cursor-pointer items-center gap-2 rounded-lg py-1.5 pl-2 pr-2 text-xs font-medium transition-colors "
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-3.5 text-indigo-400" />
                    <span>Midnight</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Accent Color */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-subheading text-[13px] font-medium text-zinc-700 dark:text-zinc-200">
                Accent Color
              </span>
              <span className="text-[11px] text-zinc-400">
                Seekbar, buttons, & loading ring
              </span>
            </div>
            <ColorPickerPopover
              color={playerSettings.branding.accentColor}
              onChange={(hex) => handleBrandingChange("accentColor", hex)}
            />
          </div>

          {/* Primary Color */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-subheading text-[13px] font-medium text-zinc-700 dark:text-zinc-200">
                Primary Color
              </span>
              <span className="text-[11px] text-zinc-400">
                Primary highlights & labels
              </span>
            </div>
            <ColorPickerPopover
              color={playerSettings.branding.primaryColor || "#ffffff"}
              onChange={(hex) => handleBrandingChange("primaryColor", hex)}
            />
          </div>

          {/* Icon & Text Color */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-subheading text-[13px] font-medium text-zinc-700 dark:text-zinc-200">
                Icon & Text Color
              </span>
              <span className="text-[11px] text-zinc-400">
                Control icons and timestamp text
              </span>
            </div>
            <ColorPickerPopover
              color={playerSettings.branding.iconColor || "#ffffff"}
              onChange={(hex) => handleBrandingChange("iconColor", hex)}
            />
          </div>

          {/* Background Color */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-subheading text-[13px] font-medium text-zinc-700 dark:text-zinc-200">
                Background Color
              </span>
              <span className="text-[11px] text-zinc-400">
                Bottom bar & player backdrop
              </span>
            </div>
            <ColorPickerPopover
              color={playerSettings.branding.backgroundColor || "#050608"}
              onChange={(hex) => handleBrandingChange("backgroundColor", hex)}
            />
          </div>
        </div>
      </section>

      {/* ---------------- Branding & Logo ---------------- */}
      <section className="flex flex-col">
        <h4 className="font-heading font-semibold text-[13px] text-zinc-900 dark:text-zinc-100 tracking-tight mb-3 px-1">
          Branding & Logo
        </h4>

        <div className="flex flex-col gap-3 px-1">
          {/* Logo URL */}
          <div className="flex flex-col gap-1.5">
            <span className="font-subheading text-[13px] font-medium text-zinc-700 dark:text-zinc-200">
              Logo URL
            </span>
            <input
              type="url"
              placeholder="https://example.com/logo.png"
              value={playerSettings.branding.logoUrl || ""}
              onChange={(e) => handleBrandingChange("logoUrl", e.target.value)}
              className="w-full h-8 px-3 rounded-lg border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800/60 font-subheading text-xs text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-400"
            />
          </div>

          {/* Logo Position */}
          <div className="flex items-center justify-between">
            <span className="font-subheading text-[13px] font-medium text-zinc-700 dark:text-zinc-200">
              Logo Position
            </span>
            <Select
              value={playerSettings.branding.logoPosition || "top_right"}
              onValueChange={(val) => handleBrandingChange("logoPosition", val)}
            >
              <SelectTrigger className="h-8.5 w-36 rounded-lg border border-border/70 bg-background/80 px-2.5 text-xs font-medium text-foreground shadow-2xs backdrop-blur-sm transition-all hover:border-border hover:bg-muted/40 focus:border-emerald-500/40 ">
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent
                align="end"
                className="min-w-[9.5rem] overflow-hidden rounded-xl border border-border/80 bg-popover/95 p-1 shadow-lg backdrop-blur-md"
              >
                <SelectItem
                  value="top_right"
                  className="flex cursor-pointer items-center gap-2 rounded-lg py-1.5 pl-2 pr-2 text-xs font-medium transition-colors "
                >
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="size-3.5 text-muted-foreground" />
                    <span>Top Right</span>
                  </div>
                </SelectItem>
                <SelectItem
                  value="top_left"
                  className="flex cursor-pointer items-center gap-2 rounded-lg py-1.5 pl-2 pr-2 text-xs font-medium transition-colors "
                >
                  <div className="flex items-center gap-2">
                    <ArrowUpLeft className="size-3.5 text-muted-foreground" />
                    <span>Top Left</span>
                  </div>
                </SelectItem>
                <SelectItem
                  value="bottom_right"
                  className="flex cursor-pointer items-center gap-2 rounded-lg py-1.5 pl-2 pr-2 text-xs font-medium transition-colors "
                >
                  <div className="flex items-center gap-2">
                    <ArrowDownRight className="size-3.5 text-muted-foreground" />
                    <span>Bottom Right</span>
                  </div>
                </SelectItem>
                <SelectItem
                  value="bottom_left"
                  className="flex cursor-pointer items-center gap-2 rounded-lg py-1.5 pl-2 pr-2 text-xs font-medium transition-colors "
                >
                  <div className="flex items-center gap-2">
                    <ArrowDownLeft className="size-3.5 text-muted-foreground" />
                    <span>Bottom Left</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logo Width */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-subheading text-[13px] font-medium text-zinc-700 dark:text-zinc-200">
                Logo Width
              </span>
              <span className="text-[11px] text-zinc-400">
                {playerSettings.branding.logoWidth || 50}px
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="200"
              step="5"
              value={playerSettings.branding.logoWidth || 50}
              onChange={(e) => handleBrandingChange("logoWidth", Number(e.target.value))}
              className="w-32 accent-[#B3E61D] cursor-pointer"
            />
          </div>
        </div>
      </section>
    </div>
  );
}