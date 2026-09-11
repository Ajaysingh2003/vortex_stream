import { ChevronLeft, ChevronRight, Settings, Settings2 } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import CustomQuality from "./CustomQuality";
import { Button } from "@/components/ui/button";
import CustomSpeed from "./CustomSpeed";
import { VideoResolutionType } from "@/modules/types";

function VideoSettings({
  isNativeSafari,
  iconColor,
  setSettingOpen,
  currentResolution,
  handleSpeedChange,
  handleQualityChange,
  settingOpen,
  currentSpeed,
}: {
  iconColor: string;
  setSettingOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentResolution: VideoResolutionType | null;
  handleSpeedChange: (e: number) => void;
  handleQualityChange: (e: VideoResolutionType) => void;
  settingOpen: boolean;
  currentSpeed: number;
  isNativeSafari: boolean;
}) {
  const [selected, setSelected] = useState<"speed" | "quality" | null>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const updateContainer = () => {
      const fsEl = (
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement ||
        containerRef.current?.closest(":fullscreen, :-webkit-full-screen") ||
        null
      ) as HTMLElement | null;

      setPortalContainer(fsEl);
    };

    updateContainer();
    document.addEventListener("fullscreenchange", updateContainer);
    document.addEventListener("webkitfullscreenchange", updateContainer);
    document.addEventListener("mozfullscreenchange", updateContainer);
    document.addEventListener("MSFullscreenChange", updateContainer);

    return () => {
      document.removeEventListener("fullscreenchange", updateContainer);
      document.removeEventListener("webkitfullscreenchange", updateContainer);
      document.removeEventListener("mozfullscreenchange", updateContainer);
      document.removeEventListener("MSFullscreenChange", updateContainer);
    };
  }, []);

  // When settings menu is closed, reset selected back to main menu
  useEffect(() => {
    if (!settingOpen) {
      setSelected(null);
    }
  }, [settingOpen]);

  return (
    <div ref={containerRef} className="relative">
      <Popover
        open={settingOpen}
        onOpenChange={(e) => {
          setSettingOpen(e);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Video settings"
            className="flex items-center justify-center p-1 rounded-md hover:bg-white/20 transition-colors cursor-pointer"
          >
            <Settings
              className="size-4 md:size-5 lg:size-6"
              style={{ color: iconColor }}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          sideOffset={12}
          container={portalContainer || undefined}
          className="z-[99999] mb-2 max-w-[250px] rounded-md bg-stone-800 overflow-hidden md:bg-black/90 text-white px-2 py-2 backdrop-blur-md md:max-w-full shadow-2xl border border-white/10"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {selected != null && (
            <PopoverHeader className="w-full border-b pb-0.5 border-stone-400 md:border-stone-600">
              <div className="flex items-center capitalize gap-4">
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(null);
                  }}
                  className="bg-transparent tracking-wider text-md rounded-md w-fit hover:bg-white/30 cursor-pointer"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="flex-1">{selected}</span>
              </div>
            </PopoverHeader>
          )}

          {selected == "speed" ? (
            <CustomSpeed
              currentSpeed={currentSpeed}
              handleSpeedChange={handleSpeedChange}
            />
          ) : selected == "quality" && !isNativeSafari ? (
            <CustomQuality
              currentResolution={currentResolution}
              handleQualityChange={handleQualityChange}
            />
          ) : (
            <div className="flex items-center flex-col gap-0">
              {
               !isNativeSafari &&  <Button
                  type="button"
                  className="w-full text-md tracking-wider flex items-center justify-between rounded-md bg-transparent capitalize hover:bg-white/30 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected("quality");
                  }}
                >
                  <span>{" Quality "} </span>
                  {currentResolution == null && (
                    <span className="flex items-center gap-1">
                      {"Auto "} <ChevronRight className="size-3" />
                    </span>
                  )}
                  {currentResolution != null && (
                    <span className="flex items-center gap-1">
                      {currentResolution.resolution}{" "}
                      <ChevronRight className="size-3" />
                    </span>
                  )}
                </Button>
              }

              <Button
                type="button"
                className="w-full text-md tracking-wider flex items-center justify-between rounded-md bg-transparent capitalize hover:bg-white/30 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected("speed");
                }}
              >
                <span>{" speed "}</span>
                <span className="flex items-center gap-1">
                  {`${currentSpeed}x`} <ChevronRight className="size-3" />
                </span>
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default VideoSettings;
