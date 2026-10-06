"use client";

import React from "react";
import ItemRow from "./ItemRow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Zap,
  ExternalLink,
  GripHorizontal,
  Download,
  RotateCcw,
  RotateCw,
  Mail,
  Globe,
  Ban,
} from "lucide-react";
import { useSetting } from "./Settings";
import { controlsType, generalType, securityType } from "@/modules/types";

export default function AdvancedTab() {
  const { playerSettings, setPlayerSettings } = useSetting();

  const handleSecurityChange = <K extends keyof securityType>(
    key: K,
    value: securityType[K],
  ) => {
    setPlayerSettings((prev) => ({
      ...prev,
      security: {
        ...prev.security,
        [key]: value,
      },
    }));
  };

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

  return (
    <div className="flex flex-col gap-6">
      {/* ---------------- Security & Watermark ---------------- */}
      <section className="flex flex-col">
        <h4 className="font-heading font-semibold text-[13px] text-zinc-900 dark:text-zinc-100 tracking-tight mb-2 px-1">
          Security & Watermark
        </h4>

        <div className="flex flex-col">
          <ItemRow
            label="Watermark overlay"
            description="Display a dynamic watermark over the video"
            icon={<Shield className="size-4" />}
            checked={playerSettings.security.watermarkEnabled}
            onChange={(checked) => handleSecurityChange("watermarkEnabled", checked)}
          />

          <div className="flex items-center justify-between py-2.5 px-1">
            <div className="flex flex-col">
              <span className="font-subheading text-[13px] font-medium text-zinc-700 dark:text-zinc-200">
                Dynamic Watermark
              </span>
              <span className="text-[11px] text-zinc-400">
                Stamp viewer identification on playback
              </span>
            </div>
            <Select
              value={playerSettings.security.watermarkTextType}
              onValueChange={(val: "none" | "viewer_email" | "viewer_ip") =>
                handleSecurityChange("watermarkTextType", val)
              }
            >
              <SelectTrigger className="h-8.5 w-36 rounded-lg border border-border/70 bg-background/80 px-2.5 text-xs font-medium text-foreground shadow-2xs backdrop-blur-sm transition-all hover:border-border hover:bg-muted/40 focus:border-emerald-500/40">
                <SelectValue placeholder="Watermark type" />
              </SelectTrigger>
              <SelectContent
                align="end"
                className="min-w-[9.5rem] overflow-hidden rounded-xl border border-border/80 bg-popover/95 p-1 shadow-lg backdrop-blur-md"
              >
                <SelectItem
                  value="none"
                  className="flex cursor-pointer items-center gap-2 rounded-lg py-1.5 pl-2 pr-2 text-xs font-medium transition-colors "
                >
                  <div className="flex items-center gap-2">
                    <Ban className="size-3.5 text-muted-foreground" />
                    <span>None</span>
                  </div>
                </SelectItem>
                <SelectItem
                  value="viewer_email"
                  className="flex cursor-pointer items-center gap-2 rounded-lg py-1.5 pl-2 pr-2 text-xs font-medium transition-colors "
                >
                  <div className="flex items-center gap-2">
                    <Mail className="size-3.5 text-muted-foreground" />
                    <span>Viewer Email</span>
                  </div>
                </SelectItem>
                <SelectItem
                  value="viewer_ip"
                  className="flex cursor-pointer items-center gap-2 rounded-lg py-1.5 pl-2 pr-2 text-xs font-medium transition-colors "
                >
                  <div className="flex items-center gap-2">
                    <Globe className="size-3.5 text-muted-foreground" />
                    <span>Viewer IP</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 py-2 px-1">
            <span className="font-subheading text-[13px] font-medium text-zinc-700 dark:text-zinc-200">
              Watermark Image URL
            </span>
            <input
              type="url"
              placeholder="https://example.com/watermark.png"
              value={playerSettings.security.watermarkImage || ""}
              onChange={(e) => handleSecurityChange("watermarkImage", e.target.value)}
              className="h-8.5 w-full rounded-lg border border-border/70 bg-background/80 px-3 text-xs text-foreground placeholder:text-muted-foreground shadow-2xs backdrop-blur-sm outline-none transition-all hover:border-border focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>
      </section>

      {/* ---------------- Advanced Playback ---------------- */}
      <section className="flex flex-col">
        <h4 className="font-heading font-semibold text-[13px] text-zinc-900 dark:text-zinc-100 tracking-tight mb-2 px-1">
          Advanced Playback Options
        </h4>

        <div className="flex flex-col">
          <ItemRow
            label="Preload video"
            description="Preload metadata for faster playback start"
            icon={<Zap className="size-4" />}
            checked={playerSettings.general.preload}
            onChange={(checked) => handleGeneralChange("preload", checked)}
          />

          <ItemRow
            label="Call to Action (CTA)"
            description="Enable interactive call-to-action cards"
            icon={<ExternalLink className="size-4" />}
            checked={playerSettings.general.ctaEnabled}
            onChange={(checked) => handleGeneralChange("ctaEnabled", checked)}
          />

          <ItemRow
            label="Disable seekbar"
            description="Prevent viewers from scrubbing through video"
            icon={<GripHorizontal className="size-4" />}
            checked={playerSettings.controls.disableSeekbar}
            onChange={(checked) => handleControlChange("disableSeekbar", checked)}
          />

          <ItemRow
            label="Download button"
            description="Allow viewers to download original video"
            icon={<Download className="size-4" />}
            checked={playerSettings.controls.downloadButton}
            onChange={(checked) => handleControlChange("downloadButton", checked)}
          />

          <ItemRow
            label="Skip backward (10s)"
            icon={<RotateCcw className="size-4" />}
            checked={playerSettings.controls.skipBackward}
            onChange={(checked) => handleControlChange("skipBackward", checked)}
          />

          <ItemRow
            label="Skip forward (10s)"
            icon={<RotateCw className="size-4" />}
            checked={playerSettings.controls.skipForward}
            onChange={(checked) => handleControlChange("skipForward", checked)}
          />
        </div>
      </section>
    </div>
  );
}