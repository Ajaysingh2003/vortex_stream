import Image from "next/image";
import React from "react";
import { useVideoContext } from "../context/VideoContext";
import PreviewForm from "./PreviewForm";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "next/dist/client/components/navigation";
import { VideoAsset, WorkspaceType } from "@/modules/types";

function FormVideoSection() {
  const trpc = useTRPC();
  const params = useParams();
  const videoId = params.id;

  const { data: workspace } = useSuspenseQuery(
    trpc.user.getWorkspace.queryOptions(),
  );

  const workspaceData = workspace as WorkspaceType;
  const { data } = useSuspenseQuery(
    trpc.video.getVideoFromWorkspace.queryOptions({
      videoId: videoId as string,
      workspaceID: workspaceData?.id,
    }),
  );

  const videoData = data as VideoAsset;
  const thumbnail = process.env.NEXT_PUBLIC_CDN_URL! + videoData?.thumbnail || "/images/default-thumbnail.png";

  const { background, skipForm } = useVideoContext()!;

  return (
    <div className="w-full h-full min-h-screen lg:min-h-[700px]">
      <div className="w-full h-full min-h-screen lg:min-h-[700px] overflow-hidden relative rounded-2xl bg-black">
        {/* 🖼️ Next.js Image layer handling the full covering aspect background */}
        <div className="absolute inset-0 w-full h-full z-0">
          <Image
            unoptimized
            className="w-full h-full object-cover rounded-2xl"
            alt="Video preview background thumbnail"
            src={thumbnail}
            // fill
            height={100}
            width={100}
            sizes="(max-width: 1200px) 100vw"
            priority
          />
        </div>

        {/* 🎨 The Form & Button Interactive Foreground Layer Stack */}
        <div
          style={{ background: background }}
          className="w-full h-full absolute inset-0 z-10 flex flex-col items-center justify-center p-6 rounded-2xl"
        >
          {/* Form wrapper ensures contents can scale naturally */}
          <div className="w-full max-w-xl h-full flex items-center justify-center">
            <PreviewForm />
          </div>

          {/* Skip Button positioned safely at the bottom right anchor boundary */}
          {skipForm && (
            <div className="absolute bottom-4 right-4 z-20">
              <Button className="rounded-lg text-white bg-gray-400/80 hover:bg-gray-500 backdrop-blur-sm capitalize cursor-pointer text-xs lg:text-sm">
                Skip to video
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FormVideoSection;
