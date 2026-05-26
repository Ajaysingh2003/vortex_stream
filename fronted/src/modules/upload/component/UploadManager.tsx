import { Button } from "@/components/ui/button";
import { ThumbnailUploadWorker } from "@/modules/console/component/ThumbnailUploadWorker";
import { UploadCard } from "@/modules/console/component/UploadCard";
import { generateId } from "@/utils/utils";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp } from "lucide-react";
import React, { useCallback, useMemo, useRef, useState } from "react";

type UploadStatus =
  | "queued"
  | "uploading"
  | "paused"
  | "done"
  | "error"
  | "cancelled"
  | "TRANSCODING";

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
  thumbnailRemoteUrl?: string;
}

interface UploadTypes {
  items: UploadItem[];
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
}

function UploadMangager({
  items,
  onCancel,
  onPause,
  onRemove,
  onResume,
  onRetry,
}: UploadTypes) {
  const [open, setOpen] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const activeItems = items.filter(
    (i) => !["done", "cancelled", "TRANSCODING"].includes(i.status),
  );

  const overallPercentage = useMemo(() => {
    if (items.length === 0) return 0;

    // Sum up all uploaded bytes and all total file sizes
    const totalUploaded = items.reduce(
      (acc, item) => acc + item.uploadedBytes,
      0,
    );
    const totalSize = items.reduce((acc, item) => acc + item.file.size, 0);

    if (totalSize === 0) return 0;

    return Math.round((totalUploaded / totalSize) * 100);
  }, [items]);

  const isCurrentlyUploading = items.find((e) => e.status != "done");

  // console.log(uploadQueue, "909");

  return (
    <>

      {activeItems.length > 0 && (
        <div className="  fixed  w-full max-w-sm lg:max-w-128  shadow-sm rounded-[10px] shadow-black/28 bg-[#fafafa]  bottom-6 -translate-x-1/2 left-[50%]  overflow-hidden">
          <div className="bg-[#f7f7f7] border-b border-[#eee] py-2 px-4 w-full flex justify-between items-center">
            <p className=" capitalize text-md font-normal text-[#040404] leading-6  text-nowrap   tracking-wide">
              Uploading -{" "}
              <span className="font-semibold text-sm">
                {overallPercentage}%
              </span>
            </p>
            <Button
              onClick={() => setOpen((e) => !e)}
              className="w-fit bg-transparent text-black border-none outline-none hover:bg-transparent"
            >
              {open ? <ArrowDown /> : <ArrowUp />}
            </Button>
          </div>

          {open && (
            <div className="w-full h-full px-4">
              {activeItems.length > 0 && (
                <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-0.5">
                  {activeItems.map((item) => (
                    <UploadCard
                      key={item.id}
                      item={item}
                      onPause={onPause}
                      onResume={onResume}
                      onRetry={onRetry}
                      onCancel={onCancel}
                      onRemove={onRemove}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

    </>
  );
}

export default UploadMangager;
