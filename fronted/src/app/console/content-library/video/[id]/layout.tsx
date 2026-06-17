"use client";
import React from "react";
import { useLibraryFilters } from "@/lib/useLibraryFilters";
import VideoSettingType from "@/modules/video/component/VideoSettingType";

function layout({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useLibraryFilters();

  return (
    <div className="w-full min-h-screen">
      <div className="p-6 md:p-8 lg:py-10 lg:px-6 w-full">
        <div className="rounded-md w-full">
          <div className="w-full gap-3 md:gap-6 grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[310px_1fr]">
            {/* Sidebar */}
            <div className="flex items-start justify-start h-full relative">
              <div className="bg-[#f9f9f9] rounded-lg lg:fixed overflow-y-auto shadow-sm pxb-5 max-h-[calc(100vh-6rem)] w-[310px]">
                <VideoSettingType type={filters.setting_scope} />
              </div>
              {/* placeholder to hold grid column width since sidebar is fixed */}
              <div className="hidden lg:block w-[310px] shrink-0" />
            </div>

            {/* Main content */}
            <div className="w-full h-full">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default layout;
