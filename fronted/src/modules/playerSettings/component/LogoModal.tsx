"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Image as ImageIcon } from "lucide-react";
import { brandingType } from "@/modules/types";

interface LogoModalProps {
  branding: brandingType;
  onChange: <K extends keyof brandingType>(key: K, value: brandingType[K]) => void;
}

export default function LogoModal({ branding, onChange }: LogoModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-zinc-50 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-zinc-700 dark:text-zinc-200 outline-none"
        >
          <Upload className="size-3.5 text-zinc-400" />
          <span className="font-subheading text-[12px] font-medium tracking-tight">
            {branding.logoUrl ? "Edit logo" : "Upload logo"}
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md p-6 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-zinc-900 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading font-semibold text-base text-zinc-900 dark:text-zinc-100">
            Player Logo Branding
          </DialogTitle>
          <p className="text-xs text-zinc-500">
            Add a watermark logo to appear on your video player.
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Logo URL Input */}
          <div className="flex flex-col gap-1.5">
            <label className="font-subheading text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Logo Image URL
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={branding.logoUrl || ""}
                  onChange={(e) => onChange("logoUrl", e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800/60 text-xs text-zinc-800 dark:text-zinc-200 outline-none focus:border-zinc-400"
                />
              </div>
            </div>
          </div>

          {/* Logo Position */}
          <div className="flex flex-col gap-1.5">
            <label className="font-subheading text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Position
            </label>
            <Select
              value={branding.logoPosition || "top_right"}
              onValueChange={(val) => onChange("logoPosition", val)}
            >
              <SelectTrigger className="h-9 w-full rounded-xl border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800/60 font-subheading text-xs">
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-black/10 dark:border-white/10">
                <SelectItem value="top_right" className="font-subheading text-xs">
                  Top Right
                </SelectItem>
                <SelectItem value="top_left" className="font-subheading text-xs">
                  Top Left
                </SelectItem>
                <SelectItem value="bottom_right" className="font-subheading text-xs">
                  Bottom Right
                </SelectItem>
                <SelectItem value="bottom_left" className="font-subheading text-xs">
                  Bottom Left
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logo Width */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="font-subheading text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Size Width (px)
              </label>
              <span className="font-mono text-xs text-zinc-400">
                {branding.logoWidth || 50}px
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="200"
              step="5"
              value={branding.logoWidth || 50}
              onChange={(e) => onChange("logoWidth", Number(e.target.value))}
              className="w-full accent-[#B3E61D] cursor-pointer"
            />
          </div>

          {/* Preview if URL exists */}
          {branding.logoUrl && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5">
              <div className="size-10 rounded-lg bg-black/10 dark:bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={branding.logoUrl}
                  alt="Logo preview"
                  className="max-h-8 max-w-8 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-subheading text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                  Preview Active
                </span>
                <span className="text-[11px] text-zinc-400 truncate">
                  {branding.logoPosition} • {branding.logoWidth}px
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-8 px-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-subheading text-xs font-medium hover:opacity-90 cursor-pointer"
          >
            Done
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
