"use client";

import React from "react";
import VideoPlayer from "../component/VideoPlayer";

function EmbedView({ videoId }: { videoId: string }) {
  
  return (
    <div className="relative h-full w-full overflow-hidden bg-blacka">
      <div className="h-full w-full">
        <VideoPlayer videoId={videoId} />
      </div>
    </div>
  );
}

export default EmbedView;
