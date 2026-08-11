import Loader from "@/components/static/Loader";
import {loaderLibraryFilter} from "@/lib/searchParams";
import VideosView from "@/modules/console/view/VideosView";
import FavoritesView from "@/modules/favorite/view/FavoriteView";
import { WorkspaceType } from "@/modules/types";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import React, { Suspense } from "react";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function page({ searchParams }: PageProps) {
  const filters = await loaderLibraryFilter.parse(searchParams)
  

  const currentCursor = filters.cursor || "";
  
  console.log(currentCursor,"cursor for page library")
  const currentLimit = filters.limit ? Number(filters.limit) : 10; 

  const queryClient = getQueryClient();
  
  const workspace = await queryClient.fetchQuery(
    trpc.user.getWorkspace.queryOptions(),
  );

  const worksapceData = workspace as WorkspaceType;

  if (worksapceData && worksapceData.id) {

    await queryClient.prefetchInfiniteQuery(
      trpc.favorite.list.infiniteQueryOptions(
        {
          workspaceID: worksapceData.id,
          limit: currentLimit,
          cursor: currentCursor,
          type: filters.type,
          date: filters.date,
          visibility: filters.visibility,
          sort: filters.sort,
        },
        {
          getNextPageParam: (lastPage) =>
            lastPage.metadata.hasNextPage
              ? lastPage.metadata.nextCursor
              : undefined,
          initialCursor: "",
        },
      ),
    );
    
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="w-full h-full">
        <Suspense key={currentCursor} fallback={<Loader />}>
          <FavoritesView limit={currentLimit} favorite />
        </Suspense>
      </div>
    </HydrationBoundary>
  );
}

export default page;
