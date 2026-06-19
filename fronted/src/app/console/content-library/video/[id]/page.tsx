import Loader from "@/components/static/Loader";
import { loaderLibraryFilter } from "@/lib/searchParams";
import FolderContentView from "@/modules/console/view/FolderContentView";
import LibraryView from "@/modules/console/view/LibraryView";
import { WorkspaceType } from "@/modules/types";
import { videoRouter } from "@/modules/video/server/procedures";
import VideoDetailsView from "@/modules/video/view/VideoDetailsView";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import React, { Suspense } from "react";

type PageProps = {
  params: Promise<{
    id: string;
  }>;

  // searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function page({ params }: PageProps) {
  const { id } = await params;

  const queryClient = getQueryClient();

  const workspace = await queryClient.fetchQuery(
    trpc.user.getWorkspace.queryOptions(),
  );

  const worksapceData = workspace as WorkspaceType;

  if (worksapceData && worksapceData.id) {
    void queryClient.prefetchQuery(
      trpc.video.getVideoFromWorkspace.queryOptions({
        workspaceID: worksapceData.id,
        videoId: id,
      }),
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="w-full h-full">
        <Suspense fallback={<Loader />}>
          <VideoDetailsView  />
        </Suspense>
      </div>
    </HydrationBoundary>
  );
}

export default page;
