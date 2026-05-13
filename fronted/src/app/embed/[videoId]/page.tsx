"use client"
import EmbedView from "@/modules/playerSettings/view/EmbedView";
import { getQueryClient, trpc ,} from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export default async function Page({ params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
    const queryClient=getQueryClient()
   void queryClient.prefetchQuery(trpc.video.getVideo.queryOptions({
          videoId,
        }),);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="p-8">
        <EmbedView videoId={videoId} />
      </div>
    </HydrationBoundary>
  );
}