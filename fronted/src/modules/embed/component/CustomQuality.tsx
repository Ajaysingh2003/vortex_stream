import React from "react";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { VideoResolutionType } from "@/modules/types";
import { Check } from "lucide-react";
import { cx } from "class-variance-authority";
function CustomQuality({
  handleQualityChange,

  currentResolution,
}: {
  handleQualityChange: (e: VideoResolutionType) => void;
  currentResolution: VideoResolutionType | null;
}) {
  // const speed = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const resolutionsData: VideoResolutionType[] = [
    { index:-1,resolution:"Auto"},
    { index: 0, resolution: "360p"},
    { index: 1, resolution: "480p"},
    { index: 2, resolution: "720p"},
    { index: 3, resolution: "1080p"},
  ];
  return (
    <motion.div
      className="px-0"
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      transition={{
        duration: 0.4,
        ease: "backOut",
      }}
    >
      <div className="w-full flex flex-col gap-0">
        {resolutionsData.map((e) => (
          <Button
            key={e.resolution}
            className="w-full text-sm md:text-md tracking-wider flex items-center justify-start cursor-pointer rounded-md bg-transparent hover:bg-white/30"
            onClick={() => handleQualityChange(e)}
          >
            <span className="w-4 flex justify-center">
              {currentResolution?.resolution === e.resolution  && (
                <Check className="size-4" />
              )}
            </span>

            <span className="tracking-wider capitalize">{e.resolution}</span>
          </Button>
        ))}
      </div>
    </motion.div>
  );
}

export default CustomQuality;
