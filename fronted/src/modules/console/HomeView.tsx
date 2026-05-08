"use client";
import { Upload } from "lucide-react";
import React from "react";
import UploadFile from "./component/UploadFile";

function HomeView() {
  return (
    <div className="px-4 py-6">
      <div>
        <iframe
          loading="lazy"
          title="Gumlet video player"
          src="https://play.gumlet.io/embed/69c913251f1dc34da87504b9"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen;"
        ></iframe>
      </div>
      <UploadFile />
    </div>
  );
}

export default HomeView;
