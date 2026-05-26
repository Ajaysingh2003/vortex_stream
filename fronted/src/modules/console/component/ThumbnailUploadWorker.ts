// components/ThumbnailUploadWorker.tsx
"use client"

import { useEffect, useState } from "react"
import { useVideoThumbnail } from "@/hooks/useVideoThumbnail"
import { useMutation } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"

interface WorkerProps {
  item: {
    id: string;
    file: File;
    status: string;
  };
  onThumbnailUploaded: (id: string, publicUrl: string) => void;
}

export const ThumbnailUploadWorker = ({ item, onThumbnailUploaded }: WorkerProps) => {
  const [hasStarted, setHasStarted] = useState(false)
  const { thumbnail, generateThumbnail } = useVideoThumbnail()
  
  const trpc = useTRPC()
  const presignedUrlMutate = useMutation(trpc.upload.getSignedUrl.mutationOptions())

  useEffect(() => {
    if (item.file && !hasStarted) {
      setHasStarted(true)
      generateThumbnail(item.file, 2)
    }
  }, [item.file, generateThumbnail, hasStarted])

    const [hasUploadedThumbnail, setHasUploadedThumbnail] = useState(false);

  useEffect(()=>{
    console.log("before check")
    if (!thumbnail || hasUploadedThumbnail) return
    console.log("blob started")
    const handleThumbnailUpload = async () => {
    try {
      setHasUploadedThumbnail(true)

      const response = await fetch(thumbnail);
      const blobData = await response.blob();
      
      // Convert to a formal file metadata construct
      const thumbnailFile = new File([blobData], "thumbnail.jpg", { type: "image/jpeg" });

      const payload=[{name:item.file.name,type:blobData.type,size:blobData.size}]
      
      const presignedUrl =await presignedUrlMutate.mutateAsync(payload)
      const uploadResult = await fetch(presignedUrl.files[0].UploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: thumbnailFile,
      });

      console.log("log23",uploadResult)

      if (!uploadResult.ok) throw new Error("Failed to upload assets to bucket storage engine");

      console.log("Thumbnail permanently stored! Public URL ->", uploadResult);
      
      onThumbnailUploaded(item.id,uploadResult.url)
    } catch (error) {
      console.error("Critical thumbnail synchronization fallback loop triggered:", error);
    }
  };


  handleThumbnailUpload()

  },[thumbnail,hasUploadedThumbnail,item.file.name])

  return null // This component runs entirely in the background with zero UI footprint
}