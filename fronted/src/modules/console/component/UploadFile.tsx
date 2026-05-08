"use client";
import { Upload } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
// import UploadUI from "@/modules/upload/component/UploadManager";
import UploadMangager from "@/modules/upload/component/UploadManager";
import { generateId } from "@/utils/utils";
import toast from "react-hot-toast";

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

interface UserDataType {
  id : string
  email:string
  role:string
  createdAt:string
}

function uploadFileXHR(
  file: File,
  uploadUrl: string,
  offset: number,
  onProgress: (loaded: number, speed: number, eta: number) => void,
  onDone: () => void,
  onError: (msg: string) => void
): XMLHttpRequest {
  const xhr = new XMLHttpRequest();
  let lastLoaded = 0;
  let lastTime = Date.now();

  xhr.upload.addEventListener("progress", (e) => {
    if (!e.lengthComputable) return;
    const now = Date.now();
    const dt = (now - lastTime) / 1000;
    const loaded = offset + e.loaded;
    const speed = dt > 0 ? (e.loaded - lastLoaded) / dt : 0;
    const remaining = file.size - loaded;
    const eta = speed > 0 ? remaining / speed : Infinity;
    
    lastLoaded = e.loaded;
    lastTime = now;
    onProgress(loaded, speed, eta);
  });

  xhr.addEventListener("load", () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      onDone();
    } else {
      onError(`Upload failed with status: ${xhr.status}`);
    }
  });

  xhr.addEventListener("error", () => onError("Network error occurred"));

  const blob = file.slice(offset);
  xhr.open("PUT", uploadUrl);
  
  xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

  xhr.send(blob);
  return xhr;
}

