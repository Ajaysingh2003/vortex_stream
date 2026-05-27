import Loader from "@/components/static/Loader";
import { loaderLibrary } from "@/lib/searchParams";
import LibraryView from "@/modules/console/view/LibraryView";
import { WorkspaceType } from "@/modules/types";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import React, { Suspense } from "react";

interface PageProps {
  // Use a clean type layout compatible with Next.js App Router parameters
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function page({ searchParams }: PageProps) {
  // 1. 💡 FIX: Let nuqs resolve the searchParams stream completely in a single pass
  const filters = await loaderLibrary.parse(searchParams);
  

  // 2. 💡 FIX: Pull all values directly from the parsed filters output to avoid consuming the stream twice
  const currentCursor = filters.cursor || "";
  
  console.log(currentCursor,"cursor for page library")
  // Ensure limit is a clean integer. Fallback to a functional page size like 10 or 20 (1 is too small for a grid layout)
  const currentLimit = filters.limit ? Number(filters.limit) : 10; 

  const queryClient = getQueryClient();
  
  // Fetch workspace routing details server-side
  const workspace = await queryClient.fetchQuery(
    trpc.user.getWorkspace.queryOptions(),
  );

  const worksapceData = workspace as WorkspaceType;

  if (worksapceData && worksapceData.id) {
    // Seed your TanStack hydration cache using your synchronized parameters
    void queryClient.prefetchQuery(
      trpc.folder.getRootContent.queryOptions({
        workspaceID: worksapceData.id,
        limit: currentLimit,
        cursor: currentCursor,
      }),
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="w-full h-full">
        {/* 💡 FIX: Passing currentCursor as a layout key forces the Suspense boundary 
            to unmount and show the loader instantly when switching pages/cursors */}
        <Suspense key={currentCursor} fallback={<Loader />}>
          <LibraryView cursor={currentCursor} limit={currentLimit} />
        </Suspense>
      </div>
    </HydrationBoundary>
  );
}

export default page;