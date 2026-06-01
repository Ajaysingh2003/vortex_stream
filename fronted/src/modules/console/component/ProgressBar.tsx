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

  return (
    <div className="w-full h-[5px] bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 bg-progress-gradient  ${
          status === "uploading" ? "animate-pulse" : ""
        }`}
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
      />
    </div>
  );
};
