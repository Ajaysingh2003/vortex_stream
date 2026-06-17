"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";

interface VideoDurationInputProps {
  videoDurationInSeconds: number; // Pass the actual video metadata length (e.g., 185 for 3m 5s)
  onChange?: (seconds: number) => void;
}

export default function VideoDurationInput({ 
  videoDurationInSeconds = 6000, // Default fallback to 10 minutes if meta isn't loaded yet
  onChange 
}: VideoDurationInputProps) {
  const [seconds, setSeconds] = useState<number>(0);

  // Helper function to format seconds into a clean 00:00 visual string for the user
  const formatSecondsToTimestamp = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseFloat(e.target.value) || 0;
    
    // 🚀 CRITICAL CAP: Don't let the user input a timestamp longer than the video itself!
    if (value > videoDurationInSeconds) value = videoDurationInSeconds;
    if (value < 0) value = 0;

    setSeconds(value);
    if (onChange) onChange(value);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[12px] font-semibold text-neutral-700 uppercase tracking-wider">
        Trigger Timestamp
      </label>
      
      <div className="flex items-center gap-2 w-full">
        {/* 1. Range Slider locked to video duration bounds */}
        <input
          type="range"
          min={0}
          max={videoDurationInSeconds}
          value={seconds}
          onChange={handleInputChange}
          className="flex-1 h-1.5 accent-neutral-900 bg-neutral-200 rounded-lg cursor-pointer appearance-none"
        />

        {/* 2. Micro manual input field display box */}
        <div className="relative w-28 shrink-0">
          <Input
            type="number"
            min={0}
            max={videoDurationInSeconds}
            step={1}
            value={seconds}
            onChange={handleInputChange}
            className="pr-12 text-center font-mono rounded-lg h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-400 bg-white pl-1 pointer-events-none">
            sec
          </span>
        </div>
      </div>

      {/* 3. High-readability current marker label */}
      <span className="text-[11px] font-medium text-neutral-400 font-mono">
        Overlay will appear at: <strong className="text-neutral-700">{formatSecondsToTimestamp(seconds)}</strong> / {formatSecondsToTimestamp(videoDurationInSeconds)}
      </span>
    </div>
  );
}