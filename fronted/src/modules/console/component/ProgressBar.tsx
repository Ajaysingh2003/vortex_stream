type UploadStatus =
  | "queued"
  | "uploading"
  | "paused"
  | "done"
  | "error"
  | "cancelled"
  | "TRANSCODING"

export const ProgressBar = ({
  progress,
  status,
}: {
  progress: number;
  status: UploadStatus;
}) => {
  const colorMap: Record<UploadStatus, string> = {
    queued: "bg-slate-300",
    uploading: "bg-gradient-to-r from-violet-500 to-fuchsia-500",
    paused: "bg-amber-400",
    done: "bg-emerald-500",
    error: "bg-red-500",
    cancelled: "bg-slate-300",
    TRANSCODING: "bg-slate-400",
  };

  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 ${colorMap[status]} ${
          status === "uploading" ? "animate-pulse" : ""
        }`}
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
      />
    </div>
  );
};
