"use client";
import React from "react";
import { useLibraryFilters } from "@/lib/useLibraryFilters";
import VideoSettingType from "@/modules/video/component/VideoSettingType";
import { VideoProvider } from "@/modules/video/context/VideoContext";

function layout({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useLibraryFilters();

  console.log(filters.limit,987)
  return (
    <VideoProvider>
      <div className="w-full min-h-full">
        <div className="w-full min-h-full gap-4 md:gap-8 grid grid-cols-1 md:grid-cols-[320px_1fr] lg:grid-cols-[360px_1fr]">
          {/* Left Side (Sidebar) - Order 2 on mobile (below content), Order 1 on desktop (left) */}
          <div className="w-full relative order-2 md:order-1">
            <div className="w-full md:sticky md:top-[4.5rem] md:h-[calc(100vh-6rem)] md:flex md:items-center md:justify-center">
              <div className="w-full max-w-[360px] mx-auto bg-[#f9f9f9] rounded-2xl overflow-y-auto scroll-bar shadow-sm zp-4 zsm:p-5 md:max-h-[calc(100vh-8rem)]">
                <VideoSettingType type={filters.setting_scope} />
              </div>
            </div>
          </div>

          {/* Right Side (Main Content) - Order 1 on mobile (on top/first), Order 2 on desktop (right) */}
          <div className="w-full min-w-0 order-1 md:order-2">
            {children}
          </div>
        </div>
      </div>
    </VideoProvider>
  );
}

export default layout;
