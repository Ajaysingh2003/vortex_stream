"use client";
import { Upload } from "lucide-react";
import React from "react";
import UploadFile from "./component/UploadFile";

function HomeView() {
  return (
    <div className="px-4 py-6">
      <div>
        <iframe
          className="h-50 border-0"
          loading="lazy"
          title="Gumlet video player"
          src="http://localhost:4000/embed/61e7fb1b-1aeb-4863-b325-ff83d0b63e1d"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen;"
        ></iframe>
      </div>

      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        // value={? 0 }
        // onChange={handleVolumeChange}
        className="cursor-pointer volume-range appearance-none  bg-red-200  p-0 size-3 h-full"
        style={{
          WebkitAppearance: "slider-vertical",
          width: "4px" /* The total height of your slider */,
          // height: "12px",
        }}
      />
    </div>
  );
}

export default HomeView;
