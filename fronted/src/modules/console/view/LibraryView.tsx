"use client";
import React, { useCallback, useEffect, useRef } from "react";
import TopHeader from "../component/TopHeader";
import UploadFile from "../component/UploadFile";
import ImportVideos from "@/modules/upload/component/ImportVideos";
import Filters from "../component/Filters";
import { DataTable } from "@/components/static/DataTable";
import { libraryColumn } from "../component/ColumnLibrary";
import { useQueryClient, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import {
  LibraryContentType,
  WorkspaceType,
  LibraryType,
} from "@/modules/types";
import { Inbox, Loader2 } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLibraryFilters } from "@/lib/useLibraryFilters";
import { useRouter } from "next/navigation";

interface LibraryViewProps {
  limit: number;
}

function LibraryView({ limit }: LibraryViewProps) {
  const queryClient=useQueryClient()
  const trpc = useTRPC();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data: workspace } = useSuspenseQuery(
    trpc.user.getWorkspace.queryOptions(),
  );
  const workspacesData = workspace as WorkspaceType;
  const [filters, setFilters] = useLibraryFilters();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(
      trpc.folder.getRootContent.infiniteQueryOptions(
        {
          limit,
          cursor: filters.cursor,
          workspaceID: workspacesData.id,
        },
        {
          getNextPageParam: (lastPage: LibraryContentType) =>
            lastPage.metadata.hasNextPage
              ? lastPage.metadata.nextCursor
              : undefined,

          initialCursor: "",
        },
      ),
    );

  const items: LibraryType[] = data.pages.flatMap((page) => page.items);



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

  const handleSuccess = useCallback(async () => {
    // ← use infiniteQueryOptions not queryOptions
    await queryClient.invalidateQueries(
        trpc.folder.getRootContent.infiniteQueryOptions(
            {
                limit,
                workspaceID: workspacesData.id,
                cursor: "",
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
}, [queryClient, limit, workspacesData?.id])
const router=useRouter()
const handleRowClick=(row:{id:string,type: "video" | "folder"})=>{
  console.log("row.id",row.id)
  let url=`/`

  row.type == "video" ? url=`video/${row.id}` : url = `/console/content-library/folder/${row.id}`

  router.push(url)
}

  return (
    <div className="w-full h-full min-h-screen relative bg-transparent">
      <div className="px-6 md:px-12 py-4 w-full">
        <div className="flex flex-col gap-6 md:gap-4">
          <TopHeader
            Header="Library"
            Btnchild={
              <div className="flex flex-row gap-3">
                <ImportVideos />
                <UploadFile />
              </div>
            }
          />

          <div className="flex justify-end">
            <Filters  workspaceID={workspacesData.id} parentId={null} onSucess={handleSuccess}/>
          </div>

          <div className="max-w-7xl"> 
            {items.length > 0 ? (
              <DataTable name="library" columns={libraryColumn} data={items} onRowClick={handleRowClick} />
            ) : (
              <div className="w-full py-12 flex flex-col items-center justify-center border border-dashed rounded-xl bg-muted/20 text-muted-foreground gap-2">
                <Inbox className="size-8 opacity-40" />
                <p className="text-sm font-medium">
                  This workspace folder is completely empty.
                </p>
              </div>
            )}
          </div>

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

export default LibraryView;
