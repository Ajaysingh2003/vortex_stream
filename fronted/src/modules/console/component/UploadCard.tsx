import { formatBytes, formatTime, getFileExtension } from "@/utils/utils";
import { AlertCircle, CheckCircle2, Clock, Pause, Play, RotateCcw, Trash2, Wifi, WifiOff, X } from "lucide-react";
import { ProgressBar } from "./ProgressBar";

type UploadStatus =
  | "queued"
  | "uploading"
  | "paused"
  | "done"
  | "error"
  | "cancelled"
  | "TRANSCODING"

interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  uploadedBytes: number;
  speed: number;
  eta: number;
  errorMessage?: string;
  key?: string;
  startedAt?: number;
  xhr?: XMLHttpRequest;
  chunkOffset: number;
}



export const UploadCard = ({
  item,
  onPause,
  onResume,
  onRetry,
  onCancel,
  onRemove,
}: {
  item: UploadItem;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
}) => {
  const ext = getFileExtension(item.file.name);
  const isActive = item.status === "uploading";
  const isPaused = item.status === "paused";
  const isDone = item.status === "done";
  const isError = item.status === "error";
  const isQueued = item.status === "queued";
  const isCancelled = item.status === "cancelled";

  const statusLabel: Record<UploadStatus, string> = {
    queued: "Queued",
    uploading: "Uploading…",
    paused: "Paused",
    done: "Complete",
    error: "Failed",
    cancelled: "Cancelled",
    TRANSCODING:  "TRANSCODING",
  };

  const statusColor: Record<UploadStatus, string> = {
    queued: "text-slate-400",
    uploading: "text-violet-600",
    paused: "text-amber-500",
    done: "text-emerald-600",
    error: "text-red-500",
    cancelled: "text-slate-400",
    TRANSCODING:"text-slate-600"
  };

  return (
    <li
      className={`
        group relative flex flex-col gap-2 p-4 rounded-2xl border
        transition-all duration-200
        ${isDone ? "bg-emerald-50/60 border-emerald-100" : ""}
        ${isError ? "bg-red-50/60 border-red-100" : ""}
        ${isActive ? "bg-violet-50/40 border-violet-100 shadow-sm shadow-violet-100" : ""}
        ${isPaused ? "bg-amber-50/40 border-amber-100" : ""}
        ${isQueued || isCancelled ? "bg-slate-50 border-slate-100" : ""}
      `}
    >
      <div className="flex items-start gap-3">
        {/* File type badge */}
        <div
          className={`
          flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold tracking-wide
          ${isDone ? "bg-emerald-100 text-emerald-700" : ""}
          ${isError ? "bg-red-100 text-red-600" : ""}
          ${isActive ? "bg-violet-100 text-violet-700" : ""}
          ${isPaused ? "bg-amber-100 text-amber-700" : ""}
          ${isQueued || isCancelled ? "bg-slate-100 text-slate-500" : ""}
        `}
        >
          {ext}
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
            {item.file.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-slate-400">
              {formatBytes(item.file.size)}
            </span>
            {isActive && item.speed > 0 && (
              <>
                <span className="text-slate-200">·</span>
                <span className="text-[11px] text-violet-500 font-medium flex items-center gap-1">
                  <Wifi className="w-3 h-3" />
                  {formatBytes(item.speed)}/s
                </span>
                <span className="text-slate-200">·</span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(item.eta)}
                </span>
              </>
            )}
            {isPaused && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <WifiOff className="w-3 h-3" />
                {formatBytes(item.uploadedBytes)} uploaded
              </span>
            )}
          </div>
        </div>

        {/* Status + Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-[11px] font-semibold ${statusColor[item.status]}`}>
            {statusLabel[item.status]}
          </span>

          {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          {isError && <AlertCircle className="w-4 h-4 text-red-500" />}

          {isActive && (
            <button
              type="button"
              onClick={() => onPause(item.id)}
              className="p-1.5 rounded-lg bg-white border border-amber-200 text-amber-500 hover:bg-amber-50 transition-colors"
              title="Pause"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          )}

          {isPaused && (
            <button
              type="button"
              onClick={() => onResume(item.id)}
              className="p-1.5 rounded-lg bg-white border border-violet-200 text-violet-600 hover:bg-violet-50 transition-colors"
              title="Resume"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}

          {isError && (
            <button
              type="button"
              onClick={() => onRetry(item.id)}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              title="Retry"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {(isActive || isPaused || isQueued) && (
            <button
              type="button"
              onClick={() => onCancel(item.id)}
              className="p-1.5 rounded-lg bg-white border border-red-100 text-red-400 hover:bg-red-50 transition-colors"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {(isDone || isError || isCancelled) && (
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="p-1.5 rounded-lg bg-white border border-slate-100 text-slate-400 hover:bg-slate-50 transition-colors"
              title="Remove"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      {!isDone && !isCancelled && (
        <div className="space-y-1">
          <ProgressBar progress={item.progress} status={item.status} />
          {(isActive || isPaused) && (
            <div className="flex justify-between">
              <span className="text-[10px] text-slate-400">
                {formatBytes(item.uploadedBytes)} / {formatBytes(item.file.size)}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {Math.round(item.progress)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {isError && item.errorMessage && (
        <p className="text-[11px] text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
          {item.errorMessage}
        </p>
      )}
    </li>
  );
};