function UploadFile() {
    const trpc = useTRPC();

    const {data:user}=useSuspenseQuery(trpc.user.profile.queryOptions())
   
  const [items, setItems] = useState<UploadItem[]>([]);
  
  const [globalError, setGlobalError] = useState<string | null>(null);
  const xhrMapRef = useRef<Map<string, XMLHttpRequest>>(new Map());

  const startProcessing=useMutation(trpc.upload.startProcessing.mutationOptions({
    onSuccess:()=>{
      toast.success("Video is in Queue.")
    },
    onError:(err)=>{
      toast.error(err.message)
    }
  }))
  const updateVideo=useMutation(trpc.upload.updateMetaData.mutationOptions({
    onSuccess:async(data)=>{
      console.log(data,"leah-jaye");
      await startProcessing.mutateAsync({id:data.data.id})
    }
  }))
    const updateItem = useCallback(
      (id: string, patch: Partial<UploadItem>) => {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
        );
      },
      []
    );

    console.log(user,454545)

    const   startUpload = useCallback(
    (item: UploadItem, uploadUrl: string, key: string, offset = 0) => {
      updateItem(item.id, {
        status: "uploading",
        startedAt: Date.now(),
        key,
        chunkOffset: offset,
      });

      const xhr = uploadFileXHR(
        item.file,
        uploadUrl,
        offset,
        (loaded, speed, eta) => {
          const progress = (loaded / item.file.size) * 100;
          updateItem(item.id, {
            uploadedBytes: loaded,
            progress,
            speed,
            eta,
          });
        },
       async () => {
          xhrMapRef.current.delete(item.id);
          updateItem(item.id, {
            status: "TRANSCODING",
            progress: 100,
            uploadedBytes: item.file.size,
            speed: 0,
            eta: 0,
          });
          console.log(user,"logs before item")

          if (key){

            await updateVideo.mutateAsync({
              videoKey:key,
              title:item.file.name,
              status:"PENDING",
              userId:user?.id,
              size:String(item.file.size)
            })
          }

        },
        (msg) => {
          xhrMapRef.current.delete(item.id);
          updateItem(item.id, {
            status: "error",
            errorMessage: msg,
            speed: 0,
          });
        }
      );

      xhrMapRef.current.set(item.id, xhr);
      updateItem(item.id, { xhr });
    },
    [updateItem]
    );

  const mutate = useMutation(trpc.upload.getSignedUrl.mutationOptions({
    onSuccess:(data)=>{
      console.log(data)
    },onError:(err)=>{
      console.log(err)
    }
  }));

  const addFiles = useCallback(
      async (fileList: FileList) => {
        setGlobalError(null);
        const incoming = Array.from(fileList);
        const existingNames = new Set(
          items.map((i) => `${i.file.name}-${i.file.size}`)
        );
        const newFiles = incoming.filter(
          (f) => !existingNames.has(`${f.name}-${f.size}`)
        );
        if (newFiles.length === 0) return;
  
        const newItems: UploadItem[] = newFiles.map((file) => ({
          id: generateId(),
          file,
          status: "queued",
          progress: 0,
          uploadedBytes: 0,
          speed: 0,
          eta: Infinity,
          chunkOffset: 0,
        }));
  
        setItems((prev) => [...prev, ...newItems]);
  
        // Get signed URLs
        let urls;
        try {
          const payload = newFiles.map((f) => ({
            name: f.name,
            type: f.type,
            size: f.size,
          }));
          const res = await mutate.mutateAsync(payload);
          urls = res.files;
        } catch (err: any) {
          newItems.forEach((item) =>
            updateItem(item.id, {
              status: "error",
              errorMessage: "Failed to get upload URL. Please retry.",
            })
          );
          setGlobalError("Could not connect to the server. Check your connection.");
          return;
        }
  
        // Start each upload
        newItems.forEach((item, idx) => {
          const urlResult = urls[idx];
          if (!urlResult) {
            updateItem(item.id, {
              status: "error",
              errorMessage: "No upload URL returned for this file.",
            });
            return;
          }
          startUpload(item, urlResult.UploadUrl, urlResult.Key);
        });
      },
      [items, mutate, startUpload, updateItem]
    );

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  

   e.target.files && addFiles(e.target.files)
   

  };


  const handlePause = useCallback((id: string) => {
    const xhr = xhrMapRef.current.get(id);
    if (xhr) {
      xhr.abort();
      xhrMapRef.current.delete(id);
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "paused", speed: 0 } : item
      )
    );
  }, []);

  // ── Resume ──
  const handleResume = useCallback(
    async (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item || !item.key) return;

      // Re-request signed URL for resume
      let urls;
      try {
        const res = await mutate.mutateAsync([
          { name: item.file.name, type: item.file.type, size: item.file.size },
        ]);
        urls = res.files;
      } catch {
        updateItem(id, {
          status: "error",
          errorMessage: "Failed to refresh upload URL.",
        });
        return;
      }

      startUpload(item, urls[0].UploadUrl, urls[0].Key, item.uploadedBytes);
    },
    [items, mutate, startUpload, updateItem]
  );

  // ── Retry ──
  const handleRetry = useCallback(
    async (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;

      updateItem(id, {
        status: "queued",
        progress: 0,
        uploadedBytes: 0,
        errorMessage: undefined,
        chunkOffset: 0,
      });

      let urls;
      try {
        const res = await mutate.mutateAsync([
          { name: item.file.name, type: item.file.type, size: item.file.size },
        ]);
        urls = res.files;
      } catch {
        updateItem(id, {
          status: "error",
          errorMessage: "Failed to get upload URL.",
        });
        return;
      }

      startUpload(item, urls[0].UploadUrl, urls[0].Key, 0);
    },
    [items, mutate, startUpload, updateItem]
  );

  const handleCancel = useCallback((id: string) => {
    const xhr = xhrMapRef.current.get(id);
    if (xhr) {
      xhr.abort();
      xhrMapRef.current.delete(id);
    }
    updateItem(id, {
      status: "cancelled",
      speed: 0,
      progress: 0,
      uploadedBytes: 0,
    });
  }, [updateItem]);

  // ── Remove ──
  const handleRemove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);


  return (
    <div className="w-full h-full">
      <UploadMangager items={items} onPause={handlePause} onRemove={handleRemove} onCancel={handleCancel} onRetry={handleRetry} onResume={handleResume}/>
      <label htmlFor="upload-file">
        <div className="max-w-64 bg-[#f4f4f4] rounded-lg px-4 py-1 flex items-center gap-4 cursor-pointer hover:bg-blue-100/30">
          <Upload className="bg-[#edeff2] size-8 px-2 rounded-lg" />
          <div className="flex flex-col gap-1 ">
            <h2 className="text-md text-black font-semibold">Upload</h2>
          </div>
        </div>
      </label>
      <input
        onChange={handleFilesChange}
        accept="video/*"
        multiple
        type="file"
        className="hidden"
        id="upload-file"
      />
    </div>
  );
}

export default UploadFile;
