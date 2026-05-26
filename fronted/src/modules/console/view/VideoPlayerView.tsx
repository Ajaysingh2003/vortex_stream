"use client";
import React from "react";
import UploadFile from "../component/UploadFile";
import ImportVideos from "@/modules/upload/component/ImportVideos";
import TopHeader from "../component/TopHeader";
function VideoPlayerView() {
  return (
    <div className="w-full h-full min-h-screen relative">
      <div className="px-6 md:px-12 py-4 w-full">
        <TopHeader
          Header={"Content Library"}
          Btnchild={
            <div className="flex flex-row gap-3">
              <UploadFile />
            </div>
          }
        />
      </div>
    </div>
  );
}

export default VideoPlayerView;
