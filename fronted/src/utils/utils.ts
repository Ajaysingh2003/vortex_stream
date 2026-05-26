
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

export const formatTime = (secs: number): string => {
  if (!isFinite(secs) || secs <= 0) return "—";
  if (secs < 60) return `${Math.round(secs)}s`;
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}m ${s}s`;
};

export const generateId = () => Math.random().toString(36).slice(2, 10);

export const getFileExtension = (name: string) =>
  name.split(".").pop()?.toUpperCase() ?? "FILE";



export const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {

    console.log("--- RAW VALUE RECEIVED BY UTILS ---");
    console.log("Type of value:", typeof file);
    console.log("Is instance of File?:", file instanceof File);
    console.log("Is instance of Blob?:", file instanceof Blob);
    console.log("Actual shape:", file);
    console.log("----------------------------------");
    // 1. Create a temporary HTML5 video element container in memory
    const video = document.createElement("video");
    video.preload = "metadata"; // 💡 Tells the browser to only fetch headers (super fast)

    // 2. Create a local object URL from the raw file binary
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    // 3. Listen for the metadata loaded transaction event
    video.onloadedmetadata = () => {
      // Free up the browser memory footprint immediately
      URL.revokeObjectURL(objectUrl);
      resolve(video.duration); // Returns duration in floating-point seconds (e.g., 124.52)
    };

    // Handle parsing errors gracefully
    video.onerror = (error) => {
      URL.revokeObjectURL(objectUrl);
      reject("Failed to parse video metadata pipeline");
    };
  });
};