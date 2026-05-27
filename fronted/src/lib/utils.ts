import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDuration = (totalSeconds: number | null | undefined): string => {
  if (totalSeconds === undefined || totalSeconds === null || totalSeconds <= 0) {
    return "-";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  // 💡 Use String.padStart to guarantee two-digit padding (e.g., "02", "09")
  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(seconds).padStart(2, "0");

  // If the video is longer than an hour, append the hour block dynamically
  if (hours > 0) {
    const paddedHours = String(hours).padStart(2, "0");
    return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${paddedMinutes}:${paddedSeconds}`;
};