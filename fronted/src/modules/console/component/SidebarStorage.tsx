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
function SidebarStorage() {
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
                <PricingSection />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div>
          <StorageProgressBar progress={64} limit="1gb" used="634mb" />
        </div>
      </div>
    </div>
  );
}

export default SidebarStorage;
