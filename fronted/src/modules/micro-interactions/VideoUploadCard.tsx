"use client";

import React, { useState, useEffect } from "react";
import {
  Film,
  Clock1,
} from "lucide-react";
import Image from "next/image";

export default function VideoUploadCard() {

  const totalFileSize = 45840000;
  const uploadedBytes=32558545


  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="w-full text-left select-none p-0.5">
      <li className="group relative flex flex-col gap-3 px-3 py-2 rounded-xl transition-all duration-200 list-none">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center size-10 bg-slate-100 border border-slate-200/30 text-violet-500 rounded-lg">
            <Film className="size-5" strokeWidth={1.5} />
          </div>

          {/* File Meta Core Descriptors */}
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium font-subheading text-slate-700 tracking-wide truncate leading-tight">
              everything_i_wanted_1080p.mp4
            </p>

            <div className="flex items-center gap-1.5  flex-wrap">
              <span className="text-[10px] text-accent tracking-wide font-medium">
                {formatBytes(totalFileSize)}
              </span>

              {
                <>
                  <span className="text-stone-600 select-none">·</span>
                  <span className="text-[10px] justify-center text-stone-600 font-medium flex items-center gap-1">
                    {/* <Internet className="w-3 h-3" /> */}
                    <Image className="size-3" src={"/icon/internet.png"} height={100} width={100} alt="internet" />
                   <span className="text-stone-600 tracking-wide"> {formatBytes(1542000)}/s</span>
                  </span>
                  <span className="text-slate-300 select-none">·</span>
                  <span className="text-[11px] text-stone-600 flex items-center gap-1">
                    <Clock1 className="w-3 h-3" />
                    <span className="tracking-wide">2 mins left`</span>
                   
                  </span>
                </>
              }
            </div>
          </div>
        </div>

        {/* ================= 💡 PROGRESS TRACKING TIMELINE BAR ================= */}
        <div className="space-y-1.5 mt-1">
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all animate-pulse duration-300 ease-out bg-progress-gradient
              }`}
              style={{ width: `${57}%` }} 
            />
          </div>

          {/* Progress Math Data readouts */}
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
            <span>
              {formatBytes(uploadedBytes)} / {formatBytes(totalFileSize)}
            </span>
            <span className={"text-stone-600 font-bold"}>
              {Math.round(57)}%
            </span>
          </div>
        </div>
      </li>
    </div>
  );
}
