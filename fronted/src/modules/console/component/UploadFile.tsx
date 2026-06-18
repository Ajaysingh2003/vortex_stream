// "use client";

// import { Upload } from "lucide-react";
// import React, { useCallback, useRef, useState } from "react";
// import { useTRPC } from "@/trpc/client";
// import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
// import UploadMangager from "@/modules/upload/component/UploadManager";
// import { generateId, getVideoDuration } from "@/utils/utils";
// import toast from "react-hot-toast";
// import { useConsoleContext } from "../context/ConsoleContext";
// import { googleAbortMap } from "@/modules/upload/component/ConnectGoogleDrive";
// import { UploadItem, UserType, WorkspaceType } from "@/modules/types";
// import { startUpload as startUploadFn } from "@/modules/upload/funcions/upload";
// import axios from "axios";
// import { Button } from "@/components/ui/button";

// function uploadFileXHR(
//   file: File,
//   uploadUrl: string,
//   offset: number,
//   onProgress: (loaded: number, speed: number, eta: number) => void,
//   onDone: () => void,
//   onError: (msg: string) => void,
// ): XMLHttpRequest {
//   const xhr = new XMLHttpRequest();
//   let lastLoaded = 0;
//   let lastTime = Date.now();

//   xhr.upload.addEventListener("progress", (e) => {
//     if (!e.lengthComputable) return;
//     const now = Date.now();
//     const dt = (now - lastTime) / 1000;
//     const loaded = offset + e.loaded;
//     const speed = dt > 0 ? (e.loaded - lastLoaded) / dt : 0;
//     const remaining = file.size - loaded;
//     const eta = speed > 0 ? remaining / speed : Infinity;

//     lastLoaded = e.loaded;
//     lastTime = now;
//     onProgress(loaded, speed, eta);
//   });

//   xhr.addEventListener("load", () => {
//     if (xhr.status >= 200 && xhr.status < 300) {
//       onDone();
//     } else {
//       onError(`Upload failed with status: ${xhr.status}`);
//     }
//   });

//   xhr.addEventListener("error", () => onError("Network error occurred"));

//   const blob = file.slice(offset);
//   xhr.open("PUT", uploadUrl);
//   xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
//   xhr.send(blob);
//   return xhr;
// }

// function UploadFile() {
//   const trpc = useTRPC();
//   const { data: user } = useSuspenseQuery(trpc.user.profile.queryOptions());

//   const userDataType = user as UserType;
//   // console.log(user,"hogrider")
//   const { items, setItems } = useConsoleContext()!;
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const [globalError, setGlobalError] = useState<string | null>(null);
//   const xhrMapRef = useRef<Map<string, XMLHttpRequest>>(new Map());

//   const startProcessing = useMutation(
//     trpc.upload.startProcessing.mutationOptions({
//       onSuccess: () => toast.success("Video is in Queue."),
//       onError: (err) => toast.error(err.message),
//     }),
//   );

//   const createVideo = useMutation(
//     trpc.upload.createVideo.mutationOptions({
//       onSuccess: async (data) => {
//         console.log(data,"yturyru23")
//         await startProcessing.mutateAsync({ id: data.data.id });
//       },
//     }),
//   );

//   const { data: workspace } = useSuspenseQuery(
//     trpc.user.getWorkspace.queryOptions(),
//   );
//   const workspaceData = workspace as WorkspaceType;

//   // console.log(workspaceData,"jsw999")
//   const updateItem = useCallback(
//     (id: string, patch: Partial<UploadItem>) => {
//       setItems((prev) =>
//         prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
//       );
//     },
//     [setItems],
//   );

//   const startUpload = useCallback(
//     (item: UploadItem, uploadUrl: string, key: string, offset = 0) => {
//       updateItem(item.id, {
//         status: "uploading",
//         startedAt: Date.now(),
//         key,
//         chunkOffset: offset,
//       });

//       console.log(item,"hgfdsa87")

