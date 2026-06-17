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

     
    </div>
  );
}

export default HomeView;
