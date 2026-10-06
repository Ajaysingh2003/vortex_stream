"use client";

import React from "react";
import ItemRow from "./ItemRow";
import ColorPickerPopover from "./ColorPickerPopover";
import LogoModal from "./LogoModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PictureInPicture2,
  Clock,
  Captions,
  Play,
  Repeat,
  Volume2,
  Maximize2,
  Sun,
  Moon,
  Sparkles,
  SlidersHorizontal,
  Minus,
  EyeOff,
} from "lucide-react";
import { useSetting } from "./Settings";
import { brandingType, controlsType, generalType } from "@/modules/types";

export default function PlayerTab() {
  const { playerSettings, setPlayerSettings } = useSetting();

  const handleGeneralChange = (key: keyof generalType, value: boolean) => {
    setPlayerSettings((prev) => ({
      ...prev,
      general: {
        ...prev.general,
        [key]: value,
      },
    }));
  };

  const handleControlChange = (key: keyof controlsType, value: boolean) => {
    setPlayerSettings((prev) => ({
      ...prev,
      controls: {
        ...prev.controls,
        [key]: value,
      },
    }));
  };

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

  // Determine current theme preset
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

  // Determine controls mode
  const controlsMode = !playerSettings.controls.showControls
    ? "hidden"
    : playerSettings.controls.disableSeekbar
      ? "minimal"
      : "standard";

  const handleControlsModeChange = (mode: string) => {
    if (mode === "hidden") {
      handleControlChange("showControls", false);
    } else if (mode === "minimal") {
      setPlayerSettings((prev) => ({
        ...prev,
        controls: {
          ...prev.controls,
          showControls: true,
          disableSeekbar: true,
        },
      }));
    } else {
      setPlayerSettings((prev) => ({
        ...prev,
        controls: {
          ...prev.controls,
          showControls: true,
          disableSeekbar: false,
        },
      }));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ---------------- Playback Section ---------------- */}
      <section className="flex flex-col">
        <h4 className="font-heading font-semibold text-[13px] text-zinc-900 dark:text-zinc-100 tracking-tight mb-2 px-1">
          Playback
        </h4>

        <div className="flex flex-col">
          <ItemRow
            label="Picture in Picture"
            icon={<PictureInPicture2 className="size-4" />}
            checked={playerSettings.controls.pipButton}
            onChange={(checked) => handleControlChange("pipButton", checked)}
          />

          <ItemRow
            label="Playback speed"
            icon={<Clock className="size-4" />}
            checked={playerSettings.controls.playbackRate}
            onChange={(checked) => handleControlChange("playbackRate", checked)}
          />

          <ItemRow
            label="Captions / Subtitles"
            icon={<Captions className="size-4" />}
            checked={playerSettings.general.captions}
            onChange={(checked) => handleGeneralChange("captions", checked)}
          />

          <ItemRow
            label="Autoplay"
            icon={<Play className="size-4" />}
            checked={playerSettings.general.autoplay}
            onChange={(checked) => handleGeneralChange("autoplay", checked)}
          />

          <ItemRow
            label="Loop playback"
            icon={<Repeat className="size-4" />}
            checked={playerSettings.general.loop}
            onChange={(checked) => handleGeneralChange("loop", checked)}
          />

          <ItemRow
            label="Volume control"
            icon={<Volume2 className="size-4" />}
            checked={playerSettings.controls.volume}
            onChange={(checked) => handleControlChange("volume", checked)}
          />

          <ItemRow
            label="Fullscreen"
            icon={<Maximize2 className="size-4" />}
            checked={playerSettings.controls.fullScreen}
            onChange={(checked) => handleControlChange("fullScreen", checked)}
          />
        </div>
      </section>

      {/* ---------------- Appearance Section ---------------- */}
      <section className="flex flex-col">
        <h4 className="font-heading font-semibold text-[13px] text-zinc-900 dark:text-zinc-100 tracking-tight mb-3 px-1">
          Appearance
        </h4>

        <div className="flex flex-col gap-3 px-1">
          {/* Theme Row */}
          <div className="flex items-center justify-between">
            <span className="font-subheading text-[13px] font-medium text-zinc-700 dark:text-zinc-200">
              Theme
            </span>
            <Select value={currentTheme} onValueChange={handleThemeChange}>
              <SelectTrigger className="h-8.5 w-32 rounded-lg border border-border/70 bg-background/80 px-2.5 text-xs font-medium text-foreground shadow-2xs backdrop-blur-sm transition-all hover:border-border hover:bg-muted/40 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20">
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent
                align="end"
                className="min-w-[8.5rem] overflow-hidden rounded-xl border border-border/80 bg-popover/95 p-1 shadow-lg backdrop-blur-md"
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

          {/* Accent Color Row */}
          <div className="flex items-center justify-between">
            <span className="font-subheading text-[13px] font-medium text-zinc-700 dark:text-zinc-200">
              Accent color
            </span>
            <ColorPickerPopover
              color={playerSettings.branding.accentColor}
              onChange={(hex) => handleBrandingChange("accentColor", hex)}
            />
          </div>

          {/* Controls Mode Row */}
          <div className="flex items-center justify-between">
            <span className="font-subheading text-[13px] font-medium text-zinc-700 dark:text-zinc-200">
              Controls
            </span>
            <Select value={controlsMode} onValueChange={handleControlsModeChange}>
              <SelectTrigger className="h-8.5 w-32 rounded-lg border border-border/70 bg-background/80 px-2.5 text-xs font-medium text-foreground shadow-2xs backdrop-blur-sm transition-all hover:border-border hover:bg-muted/40 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20 capitalize">
                <SelectValue placeholder="Controls" />
              </SelectTrigger>
              <SelectContent
                align="end"
                className="min-w-[8.5rem] overflow-hidden rounded-xl border border-border/80 bg-popover/95 p-1 shadow-lg backdrop-blur-md"
              >
                <SelectItem
                  value="standard"
                  className="flex cursor-pointer items-center gap-2 rounded-lg py-1.5 pl-2 pr-2 text-xs font-medium transition-colors "
                >
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                    <span>Standard</span>
                  </div>
                </SelectItem>
                <SelectItem
                  value="minimal"
                  className="flex cursor-pointer items-center gap-2 rounded-lg py-1.5 pl-2 pr-2 text-xs font-medium transition-colors "
                >
                  <div className="flex items-center gap-2">
                    <Minus className="size-3.5 text-muted-foreground" />
                    <span>Minimal</span>
                  </div>
                </SelectItem>
                <SelectItem
                  value="hidden"
                  className="flex cursor-pointer items-center gap-2 rounded-lg py-1.5 pl-2 pr-2 text-xs font-medium transition-colors "
                >
                  <div className="flex items-center gap-2">
                    <EyeOff className="size-3.5 text-muted-foreground" />
                    <span>Hidden</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logo Row */}
          <div className="flex items-center justify-between">
            <span className="font-subheading text-[13px] font-medium text-zinc-700 dark:text-zinc-200">
              Logo (optional)
            </span>
            <LogoModal
              branding={playerSettings.branding}
              onChange={handleBrandingChange}
            />
          </div>
        </div>
      </section>
    </div>
  );
}