//       const xhr = uploadFileXHR(
//         item.file,
//         uploadUrl,
//         offset,
//         (loaded, speed, eta) => {
//           const progress = (loaded / item.file.size) * 100;
//           updateItem(item.id, {
//             uploadedBytes: loaded,
//             progress,
//             speed,
//             eta,
//           });
//         },
//         async () => {
//           xhrMapRef.current.delete(item.id);
//           updateItem(item.id, {
//             status: "TRANSCODING",
//             progress: 100,
//             uploadedBytes: item.file.size,
//             speed: 0,
//             eta: 0,
//           });
//           console.log(item,key,offset,"hgfdsa88")
//           if (key) {
//             console.log(item, "leena");
//             await createVideo.mutateAsync({
//               worskspaceId: workspaceData.id,
//               videoKey: key,
//               title: item.file.name,
//               duration: item.file.duration ?? 0,
//               status: "PENDING",
//               userId: userDataType?.id,
//               size: item.file.size,
//             });
//           }
//         },
//         (msg) => {
//           xhrMapRef.current.delete(item.id);
//           updateItem(item.id, {
//             status: "error",
//             errorMessage: msg,
//             speed: 0,
//           });
//         },
//       );

//       xhrMapRef.current.set(item.id, xhr);
//     },
//     [updateItem, userDataType?.id, createVideo],
//   );

//   const mutate = useMutation(trpc.upload.getSignedUrl.mutationOptions());

//   const addFiles = useCallback(
//     async (fileList: FileList, trackId: string) => {
//       setGlobalError(null);
//       const incoming = Array.from(fileList);

//       // Filter out files that are already actively processing in our UI array list
//       const existingNames = new Set(
//         items.map((i) => `${i.file.name}-${i.file.size}`),
//       );
//       const newFiles = incoming.filter(
//         (f) => !existingNames.has(`${f.name}-${f.size}`),
//       );

//       if (newFiles.length === 0) {
//         if (fileInputRef.current) fileInputRef.current.value = "";
//         return;
//       }

//       const newItems: UploadItem[] = newFiles.map((file) => ({
//         id: trackId,
//         file,
//         duration: 0,
//         status: "queued",
//         progress: 0,
//         uploadedBytes: 0,
//         speed: 0,
//         eta: Infinity,
//         chunkOffset: 0,
//         uploadType: "google-drive",
//       }));

//       setItems((prev) => [...prev, ...newItems]);

//       // 💡 THE GOLDEN FIX: Reset the input element's tracker string to empty right after pushing to state!
//       // This forces the DOM to read future duplicate selections as an authentic change event sequence.
//       if (fileInputRef.current) {
//         fileInputRef.current.value = "";
//       }

//       let urls;
//       try {
//         const payload = newFiles.map((f) => ({
//           name: f.name,
//           type: f.type,
//           size: f.size,
//         }));
//         const res = await mutate.mutateAsync(payload);
//         urls = res.files;
//       } catch (err: any) {
//         newItems.forEach((item) =>
//           updateItem(item.id, {
//             status: "error",
//             errorMessage: "Failed to get upload URL. Please retry.",
//           }),
//         );
//         setGlobalError(
//           "Could not connect to the server. Check your connection.",
//         );
//         return;
//       }

//       newFiles.forEach((item, idx) => {
//         const urlResult = urls[idx];
//         const correspondingCreatedItem = newItems[idx];
//         if (!urlResult || !correspondingCreatedItem) return;

//         startUpload(
//           correspondingCreatedItem,
//           urlResult.UploadUrl,
//           urlResult.Key,
//         );
//       });
//     },
//     [items, mutate, startUpload, updateItem, setItems],
//   );

//   const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const fileList = e.target.files;
//     if (!fileList || fileList.length === 0) return;
//     const targetFile = fileList[0] as any;
//     const trackID = generateId();
//     addFiles(fileList, trackID);
//     console.log("before duration");
//     console.log(fileList, targetFile, "sparkles");
//     const duration = await getVideoDuration(targetFile);
//     targetFile.duration = duration;
//     console.log(duration, "xlxl23");
//   };
  

//   const handlePause = useCallback(
//     (id: string) => {
//       const googleController = googleAbortMap.get(id);
//       if (googleController) {
//         googleController.abort();
//         googleAbortMap.delete(id);
//       }

//       const xhr = xhrMapRef.current.get(id);
//       if (xhr) {
//         xhr.abort();
//         xhrMapRef.current.delete(id);
//       }

//       setItems((prev) =>
//         prev.map((item) =>
//           item.id === id
//             ? { ...item, status: "paused", speed: 0, eta: 0 }
//             : item,
//         ),
//       );
//     },
//     [setItems],
//   );

//   const handleResume = useCallback(
//     async (id: string) => {
//       const item = items.find((i) => i.id === id);
//       if (!item || !item.key) return;

