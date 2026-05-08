"use client";
import React from "react";
import UploadFile from "../component/UploadFile";
function VideoPlayerView() {
 
  return (
    <div className="w-full h-full min-h-screen relative">
     
      <div className="px-6 md:px-12 py-8">
        <div className="w-full flex items-center justify-between ">
          
          <h3 className="font-semibold text-md md:text-xl lg:text-2xl">
            Video Player
          </h3>

          <div>
            <UploadFile/>
          </div>

        </div>
      </div>
    </div>
  );
}

export default VideoPlayerView;
