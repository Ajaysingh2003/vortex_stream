import { formatBytes, formatTime, getFileExtension } from "@/utils/utils";
import { AlertCircle, CheckCircle2, CirclePause, Clock, Film, Pause, Play, PlayCircle, RotateCcw, Trash2, TvMinimalPlay, Video, Wifi, WifiOff, X } from "lucide-react";
import { ProgressBar } from "./ProgressBar";
import { useVideoThumbnail } from "@/hooks/useVideoThumbnail";
import { useEffect } from "react";
import { error } from "console";
import Image from "next/image";

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

  const { thumbnail , generateThumbnail ,loading} = useVideoThumbnail();


  useEffect(() => {
    if (item.file && item.file.size > 0){
      console.log("Generating thumbnail for", item.file);
      generateThumbnail(item.file,2)

    }

  }, [item.file,generateThumbnail]);

  console.log(item,thumbnail, "item")
  
  const statusColor: Record<UploadStatus, string> = {
    queued: "text-slate-400",
    uploading: "text-red-300",
    paused: "text-amber-500",
    done: "text-emerald-600",
    error: "text-red-500",
    cancelled: "text-slate-400",
    TRANSCODING:"text-slate-600"
  };

  return (
    <li
    
      className={`
        group relative flex flex-col gap-2 p-4 rounded-2xl 
        transition-all duration-200
      `}>
      {/* <Card> */}
  {/* <CardContent> */}
        

<div className="flex items-start gap-3">
       { thumbnail && <Image height={100} width={100} src={thumbnail} alt="Thumbnail" className="flex-shrink-0 size-11 rounded-md object-cover" />}

        <div className="flex items-center justify-center size-10 bg-slate-100 border border-slate-200/30 text-violet-600 rounded-lg">
  <Film className="size-5" strokeWidth={1.5} />
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
                <span className="text-[11px] text-violet-300 font-medium flex items-center gap-1">
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
          {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          {isError && <AlertCircle className="w-4 h-4 text-red-500" />}

          {isActive && (
            <button
              type="button"
              onClick={() => onPause(item.id)}
              className="p-1.5 rounded-md bg-white/50   hover:bg-amber-50 transition-colors"
              title="Pause"
            >
              <Pause className="size-4" strokeWidth={1.5} />
            </button>
          )}

          {isPaused && (
            <button
              type="button"
              onClick={() => onResume(item.id)}
              className="p-1.5 rounded-lg bg-white/50  cursor-pointer  hover:bg-stone-50 transition-colors"
              title="Resume"
            >
              <Play className="size-4 " strokeWidth={1.5} />
            </button>
          )}

          {isError && (
            <button
              type="button"
              onClick={() => onRetry(item.id)}
              className="p-1.5 rounded-lg bg-white/50 border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              title="Retry"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {(isActive || isPaused || isQueued) && (
            <button
              type="button"
              onClick={() => onCancel(item.id)}
              className="p-1.5 rounded-md bg-white/50 hover:bg-white cursor-pointer transition-colors"
              title="Cancel"
            >
              <X className="size-4" strokeWidth={1.5} />
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
        <div className="space-y-1 mt-">
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
  {/* </CardContent>
  <CardFooter>
  </CardFooter> */}
{/* </Card> */}
    </li>
  );
};

