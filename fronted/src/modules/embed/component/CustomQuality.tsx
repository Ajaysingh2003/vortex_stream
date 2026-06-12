import React from "react";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { VideoResolutionType } from "@/modules/types";
import { Check } from "lucide-react";
import { cx } from "class-variance-authority";
function CustomQuality({
  handleQualityChange,
  resolutions,
  currentResolution,
}: {
  handleQualityChange: (e: VideoResolutionType | null) => void;
  resolutions: VideoResolutionType[];
  currentResolution: VideoResolutionType | null;
}) {
  const speed = [0.5, 0.75, 1, 1.25, 1.5, 2];
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
        <Button
          className="w-full text-sm md:text-md tracking-wider flex items-center justify-start cursor-pointer rounded-md bg-transparent hover:bg-white/30"
          onClick={() => handleQualityChange(null)}
        >
          <span className="w-4 flex justify-center">
            {currentResolution == null && <Check className="size-4" />}
          </span>

          <span className="tracking-wider capitalize">Auto</span>
        </Button>
        {resolutions.map((e) => (
          <Button
            key={e.resolution}
            className="w-full text-sm md:text-md tracking-wider flex items-center justify-start cursor-pointer rounded-md bg-transparent hover:bg-white/30"
            onClick={() => handleQualityChange(e)}
          >
            <span className="w-4 flex justify-center">
              {currentResolution?.resolution === e.resolution && (
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
