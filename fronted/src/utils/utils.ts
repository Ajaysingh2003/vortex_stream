
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
    const video = document.createElement("video");
    video.preload = "metadata";
    const objectUrl = URL.createObjectURL(file);
    let settled = false;
    const timeoutId = setTimeout(() => finish(0), 15000);

    const cleanup = () => {
      video.onloadedmetadata = null;
      video.ondurationchange = null;
      video.onloadeddata = null;
      video.onerror = null;
      if (timeoutId) clearTimeout(timeoutId);
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
    };

    const finish = (duration: number) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(Number.isFinite(duration) && duration > 0 ? duration : 0);
    };

    const readDuration = () => {
      const duration = video.duration;
      if (Number.isFinite(duration) && duration > 0) {
        finish(duration);
      }
    };

    video.onloadedmetadata = readDuration;
    video.ondurationchange = readDuration;
    video.onloadeddata = readDuration;
    video.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("Failed to parse video metadata"));
    };

    video.src = objectUrl;
  });
};
