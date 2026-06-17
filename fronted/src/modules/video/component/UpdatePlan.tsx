import { Button } from "@/components/ui/button";
import { StarsIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import React from "react";

function UpdatePlan() {
  return (
    <div className="h-full w-full">
      <div className=" w-full h-full flex items-center justify-center">
        <div className="flex items-center flex-col">
          <div className="flex justify-end flex-col items-center justify-center gap-2 w-full max-w-sm">

            <h3 className="font-heading capitalize text-accent text-lg md:text-lg font-bold leading-snug tracking-tight ">
                Turn Viewers into Leads
            </h3>

            <p className="text-xs md:text-sm text-neutral-500 text-center max-w-xs leading-relaxed mb-1">
             Interactive mid-video forms, email gates, and automated CRM lead syncing are exclusive to our Premium Users infrastructure tier.
            </p>

            <Button
              // onClick={handleApply}
              // disabled={isLoading || !selectedFile}
              className="tracking-wider rounded-xl bg-main-btn capitalize px-4 font-bold cursor-pointer border py-2 md:py-1.5 text-xs transition-all duration-200 flex items-center justify-center gap-2 rounded-"
            >
              <HugeiconsIcon
                width={700}
                className="font-bold "
                icon={StarsIcon}
                size={16}
              />
              Upgrade to Premium
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpdatePlan;
