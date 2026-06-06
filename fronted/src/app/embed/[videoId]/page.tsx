
import EmbedView from "@/modules/embed/view/EmbedView";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from 'react-error-boundary'
export default async function Page({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;
  const queryClient = getQueryClient();
  // void queryClient.prefetchQuery(
  //   trpc.video.getVideo.queryOptions({
  //     videoId,
  //   }),
  // );

  return (
    // <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="w-full h-full">
       <EmbedView videoId={videoId}/>
      </div>
    // </HydrationBoundary>
  );
}