//       let urls;
//       try {
//         const res = await mutate.mutateAsync([
//           { name: item.file.name, type: item.file.type, size: item.file.size },
//         ]);
//         urls = res.files;
//       } catch {
//         updateItem(id, {
//           status: "error",
//           errorMessage: "Failed to refresh upload URL.",
//         });
//         return;
//       }

//       const freshController = new AbortController();
//       googleAbortMap.set(id, freshController);

//       try {
//         updateItem(item.id, { status: "uploading" });

//         await startUploadFn({
//           trackID: id,
//           item: item,
//           uploadUrl: urls[0].UploadUrl,
//           offset: item.uploadedBytes,
//           controller: freshController,
//           onProgressThrottled: ({ progress, uploadedBytes, speed, eta }) => {
//             updateItem(item.id, {
//               uploadedBytes,
//               progress,
//               speed,
//               eta,
//             });
//           },
//         });

//         googleAbortMap.delete(id);

//         updateItem(item.id, {
//           status: "TRANSCODING",
//           progress: 100,
//           uploadedBytes: item.file.size,
//           speed: 0,
//           eta: 0,
//         });

//         if (urls[0].Key) {
//           await createVideo.mutateAsync({
//             worskspaceId: workspaceData.id,
//             duration: item.file.duration ?? 0,
//             videoKey: urls[0].Key,
//             title: item.file.name,
//             status: "PENDING",
//             userId: userDataType?.id,
//             size: item.file.size,
//           });
//         }
//       } catch (error: any) {
//         googleAbortMap.delete(id);
//         if (axios.isCancel(error) || freshController.signal.aborted) {
//           console.log("Upload cleanly interrupted via pause.");
//           return;
//         }

//         updateItem(item.id, {
//           status: "error",
//           errorMessage: error?.message || "R2 stream connection rejected.",
//           speed: 0,
//           eta: 0,
//         });
//       }
//     },
//     [items, mutate, updateItem, userDataType?.id, createVideo],
//   );

//   const handleRetry = useCallback(
//     async (id: string) => {
//       const item = items.find((i) => i.id === id);
//       if (!item) return;

//       updateItem(id, {
//         status: "queued",
//         progress: 0,
//         uploadedBytes: 0,
//         errorMessage: undefined,
//         chunkOffset: 0,
//       });

//       let urls;
//       try {
//         const res = await mutate.mutateAsync([
//           { name: item.file.name, type: item.file.type, size: item.file.size },
//         ]);
//         urls = res.files;
//       } catch {
//         updateItem(id, {
//           status: "error",
//           errorMessage: "Failed to get upload URL.",
//         });
//         return;
//       }

//       startUpload(item, urls[0].UploadUrl, urls[0].Key, 0);
//     },
//     [items, mutate, startUpload, updateItem],
//   );

//   const handleCancel = useCallback(
//     (id: string) => {
//       const googleController = googleAbortMap.get(id);
//       if (googleController) {
//         googleController.abort();
//         googleAbortMap.delete(id);
//       }

//       const xhr = xhrMapRef.current.get(id);
//       if (xhr) {
//         xhr.abort();
//         xhrMapRef.current.delete(id);
//       }

//       setItems((prev) => prev.filter((i) => i.id !== id));
//     },
//     [setItems],
//   );

//   return (
//     <div className="w-full h-full">
//       <UploadMangager
//         items={items}
//         onPause={handlePause}
//         onRemove={handleCancel} // Wired up to cancel structural connections safely
//         onCancel={handleCancel}
//         onRetry={handleRetry}
//         onResume={handleResume}
//       />
//       <label htmlFor="upload-file">
//         {/* <div className="max-w-64 bg-[#f4f4f4] rounded-lg px-4 py-1 flex items-center gap-4 cursor-pointer hover:bg-blue-100/30">
//           <Upload className="bg-[#edeff2] size-8 px-2 rounded-lg" />
//           <div className="flex flex-col gap-1 ">
//             <h2 className="text-md text-black font-semibold">Upload</h2>
//           </div>
          
//         </div> */}

