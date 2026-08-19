"use client";
import React, { useEffect, useRef, useState } from "react";
import TopHeader from "../component/TopHeader";
import UploadFile from "../component/UploadFile";
import ImportVideos from "@/modules/upload/component/ImportVideos";
import Filters from "../component/Filters";
import { useQueryClient, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import {
  LibraryContentType,
  WorkspaceType,
  VideoListType,
  VideoAsset,
} from "@/modules/types";
import { Inbox, Loader2 } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLibraryFilters } from "@/lib/useLibraryFilters";
import { useRouter } from "next/navigation";
import { VideoDataTable } from "../component/VideoDataTable";
import { VideoColumn } from "../component/VideoColumn";

interface VideosViewProps {
  limit: number;
  favorite?: boolean;
}

function VideosView({ limit, favorite = false }: VideosViewProps) {
  const queryClient=useQueryClient()
  const trpc = useTRPC();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data: workspace } = useSuspenseQuery(
    trpc.user.getWorkspace.queryOptions(),
  );
  const workspacesData = workspace as WorkspaceType;
  const [filters] = useLibraryFilters();

  const listOptions = favorite
    ? trpc.favorite.list.infiniteQueryOptions(
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
            lastPage.metadata.hasNextPage
              ? lastPage.metadata.nextCursor
              : undefined,
          initialCursor: "",
        },
      )
    : trpc.video.videoListFromWorkspace.infiniteQueryOptions(
        {
          limit,
          cursor: filters.cursor,
          workspaceId: workspacesData.id,
          date: filters.date,
          visibility: filters.visibility,
          sort: filters.sort,
        },
        {
          getNextPageParam: (lastPage: VideoListType) =>
            lastPage.metadata.hasNextPage
              ? lastPage.metadata.nextCursor
              : undefined,
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

  const handleSuccess = async () => {
    // ← use infiniteQueryOptions not queryOptions
    await queryClient.invalidateQueries(
        favorite
          ? trpc.favorite.list.infiniteQueryOptions(
              {
                limit,
                workspaceID: workspacesData.id,
                cursor: "",
                type: filters.type,
                date: filters.date,
                visibility: filters.visibility,
                sort: filters.sort,
              },
              { getNextPageParam: (lastPage) => lastPage.metadata.hasNextPage ? lastPage.metadata.nextCursor : undefined, initialCursor: "" },
            )
          : trpc.video.videoListFromWorkspace.infiniteQueryOptions(
            {
                limit,
                workspaceId: workspacesData.id,
                cursor: "",
                date: filters.date,
                visibility: filters.visibility,
                sort: filters.sort,
            },
            {
                getNextPageParam: (lastPage: LibraryContentType) =>
                    lastPage.metadata.hasNextPage
                        ? lastPage.metadata.nextCursor
                        : undefined,
                initialCursor: "",
            }
            )
    )
  };

const router=useRouter()
const handleRowClick=(row:{id:string})=>{
  console.log("row.id",row.id)
  let url=`/`

  url=`/console/content-library/video/${row.id}`

  router.push(url)
}

type typeViewMethod = "list" | "grid";
  


// The grid branch is currently disabled below, so start with the working list view.
const [activeViewMethod, setActiveViewMethod] = useState<typeViewMethod>("list");


  return (
    <div className="w-full h-full min-h-screen relative bg-transparent">
      <div className="px-4 md:px-12 py-4 w-full">
        <div className="flex flex-col gap-6 md:gap-4">
          <TopHeader
            Header="Videos"
            Btnchild={
              <div className="flex flex-row gap-3">
               <div className="hidden md:inline-block">
                 <ImportVideos />
               </div>
                <UploadFile />
              </div>
            }
          />

          <div className=" hidden md:flex justify-end">
            <Filters  activeViewMethod={activeViewMethod} setActiveViewMethod={setActiveViewMethod} workspaceID={workspacesData.id} parentId={null} onSucess={handleSuccess}/>
          </div>

         { <div className="max-w-7xl"> 
            {items.length > 0 ? (
              activeViewMethod === "list" ? (
                <VideoDataTable name="library" columns={VideoColumn} data={items} onRowClick={handleRowClick} />
              ) : (
                <VideoDataTable name="library" columns={VideoColumn} data={items} onRowClick={handleRowClick} />
              )
            ) : (
              <div className="w-full py-12 flex flex-col items-center justify-center border border-dashed rounded-xl bg-muted/20 text-muted-foreground gap-2">
                <Inbox className="size-8 opacity-40" />
                <p className="text-sm font-medium">
                  This workspace folder is completely empty.
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

export default VideosView;
