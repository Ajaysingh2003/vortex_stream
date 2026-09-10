"use client";

import React from "react";
import VideoPlayer from "../component/VideoPlayer";
import { VideoAsset } from "@/modules/types";

function EmbedView({ asset }: { asset: VideoAsset }) {
  
  return (
    <div className="relative h-full w-full overflow-hidden bg-transparent">
      <div className="h-full w-full">
        <VideoPlayer asset={asset} />
      </div>
    </div>
  );
}

export default EmbedView;
