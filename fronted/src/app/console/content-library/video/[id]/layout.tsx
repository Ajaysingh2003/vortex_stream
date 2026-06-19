"use client";
import React from "react";
import { useLibraryFilters } from "@/lib/useLibraryFilters";
import VideoSettingType from "@/modules/video/component/VideoSettingType";
import { VideoProvider } from "@/modules/video/context/VideoContext";

function layout({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useLibraryFilters();

  return (
    <VideoProvider>
      <div className="w-full h-screen max-h-[calc(100dvh-12rem)]">
        <div className="p-3 md:p-8 lg:py-10 lg:px-6 min-h-full  h-full w-full">
          <div className="rounded-md w-full   h-full">
            <div className="w-full   gap-3 md:gap-6 grid grid-cols-1 h-full md:grid-cols-[300px_1fr] lg:grid-cols-[310px_1fr]">
              {/* Sidebar */}
              <div className="flex items-center     justify-center lg:justify-start  h-full relative">
                <div className="bg-[#f9f9f9] rounded-lg lg:fixed overflow-y-auto shadow-sm pxb-5 md:max-h-[calc(100vh-10rem)] w-full lg:w-[310px] ">
                  <VideoSettingType type={filters.setting_scope} />
                </div>
                {/* placeholder to hold grid column width since sidebar is fixed */}
                <div className="hidden lg:block w-full lg:w-[310px] shrink-0" />
              </div>

              {/* Main content */}
              <div className="w-full h-full ">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </VideoProvider>
  );
}

export default layout;
