import { Button } from "@/components/ui/button";
import { useGooglePicker } from "@/hooks/useGooglePicker";
import { useConsoleContext } from "@/modules/console/context/ConsoleContext";
import { GooglePickerFile, UploadItem } from "@/modules/types";
import { useTRPC } from "@/trpc/client";
// import { addFiles } from "@/utils/upload";
import { generateId } from "@/utils/utils";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import Image from "next/image";
import React, { use, useEffect, useState } from "react";
import axios from "axios";

export const googleAbortMap = new Map<string, AbortController>();


function ConnectGoogleDrive() {

  const trackId=generateId()
  
  const trpc = useTRPC();

  const { setItems } = useConsoleContext()!;

  const presignedUrl = useMutation(
    trpc.upload.getSignedUrl.mutationOptions({}),
  );
  
  const sendMutate = useMutation(
    trpc.upload.uploadFromGoogleDrive.mutationOptions(),
  );

  const [pickedFile, setPickedFile] = useState<GooglePickerFile | null>(null);

  const { openPicker } = useGooglePicker(async (file, access_token) => {
    try {
      setPickedFile(file);
    console.log("picked:", file);
    const controller = new AbortController();
  
    googleAbortMap.set(trackId, controller);

    console.log("Generated trackId for upload:", trackId,googleAbortMap.get(trackId));

    const initialPlaceholderItem: UploadItem = {
      id: trackId,
      file: new File([], file.name, { type: "video/mp4" }),
      status: "queued",
      progress: 0,
      uploadedBytes: 0,
      speed: 0,
      startedAt: Date.now(),
      eta: 0,
      chunkOffset: 0,
      uploadType: "google-drive",
    };

    setItems((prev) => [...prev, initialPlaceholderItem]);

    const videoBinary = await sendMutate.mutateAsync({
      fileId: file.id,
      accessToken: access_token,
      fileName: file.name,
    });
    
      setItems((prev) =>
        prev.map((item) =>
          item.id == initialPlaceholderItem.id
            ? { ...item, status: "uploading" }
            : item,
        ),
      );

      const videoBlob = videoBinary;
      const nativeFileObject = new File([videoBlob], file.name, {
        type: "video/mp4",
      });

      setItems((prev) =>
        prev.map((item) =>
          item.id === initialPlaceholderItem.id
            ? { ...item, file: nativeFileObject }
            : item,
        ),
      );

      const signedUrlPayload = {
        name: file.name,
        size: file.sizeBytes,
        type: file.mimeType,
      };
      const arr = [signedUrlPayload];

      const url = await presignedUrl.mutateAsync(arr);

      const uploadUrl = url.files[0].UploadUrl;
      const key = url.files[0].Key;

      console.log("Received presigned URL for upload:", uploadUrl);
      

      const downloadStartaTime = performance.now();

      await axios.put(uploadUrl, nativeFileObject, {
        headers: {
          "Content-Type": file.mimeType,
        },
        signal: controller.signal
        ,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            const currentTime = performance.now();
            console.log(currentTime);

            const timeElapsed = (currentTime - downloadStartaTime) / 1000;
            
            const currentSpeed =
              timeElapsed > 0 ? progressEvent.loaded / timeElapsed : 0;

            console.log("speed bytes/sec:", currentSpeed);
            const bytesRemaining = progressEvent.total - progressEvent.loaded;
            const currentEta =
              currentSpeed > 0 ? bytesRemaining / currentSpeed : 0;
            const percentDone =
              (progressEvent.loaded / progressEvent.total) * 100;
            // const speed=(progressEvent.loaded/timeElapsed)
            // const eta=((progressEvent.total-progressEvent.loaded)/speed)
            setItems((prev) =>
              prev.map((item) =>
                item.id == initialPlaceholderItem.id
                  ? {
                      ...item,
                      progress,
                      status:"uploading",
                      key,
                      eta: currentEta,
                      uploadedBytes: progressEvent.loaded,
                      speed: currentSpeed,
                    }
                  : item,
              ),
            );
          }
        },
      });

      setItems((prev) =>
        prev.map((item) =>
          item.id == initialPlaceholderItem.id
            ? { ...item, status: "TRANSCODING", progress: 100 }
            : item,
        ),
      );
      googleAbortMap.delete(trackId);

      console.log("presigned url:", url);
    } catch (error) {
      if (axios.isCancel(error)) {
      console.log("Google download intentionally cancelled by user.");
      return;
    }
    googleAbortMap.delete(trackId);
      console.error("Error fetching video from Google Drive:", error);
    }

    // console.log('videoBinary:', videoBinary)
    // console.log('access_token in callback:', access_token)
  });

  return (
    <div className="px-6 h-16s w-full space-y-2 ">
      <h3 className="text-md font-semibold font-subheading text-gray-700">
        Connect to Google Drive
      </h3>
      <p className=" text-xs md:text-sm text-stone-500 capitalize">
        To import videos from your Google Drive, please connect your account.
        and give permission to access your files.
      </p>
      <div className="flex items-center justify-center gap-4">
        <Button
          onClick={openPicker}
          variant={"outline"}
          className="px-4 py-2 cursor-pointer  text-gray-800 text-sm font-medium mt-4 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded-md"
        >
          <Image
            src="/intigration/google.png"
            alt="google"
            width={20}
            height={20}
            className="inline-block mr-2"
          />
          Continue with Google
        </Button>
      </div>
    </div>
  );
}

export default ConnectGoogleDrive;
