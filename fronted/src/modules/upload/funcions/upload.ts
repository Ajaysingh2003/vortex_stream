import { UploadItem } from "@/modules/types";
import { googleAbortMap } from "../component/ConnectGoogleDrive";
import { useMutation } from "@tanstack/react-query";
import { use } from "react";
import { useTRPC } from "@/trpc/client";
import axios from "axios";

interface PipelineArgs {
  trackId: string;
  googleFileId: string;
  accessToken: string;
  fileName: string;
  progress: number;
  item: UploadItem[];
  fileSize: number;
  mimeType: string;
  setItems: React.Dispatch<React.SetStateAction<UploadItem[]>>;
  startUpload: (item: UploadItem, uploadUrl: string, key: string, offset?: number) => void;
}


export async function runGoogleDownloadPipeline({
    trackId,
    googleFileId,
    accessToken,
    fileName,
    progress,
    fileSize,
    item,
    mimeType,
    setItems,

    startUpload
}: PipelineArgs) {
    
    const controller = new AbortController();
  googleAbortMap.set(trackId, controller);

  const updateItem = (patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((item) => (item.id === trackId ? { ...item, ...patch } : item)));
  };
  
  

  try {

    const trpc=useTRPC()

    const presignedUrl = useMutation(
        trpc.upload.getSignedUrl.mutationOptions({}),
      );
      

  const sendMutate = useMutation(
    trpc.upload.uploadFromGoogleDrive.mutationOptions(),
  );
    updateItem({ status: "uploading",uploadType:"google-drive" });

    const videoBinary = await sendMutate.mutateAsync({
      fileId: trackId,
      accessToken: accessToken,
      fileName: fileName,
    });
    
      setItems((prev) =>
        prev.map((item) =>
          item.id == trackId
            ? { ...item, status: "uploading" }
            : item,
        ),
      );

      const videoBlob = videoBinary;

      if (controller.signal.aborted ) return;
      googleAbortMap.delete(trackId);

        const nativeFileObject = new File([videoBlob], fileName, {
            type: "video/mp4",
        });

        const signedUrlPayload = {
        name: nativeFileObject.name,
        size: nativeFileObject.size,
        type: nativeFileObject.type,
      };
      const arr = [signedUrlPayload];

      const url = await presignedUrl.mutateAsync(arr);

      const uploadUrl = url.files[0].UploadUrl;

      const readyItemSnapshot: UploadItem = {
      id: trackId,
      file: nativeFileObject,
      status: "uploading",
      progress: progress,
      uploadedBytes: 0,
      speed: 0,
      eta: 0,
      chunkOffset: 0,
      uploadType: "google-drive",
      googleToken: accessToken,
    };

    const currentItem = item.find((i) => i.id === trackId);

    startUpload(readyItemSnapshot, uploadUrl, trackId, currentItem?.chunkOffset );

  } catch (error) {
    console.log(error, "Error in Google Drive upload pipeline");
    updateItem({ status: "error", errorMessage: "Failed to upload from Google Drive" });
  }
}


// import { UploadItem } from "@/modules/types";

interface ProgressTelemetry {
  progress: number;
  uploadedBytes: number;
  speed: number;
  eta: number;
}

interface OptimizedUploadArgs {
  trackID: string;
  item: UploadItem;
  uploadUrl: string;
  offset?: number; // The byte checkpoint where we should pick up
  controller: AbortController;
  // 💡 EMIT DATA VIA A PURE CALLBACK: No more passing setItems raw down here!
  onProgressThrottled: (data: ProgressTelemetry) => void;
}

export async function startUpload({
  trackID,
  item,
  uploadUrl,
  offset = 0,
  controller,
  onProgressThrottled,
}: OptimizedUploadArgs) {
  const startTime = performance.now();
  let lastCommittedTime = startTime;
  
  const binaryPayload = offset > 0 ? item.file.slice(offset) : item.file;
  const totalOriginalFileSize = item.file.size;
  console.log(`Initiating upload for ${item.file.name} from byte offset ${offset}. Total size: ${totalOriginalFileSize} bytes.`);
  console.log("binary", binaryPayload);

  await axios.put(uploadUrl, binaryPayload, {
    headers: {
      "Content-Type": item.file.type || "application/octet-stream",
    },
    signal: controller.signal,
    onUploadProgress: (progressEvent) => {
      const now = performance.now();
      
      // 💡 FIX 2: Compute math coordinates relative to the WHOLE file scale footprints
      const absoluteLoadedBytes = offset + progressEvent.loaded;
      const progress = Math.round((absoluteLoadedBytes * 100) / totalOriginalFileSize);
      
      const timeElapsed = (now - startTime) / 1000;
      const currentSpeed = timeElapsed > 0 ? progressEvent.loaded / timeElapsed : 0;
      const bytesRemaining = totalOriginalFileSize - absoluteLoadedBytes;
      const currentEta = currentSpeed > 0 ? bytesRemaining / currentSpeed : 0;
      console.log(`testID-777`,item);
      // 💡 FIX 3: Throttle UI update cycles to once every 150ms to prevent frame drops
      // Always let the absolute final packet tick (100%) bypass the timing constraint
      if (now - lastCommittedTime > 150 || absoluteLoadedBytes === totalOriginalFileSize) {
        lastCommittedTime = now;
        console.log(item,"leah jaye")
        onProgressThrottled({
          progress,
          uploadedBytes: absoluteLoadedBytes,
          speed: currentSpeed,
          eta: currentEta,
        });
      }
    },
  });
}