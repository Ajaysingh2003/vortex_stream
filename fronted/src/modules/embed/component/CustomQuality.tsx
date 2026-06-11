import React from "react";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
function CustomQuality({
  handleQualityChange,
}: {
  handleQualityChange: (e: number) => void;
}) {
  const speed=[0.5,0.75,1,1.25,1.5,2]
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
        {speed.map((e) => (
          <Button
            className="w-full text-sm md:text-md tracking-wider flex items-center justify-between cursor-pointer  rounded-md bg-transparent capitalize hover:bg-white/30"
            onClick={() => handleQualityChange(e)}
          >
            <span className="tracking-wider capitalize">
              {e == 1 ? "normal" : `${e}x`}
            </span>
          </Button>
        ))}
      </div>
    </motion.div>
  );
}

export default CustomQuality;
