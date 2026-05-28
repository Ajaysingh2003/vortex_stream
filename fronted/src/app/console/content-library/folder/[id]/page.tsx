import Loader from "@/components/static/Loader";
import { loaderLibraryFilter } from "@/lib/searchParams";
import FolderContentView from "@/modules/console/view/FolderContentView";
import LibraryView from "@/modules/console/view/LibraryView";
import { WorkspaceType } from "@/modules/types";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import React, { Suspense } from "react";

type PageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function page({ searchParams, params }: PageProps) {
  const { id } = await params;
  const filters = await loaderLibraryFilter.parse(searchParams);

  const currentCursor = filters.cursor || "";
  
  //   console.log(currentCursor, "cursor for page library");
  const currentLimit = filters.limit ? Number(filters.limit) : 10;

  const queryClient = getQueryClient();

  const workspace = await queryClient.fetchQuery(
    trpc.user.getWorkspace.queryOptions(),
  );

  const worksapceData = workspace as WorkspaceType;

  if (worksapceData && worksapceData.id) {
    void queryClient.prefetchQuery(
      trpc.folder.getFolderContent.queryOptions({
        workspaceID: worksapceData.id,
        limit: currentLimit,
        cursor: currentCursor,
        folderID: id,
      }),
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="w-full h-full">
        <Suspense key={currentCursor} fallback={<Loader />}>
          <FolderContentView folderID={id} limit={currentLimit} />
        </Suspense>
      </div>
    </HydrationBoundary>
  );
}

export default page;
