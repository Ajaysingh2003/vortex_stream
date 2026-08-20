import { Button } from "@/components/ui/button";
import React from "react";
import { ProgressBar } from "./ProgressBar";
import StorageProgressBar from "./StorageProgressBar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import PricingSection from "./PricingSection";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { UserDataType, UserSubscriptionType } from "@/modules/types";
import { getMaxGb, getStorageUsagePercent } from "@/lib/config";
function SidebarStorage() {
  const trpc = useTRPC();
  const { data: user } = useSuspenseQuery(trpc.user.profile.queryOptions());
  const { data: planDetails } = useSuspenseQuery(
    trpc.user.getCurrentPlan.queryOptions(),
  );

  const userData = user as UserDataType;

  const planDetailsType = planDetails as UserSubscriptionType;

  const formatStorage = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);

    if (gb < 1) {
      const mb = bytes / (1024 * 1024);
      return `${mb.toFixed(2)}mb`;
    }

    return `${gb.toFixed(2)}gb`;
  };

  const usedStorage = formatStorage(userData.userStorageUsage.usedBytes);

  const maxLimit = getMaxGb(planDetailsType.plan);

  const percent = getStorageUsagePercent(
    userData.userStorageUsage.usedBytes,
    maxLimit,
  );

  return (
    <div className="w-full h-fit">
      <div className="w-full bg-white rounded-xl h-28 flex justify-between flex-col px-4 py-3 shadow-2xs">
        <div className="w-full  flex justify-between items-center">
          <div>
            <h3 className="text-sm font-heading  font-semibold tracking-wide leading-realaxed">
              Storage
            </h3>
          </div>
          <div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-main-btn max-h-8 text-xs py-0  cursor-pointer font-subzheading   tracking-wider">
                  Upgrade
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-xl shadow-2xl w-[95vw] h-[90vh] max-w-[1200px] sm:max-w-[1400px]">
                <DialogTitle>
                  <div className=" flex items-center justify-center w-full">
                    <h3 className="text-2xl md:max-w-164z md:text-4xl tracking-wider font-heading font-semibold text-center">
                      The all-in-one platform <br /> for your Video,{" "}
                      <span className=" italic text-gradient font-bold">
                        at any scale
                      </span>
                    </h3>
                  </div>
                </DialogTitle>
                <PricingSection />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div>
          <StorageProgressBar
            progress={percent}
            limit={`${maxLimit}gb`}
            used={usedStorage}
          />
        </div>
      </div>
    </div>
  );
}

export default SidebarStorage;
