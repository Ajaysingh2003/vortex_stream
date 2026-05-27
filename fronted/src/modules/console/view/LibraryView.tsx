"use client";
import React from "react";
import TopHeader from "../component/TopHeader";
import UploadFile from "../component/UploadFile";
import ImportVideos from "@/modules/upload/component/ImportVideos";
import Filters from "../component/Filters";
import { DataTable } from "@/components/static/DataTable";
import { libraryColumn } from "../component/ColumnLibrary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { LibraryContentType, WorkspaceType } from "@/modules/types";
import { useQueryStates } from "nuqs";
import { libraryCoordinates } from "@/lib/searchParams";
import { Button } from "@/components/ui/button";
import { ArrowRight, Inbox } from "lucide-react";

interface LibraryViewProps {
  cursor: string;
  limit: number;
}

function LibraryView({ limit }: LibraryViewProps) {
  const trpc = useTRPC();
  
  // 1. Unpack your global address bar values
  const [filters, setFilters] = useQueryStates(libraryCoordinates, { 
    // shallow: true,
  });

  // 2. Fetch the workspace scope coordinates
  const { data: workspace } = useSuspenseQuery(
    trpc.user.getWorkspace.queryOptions(),
  );
  const workspacesData = workspace as WorkspaceType;

  // 3. Dynamic layout query execution bound entirely to your nuqs synchronized state
  console.log(filters.cursor,"mnja56")
  const { data } = useSuspenseQuery(
    trpc.folder.getRootContent.queryOptions({
      limit: limit,
      cursor: filters.cursor || "", // Fallback cleanly if cursor is null/empty
      workspaceID: workspacesData.id,
    }),
  );

  const libraryData = data as LibraryContentType;
  
  // 💡 Check explicitly if a valid next cursor exists on the backend payload
  const hasNextPage = !!libraryData?.metadata?.nextCursor;

  console.log(libraryData,"lol")
  const handleNextPage = () => {
    if (hasNextPage) {
      setFilters({ cursor: libraryData.metadata.nextCursor });
    }
  };

  return (
    <div className="w-full h-full min-h-screen relative bg-transparent">
      <div className="px-6 md:px-12 py-4 w-full">
        <div className="flex flex-col gap-6 md:gap-4">
          
          <TopHeader
            Header={"Library"}
            Btnchild={
              <div className="flex flex-row gap-3">
                <ImportVideos />
                <UploadFile />
              </div>
            }
          />
          
          <div className="flex justify-end">
            <Filters />
          </div>

          <div className="max-w-7xl">
            {libraryData?.items?.length > 0 ? (
              <DataTable
                name="library"
                columns={libraryColumn}
                data={libraryData.items}
              />
            ) : (
              /* Soft empty state container fallback */
              <div className="w-full py-12 flex flex-col items-center justify-center border border-dashed rounded-xl bg-muted/20 text-muted-foreground gap-2">
                <Inbox className="size-8 opacity-40" />
                <p className="text-sm font-medium">This workspace folder is completely empty.</p>
              </div>
            )}
          </div>

          {/* 💡 REFINE: Modern, interactive cursor activation layout block */}
          <div className="w-full mt-6 flex items-center justify-center">
            {hasNextPage ? (
              <Button 
                variant="outline"
                className="rounded-xl font-semibold gap-2 shadow-sm pr-3 cursor-pointer hover:bg-neutral-50"
                onClick={handleNextPage}
              >
                Load Next Batch <ArrowRight className="size-4 opacity-70" />
              </Button>
            ) : (
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