//         <div
//           // role="button"
//           className="bg-mutedz text-white border-black/30 border-[0.5px] bg-background-btn text-center rounded-md px-6 h-9 gap-2 flex items-center justify-center font-medium animate cursor-pointer"
//         >
//           <Upload className="size-4" />
//           Upload
//         </div>
//       </label>
//       <input
//         ref={fileInputRef}
//         onChange={handleFilesChange}
//         accept="video/*"
//         multiple
//         type="file"
//         className="hidden"
//         id="upload-file"
//       />
//     </div>
//   );
// }

// export default UploadFile;



// claude

// "use client";
// import { Upload } from "lucide-react";
// import React, { useCallback, useEffect, useRef } from "react";
// import { useTRPC } from "@/trpc/client";
// import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
// import UploadMangager from "@/modules/upload/component/UploadManager";
// import { generateId, getVideoDuration } from "@/utils/utils";
// import toast from "react-hot-toast";
// import { useConsoleContext } from "../context/ConsoleContext";
// import { googleAbortMap } from "@/modules/upload/component/ConnectGoogleDrive";
// import { UploadItem, UserType, WorkspaceType } from "@/modules/types";

// function uploadFileXHR(
//   file: File,
//   uploadUrl: string,
//   offset: number,
//   onProgress: (loaded: number, speed: number, eta: number) => void,
//   onDone: () => void,
//   onError: (msg: string) => void,
// ): XMLHttpRequest {
//   const xhr = new XMLHttpRequest();
//   let lastLoaded = 0;
//   let lastTime = Date.now();

//   xhr.upload.addEventListener("progress", (e) => {
//     if (!e.lengthComputable) return;
//     const now = Date.now();
//     const dt = (now - lastTime) / 1000;
//     const loaded = offset + e.loaded;
//     const speed = dt > 0 ? (e.loaded - lastLoaded) / dt : 0;
//     const remaining = file.size - loaded;
//     const eta = speed > 0 ? remaining / speed : Infinity;
//     lastLoaded = e.loaded;
//     lastTime = now;
//     onProgress(loaded, speed, eta);
//   });

//   xhr.addEventListener("load", () => {
//     if (xhr.status >= 200 && xhr.status < 300) onDone();
//     else onError(`Upload failed with status: ${xhr.status}`);
//   });

//   xhr.addEventListener("error", () => onError("Network error occurred"));

//   xhr.open("PUT", uploadUrl);
//   xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
//   xhr.send(file.slice(offset));
//   return xhr;
// }

// function UploadFile() {
//   const trpc = useTRPC();
//   const { data: user } = useSuspenseQuery(trpc.user.profile.queryOptions());
//   const { data: workspace } = useSuspenseQuery(trpc.user.getWorkspace.queryOptions());
//   const { items, setItems } = useConsoleContext()!;

//   const userData = user as UserType;
//   const workspaceData = workspace as WorkspaceType;

//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const xhrMapRef = useRef<Map<string, XMLHttpRequest>>(new Map());

//   // ── single source of truth ref — always fresh, no stale closures ──
//   const itemsRef = useRef<UploadItem[]>(items);
//   useEffect(() => {
//     itemsRef.current = items;
//   }, [items]);

//   // keep stable refs to user/workspace so XHR callbacks don't capture stale values
//   const userDataRef = useRef(userData);
//   const workspaceDataRef = useRef(workspaceData);
//   useEffect(() => { userDataRef.current = userData; }, [userData]);
//   useEffect(() => { workspaceDataRef.current = workspaceData; }, [workspaceData]);

//   // ── mutations ──────────────────────────────────────────────────────────────
//   const getSignedUrl = useMutation(trpc.upload.getSignedUrl.mutationOptions());

//   const startProcessing = useMutation(
//     trpc.upload.startProcessing.mutationOptions({
//       onSuccess: () => toast.success("Video is in queue."),
//       onError: (err) => toast.error(err.message),
//     }),
//   );

//   const createVideo = useMutation(
//     trpc.upload.createVideo.mutationOptions({
//       onSuccess: async (data) => {
//         await startProcessing.mutateAsync({ id: data.data.id });
//       },
//       onError: (err) => toast.error(err.message),
//     }),
//   );

//   // stable refs for mutations so XHR onDone closures always call latest version
//   const createVideoRef = useRef(createVideo.mutateAsync);
//   useEffect(() => { createVideoRef.current = createVideo.mutateAsync; }, [createVideo.mutateAsync]);

//   // ── updateItem — stable, uses functional setter ────────────────────────────
//   const updateItem = useCallback(
//     (id: string, patch: Partial<UploadItem>) => {
//       setItems((prev) =>
//         prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
//       );
//     },
//     [setItems],
//   );

