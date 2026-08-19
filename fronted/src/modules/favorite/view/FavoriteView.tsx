"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import {
  WorkspaceType,
  VideoAsset,
} from "@/modules/types";
import { Inbox, Loader2 } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLibraryFilters } from "@/lib/useLibraryFilters";
import { useRouter } from "next/navigation";
import TopHeader from "@/modules/console/component/TopHeader";
import { VideoDataTable } from "@/modules/console/component/VideoDataTable";
import { VideoColumn } from "@/modules/console/component/VideoColumn";
import DropdownFilters from "@/modules/console/component/DropdownFilters";

interface VideosViewProps {
  limit: number;
}

function FavoritesView({ limit }: VideosViewProps) {
  const trpc = useTRPC();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data: workspace } = useSuspenseQuery(
    trpc.user.getWorkspace.queryOptions(),
  );
  const workspacesData = workspace as WorkspaceType;
  const [filters] = useLibraryFilters();

  const listOptions = trpc.favorite.list.infiniteQueryOptions(
    {
      limit,
      cursor: filters.cursor,
      workspaceID: workspacesData.id,
      type: filters.type,
      date: filters.date,
      visibility: filters.visibility,
      sort: filters.sort,
    },
    {
      getNextPageParam: (lastPage) =>
        lastPage.metadata.hasNextPage ? lastPage.metadata.nextCursor : undefined,
      initialCursor: "",
    },
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(listOptions);

  const items: VideoAsset[] = data.pages.flatMap((page) => page.items);



  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // const handleSucess=async()=>{
  //   await queryClient.invalidateQueries(
  //         trpc.folder.getRootContent.queryOptions({
  //            limit,
  //         cursor: "",
  //         workspaceID: workspacesData.id,
  //         }),
  //       );
  // }

const router=useRouter()
const handleRowClick=(row:{id:string})=>{
  console.log("row.id",row.id)
  let url=`/`

  url=`/console/content-library/video/${row.id}`

  router.push(url)
}

const [activeViewMethod] = useState<"list">("list");


  return (
    <div className="w-full h-full min-h-screen relative bg-transparent">
      <div className="px-4 md:px-12 py-4 w-full">
        <div className="flex flex-col gap-6 md:gap-4">
          <TopHeader
            Header="Favorite videos"
            Btnchild={<span className="hidden text-sm text-muted-foreground md:block">Your saved video collection</span>}
          />

          <div className="hidden justify-end md:flex">
            <div className="flex items-center gap-3">
              <DropdownFilters scope="date" label="Date" items={[{ label: "Anytime", filter: "any" }, { label: "Today", filter: "today" }, { label: "Last 7 Days", filter: "this_week" }, { label: "Last 30 Days", filter: "30_days" }]} />
              <DropdownFilters scope="sort" label="Sort" items={[{ label: "Newest", filter: "created_desc" }, { label: "Oldest", filter: "created_asc" }, { label: "Name (A to Z)", filter: "name_asc" }]} />
              <DropdownFilters scope="visibility" label="Visibility" items={[{ label: "All access types", filter: "all" }, { label: "Private", filter: "private" }, { label: "Public", filter: "public" }]} />
            </div>
          </div>

         { <div className="max-w-7xl"> 
            {items.length > 0 ? (
              activeViewMethod === "list" ? (
                <VideoDataTable name="library" columns={VideoColumn} data={items} onRowClick={handleRowClick} />
              ) : (
                null
                // <GridDataView items={items} />
              )
            ) : (
              <div className="w-full py-12 flex flex-col items-center justify-center border border-dashed rounded-xl bg-muted/20 text-muted-foreground gap-2">
                <Inbox className="size-8 opacity-40" />
                <p className="text-sm font-medium">
                  No favorite videos yet.
                </p>
              </div>
            )}
          </div>}

          <div
            ref={sentinelRef}
            className="w-full py-4 flex items-center justify-center"
          >
            {isFetchingNextPage && (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            )}
            {!hasNextPage && items.length > 0 && (
              <span className="text-xs font-semibold tracking-wide text-muted-foreground/60 bg-muted/40 px-3 py-1.5 rounded-full border border-border/40 select-none">
                End of Content Library
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FavoritesView;