//   const updateItemRef = useRef(updateItem);
//   useEffect(() => { updateItemRef.current = updateItem; }, [updateItem]);

//   // ── startUpload — reads everything from refs, safe inside XHR callbacks ────
//   const startUpload = useCallback(
//     (item: UploadItem, uploadUrl: string, key: string, offset = 0) => {
//       updateItemRef.current(item.id, {
//         status: "uploading",
//         startedAt: Date.now(),
//         key,
//         chunkOffset: offset,
//       });

//       const xhr = uploadFileXHR(
//         item.file,
//         uploadUrl,
//         offset,
//         (loaded, speed, eta) => {
//           updateItemRef.current(item.id, {
//             uploadedBytes: loaded,
//             progress: (loaded / item.file.size) * 100,
//             speed,
//             eta,
//           });
//         },
//         // onDone — reads from refs, never stale
//         async () => {
//           xhrMapRef.current.delete(item.id);
//           updateItemRef.current(item.id, {
//             status: "TRANSCODING",
//             progress: 100,
//             uploadedBytes: item.file.size,
//             speed: 0,
//             eta: 0,
//           });

//           try {
//             await createVideoRef.current({
//               worskspaceId: workspaceDataRef.current.id,
//               videoKey: key,
//               title: item.file.name,
//               duration:  0, 
//               status: "PENDING",
//               userId: userDataRef.current.id,
//               size: item.file.size,
//             });
//           } catch {
//             updateItemRef.current(item.id, {
//               status: "error",
//               errorMessage: "Failed to register video. Please retry.",
//             });
//           }
//         },
//         (msg) => {
//           xhrMapRef.current.delete(item.id);
//           updateItemRef.current(item.id, {
//             status: "error",
//             errorMessage: msg,
//             speed: 0,
//           });
//         },
//       );

//       xhrMapRef.current.set(item.id, xhr);
//     },
//     [], // no deps — reads everything from refs
//   );

//   const startUploadRef = useRef(startUpload);
//   useEffect(() => { startUploadRef.current = startUpload; }, [startUpload]);

//   // ── file input ─────────────────────────────────────────────────────────────
//   const handleFilesChange = useCallback(
//     async (e: React.ChangeEvent<HTMLInputElement>) => {
//       const fileList = e.target.files;
//       if (!fileList || fileList.length === 0) return;

//       if (fileInputRef.current) fileInputRef.current.value = "";

//       const incoming = Array.from(fileList);

//       // deduplicate using ref — always fresh
//       const existingNames = new Set(
//         itemsRef.current.map((i) => `${i.file.name}-${i.file.size}`),
//       );
//       const newFiles = incoming.filter(
//         (f) => !existingNames.has(`${f.name}-${f.size}`),
//       );

//       if (newFiles.length === 0) {
//         toast.error("File already added.");
//         return;
//       }

//       // resolve all durations in parallel before building items
//       const durations = await Promise.all(
//         newFiles.map((f) => getVideoDuration(f).catch(() => 0)),
//       );

//       // build UploadItems with duration correctly on the item itself
//       const newItems: UploadItem[] = newFiles.map((file, idx) => ({
//         id: generateId(),
//         file,
//         duration: durations[idx] as number,
//         status: "queued" as const,
//         progress: 0,
//         uploadedBytes: 0,
//         speed: 0,
//         eta: Infinity,
//         chunkOffset: 0,
//         uploadType: "local" as const,
//       }));

//       // update state + ref together atomically
//       setItems((prev) => {
//         const next = [...prev, ...newItems];
//         itemsRef.current = next;
//         return next;
//       });

//       // fetch signed URLs
//       let urls: { UploadUrl: string; Key: string }[];
//       try {
//         const res = await getSignedUrl.mutateAsync(
//           newFiles.map((f) => ({ name: f.name, type: f.type, size: f.size })),
//         );
//         urls = res.files;
//       } catch {
//         newItems.forEach((item) =>
//           updateItemRef.current(item.id, {
//             status: "error",
//             errorMessage: "Failed to get upload URL. Please retry.",
//           }),
//         );
//         toast.error("Could not connect to server. Check your connection.");
//         return;
//       }

//       // kick off all uploads
//       newItems.forEach((item, idx) => {
//         const urlResult = urls[idx];
//         if (!urlResult) return;
//         startUploadRef.current(item, urlResult.UploadUrl, urlResult.Key);
//       });
//     },
//     [getSignedUrl, setItems],
//   );

//   // ── pause ──────────────────────────────────────────────────────────────────
//   const handlePause = useCallback(
//     (id: string) => {
//       googleAbortMap.get(id)?.abort();
//       googleAbortMap.delete(id);
//       xhrMapRef.current.get(id)?.abort();
//       xhrMapRef.current.delete(id);
//       updateItemRef.current(id, { status: "paused", speed: 0, eta: 0 });
//     },
//     [],
//   );

//   // ── resume ─────────────────────────────────────────────────────────────────
//   const handleResume = useCallback(
//     async (id: string) => {
//       // read from ref — always fresh
//       const item = itemsRef.current.find((i) => i.id === id);
//       if (!item?.key) return;

//       let urls: { UploadUrl: string; Key: string }[];
//       try {
//         const res = await getSignedUrl.mutateAsync([
//           { name: item.file.name, type: item.file.type, size: item.file.size },
//         ]);
//         urls = res.files;
//       } catch {
//         updateItemRef.current(id, {
//           status: "error",
//           errorMessage: "Failed to refresh upload URL.",
//         });
//         return;
//       }

//       startUploadRef.current(item, urls[0].UploadUrl, item.key, item.uploadedBytes);
//     },
//     [getSignedUrl],
//   );

//   // ── retry ──────────────────────────────────────────────────────────────────
//   const handleRetry = useCallback(
//     async (id: string) => {
//       const item = itemsRef.current.find((i) => i.id === id);
//       if (!item) return;

//       updateItemRef.current(id, {
//         status: "queued",
//         progress: 0,
//         uploadedBytes: 0,
//         errorMessage: undefined,
//         chunkOffset: 0,
//       });

//       let urls: { UploadUrl: string; Key: string }[];
//       try {
//         const res = await getSignedUrl.mutateAsync([
//           { name: item.file.name, type: item.file.type, size: item.file.size },
//         ]);
//         urls = res.files;
//       } catch {
//         updateItemRef.current(id, {
//           status: "error",
//           errorMessage: "Failed to get upload URL.",
//         });
//         return;
//       }

//       startUploadRef.current(item, urls[0].UploadUrl, urls[0].Key, 0);
//     },
//     [getSignedUrl],
//   );

//   // ── cancel ─────────────────────────────────────────────────────────────────
//   const handleCancel = useCallback(
//     (id: string) => {
//       googleAbortMap.get(id)?.abort();
//       googleAbortMap.delete(id);
//       xhrMapRef.current.get(id)?.abort();
//       xhrMapRef.current.delete(id);
//       setItems((prev) => {
//         const next = prev.filter((i) => i.id !== id);
//         itemsRef.current = next;
//         return next;
//       });
//     },
//     [setItems],
//   );

//   return (
//     <div className="w-full h-full">
//       <UploadMangager
//         items={items}
//         onPause={handlePause}
//         onRemove={handleCancel}
//         onCancel={handleCancel}
//         onRetry={handleRetry}
//         onResume={handleResume}
//       />

//       <label htmlFor="upload-file" className="cursor-pointer">
//         <div className="bg-mutedz text-white border-black/30 border-[0.5px] bg-background-btn text-center rounded-md px-6 h-9 gap-2 flex items-center justify-center font-medium">
//           <Upload className="size-4" />
//           Upload
//         </div>
//       </label>

//       <input
//         ref={fileInputRef}
//         onChange={handleFilesChange}
//         accept="video/*"
//         multiple
//         type="file"
//         className="hidden"
//         id="upload-file"
//       />
//     </div>
//   );
// }

// export default UploadFile;


"use client";
import { Upload } from "lucide-react";
import React, { useCallback, useEffect, useRef } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import UploadMangager from "@/modules/upload/component/UploadManager";
import { generateId, getVideoDuration } from "@/utils/utils";
import toast from "react-hot-toast";
import { useConsoleContext } from "../context/ConsoleContext";
import { googleAbortMap } from "@/modules/upload/component/ConnectGoogleDrive";
import { UploadItem, UserType, WorkspaceType } from "@/modules/types";

function uploadFileXHR(
  file: File,
  uploadUrl: string,
  offset: number,
  onProgress: (loaded: number, speed: number, eta: number) => void,
  onDone: () => void,
  onError: (msg: string) => void,
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
    if (xhr.status >= 200 && xhr.status < 300) onDone();
    else onError(`Upload failed with status: ${xhr.status}`);
  });

  xhr.addEventListener("error", () => onError("Network error occurred"));

  xhr.open("PUT", uploadUrl);
  xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
  xhr.send(file.slice(offset));
  return xhr;
}

function UploadFile() {
  const trpc = useTRPC();
  const { data: user } = useSuspenseQuery(trpc.user.profile.queryOptions());
  const { data: workspace } = useSuspenseQuery(trpc.user.getWorkspace.queryOptions());
  const { items, setItems } = useConsoleContext()!;

  const userData = user as UserType;
  const workspaceData = workspace as WorkspaceType;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrMapRef = useRef<Map<string, XMLHttpRequest>>(new Map());

  // Single source of truth tracking ref
  const itemsRef = useRef<UploadItem[]>(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const userDataRef = useRef(userData);
  const workspaceDataRef = useRef(workspaceData);
  useEffect(() => { userDataRef.current = userData; }, [userData]);
  useEffect(() => { workspaceDataRef.current = workspaceData; }, [workspaceData]);

  // ── mutations ──────────────────────────────────────────────────────────────
  const getSignedUrl = useMutation(trpc.upload.getSignedUrl.mutationOptions());

  const startProcessing = useMutation(
    trpc.upload.startProcessing.mutationOptions({
      onSuccess: () => toast.success("Video is in queue."),
      onError: (err) => toast.error(err.message),
    }),
  );

  const createVideo = useMutation(
    trpc.upload.createVideo.mutationOptions({
      onSuccess: async (data) => {
        console.log(data,"kira queen")
        await startProcessing.mutateAsync({ id: data.data.id });
      },
      onError: (err) => toast.error(err.message),
    }),
  );

  const createVideoRef = useRef(createVideo.mutateAsync);
  useEffect(() => { createVideoRef.current = createVideo.mutateAsync; }, [createVideo.mutateAsync]);

  const updateItem = useCallback(
    (id: string, patch: Partial<UploadItem>) => {
      setItems((prev) => {
        const updated = prev.map((item) => (item.id === id ? { ...item, ...patch } : item));
        itemsRef.current = updated; // Keep ref hot on updates
        return updated;
      });
    },
    [setItems],
  );
    
  const updateItemRef = useRef(updateItem);
  useEffect(() => { updateItemRef.current = updateItem; }, [updateItem]);

  const startUpload = useCallback(
    (item: UploadItem, uploadUrl: string, key: string, offset = 0) => {
      updateItemRef.current(item.id, {
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
          updateItemRef.current(item.id, {
            uploadedBytes: loaded,
            progress: (loaded / item.file.size) * 100,
            speed,
            eta,
          });
        },
        async () => {
          xhrMapRef.current.delete(item.id);
          updateItemRef.current(item.id, {
            status: "TRANSCODING",
            progress: 100,
            uploadedBytes: item.file.size,
            speed: 0,
            eta: 0,
          });

          try {
            await createVideoRef.current({
              workspaceId: workspaceDataRef.current.id, 
              videoKey: key,
              title: item.file.name,
              duration: item.file.duration || 0, 
              status: "PENDING",
              userId: userDataRef.current.id,
              size: item.file.size,
            });
          } catch {
            updateItemRef.current(item.id, {
              status: "error",
              errorMessage: "Failed to register video. Please retry.",
            });
          }

        },
        (msg) => {
          xhrMapRef.current.delete(item.id);
          updateItemRef.current(item.id, {
            status: "error",
            errorMessage: msg,
            speed: 0,
          });
        },
      );

      xhrMapRef.current.set(item.id, xhr);
    },
    [],
  );

  const startUploadRef = useRef(startUpload);
  useEffect(() => { startUploadRef.current = startUpload; }, [startUpload]);

  // ── file input ─────────────────────────────────────────────────────────────
  const handleFilesChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (!fileList || fileList.length === 0) return;

      // CRITICAL FIX: Convert the live FileList into a static array FIRST.
      // If we mutate the file input value before doing this, the browser immediately 
      // empties the live FileList reference, resulting in 0 files.
      const incoming = Array.from(fileList);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Deduplicate using fresh items state from tracking ref
      const existingNames = new Set(
        itemsRef.current.map((i) => `${i.file.name}-${i.file.size}`),
      );
      
      const newFiles = incoming.filter(
        (f) => !existingNames.has(`${f.name}-${f.size}`),
      );

      if (newFiles.length === 0) {
        toast.error("File already added.");
        return;
      }

      const durations = await Promise.all(
        newFiles.map((f) => getVideoDuration(f).catch(() => 0)),
      );

      const newItems: UploadItem[] = newFiles.map((file, idx) => ({
        id: generateId(),
        file,
        duration: durations[idx] as number,
        status: "queued" as const,
        progress: 0,
        uploadedBytes: 0,
        speed: 0,
        eta: Infinity,
        chunkOffset: 0,
        uploadType: "local" as const,
      }));

      setItems((prev) => {
        const next = [...prev, ...newItems];
        itemsRef.current = next;
        return next;
      });

      let urls: { UploadUrl: string; Key: string }[];
      try {
        const res = await getSignedUrl.mutateAsync(
          newFiles.map((f) => ({ name: f.name, type: f.type, size: f.size })),
        );
        urls = res.files;
      } catch {
        newItems.forEach((item) =>
          updateItemRef.current(item.id, {
            status: "error",
            errorMessage: "Failed to get upload URL. Please retry.",
          }),
        );
        toast.error("Could not connect to server. Check your connection.");
        return;
      }

      newItems.forEach((item, idx) => {
        const urlResult = urls[idx];
        if (!urlResult) return;
        startUploadRef.current(item, urlResult.UploadUrl, urlResult.Key);
      });
    },
    [getSignedUrl, setItems],
  );

  // ── actions ────────────────────────────────────────────────────────────────
  const handlePause = useCallback((id: string) => {
    googleAbortMap.get(id)?.abort();
    googleAbortMap.delete(id);
    xhrMapRef.current.get(id)?.abort();
    xhrMapRef.current.delete(id);
    updateItemRef.current(id, { status: "paused", speed: 0, eta: 0 });
  }, []);

  const handleResume = useCallback(async (id: string) => {
    const item = itemsRef.current.find((i) => i.id === id);
    if (!item?.key) return;

    let urls: { UploadUrl: string; Key: string }[];
    try {
      const res = await getSignedUrl.mutateAsync([
        { name: item.file.name, type: item.file.type, size: item.file.size },
      ]);
      urls = res.files;
    } catch {
      updateItemRef.current(id, {
        status: "error",
        errorMessage: "Failed to refresh upload URL.",
      });
      return;
    }

    startUploadRef.current(item, urls[0].UploadUrl, item.key, item.uploadedBytes);
  }, [getSignedUrl]);

  const handleRetry = useCallback(async (id: string) => {
    const item = itemsRef.current.find((i) => i.id === id);
    if (!item) return;

    updateItemRef.current(id, {
      status: "queued",
      progress: 0,
      uploadedBytes: 0,
      errorMessage: undefined,
      chunkOffset: 0,
    });

    let urls: { UploadUrl: string; Key: string }[];
    try {
      const res = await getSignedUrl.mutateAsync([
        { name: item.file.name, type: item.file.type, size: item.file.size },
      ]);
      urls = res.files;
    } catch {
      updateItemRef.current(id, {
        status: "error",
        errorMessage: "Failed to get upload URL.",
      });
      return;
    }

    startUploadRef.current(item, urls[0].UploadUrl, urls[0].Key, 0);
  }, [getSignedUrl]);

  const handleCancel = useCallback((id: string) => {
    googleAbortMap.get(id)?.abort();
    googleAbortMap.delete(id);
    xhrMapRef.current.get(id)?.abort();
    xhrMapRef.current.delete(id);
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      itemsRef.current = next;
      return next;
    });
  }, [setItems]);

  return (
    <div className="w-full h-full">
      <UploadMangager
        items={items}
        onPause={handlePause}
        onRemove={handleCancel}
        onCancel={handleCancel}
        onRetry={handleRetry}
        onResume={handleResume}
      />

      <label htmlFor="upload-file" className="cursor-pointer">
        <div className="bg-mutedz text-white border-black/30 border-[0.5px] bg-background-btn text-center rounded-md px-6 h-9 gap-2 flex items-center justify-center font-medium">
          <Upload className="size-4" />
          Upload
        </div>
      </label>

      <input
        ref={fileInputRef}
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