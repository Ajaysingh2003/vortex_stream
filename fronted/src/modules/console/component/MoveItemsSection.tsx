"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Home, MoreHorizontal } from "lucide-react";
import toast from "react-hot-toast";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FolderDataType,
  RootFolderDataType,
  LibraryType,
  WorkspaceType,
} from "@/modules/types";
import { useTRPC } from "@/trpc/client";
import FolderSectionOfMove from "./FolderSectionOfMove";
import CreateFolder from "@/modules/upload/component/CreateFolder";

interface MoveItemsSectionProps {
  item: LibraryType;
  workspaceId: string;
  onMoved?: () => void;
}

function MoveItemsSection({
  item,
  workspaceId,
  onMoved,
}: MoveItemsSectionProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const { data: workspace, isLoading: isWorkspaceLoading } = useQuery({
    ...trpc.user.getWorkspace.queryOptions(),
    enabled: !workspaceId,
  });
  const resolvedWorkspaceId =
    workspaceId || (workspace as WorkspaceType | undefined)?.id || "";

  const { data: rootFolders, isLoading: isRootFoldersLoading } = useQuery({
    ...trpc.folder.getRootFolder.queryOptions({
      workspaceID: resolvedWorkspaceId,
    }),
    enabled: Boolean(resolvedWorkspaceId),
  });

  const { data: childFolders, isLoading: isChildFoldersLoading } = useQuery({
    ...trpc.folder.getChildrenFolder.queryOptions({
      workspaceID: resolvedWorkspaceId,
      folderID: currentFolderId,
    }),
    enabled: Boolean(resolvedWorkspaceId && currentFolderId),
  });

  const { data: breadcrumbs = [], isLoading: isBreadcrumbsLoading } = useQuery({
    ...trpc.folder.getFolderBreadCumb.queryOptions({
      workspaceID: resolvedWorkspaceId,
      folderID: currentFolderId,
    }),
    enabled: Boolean(resolvedWorkspaceId && currentFolderId),
  });

  const moveFolder = useMutation(trpc.folder.moveFolder.mutationOptions());
  const moveVideo = useMutation(trpc.video.UpdateVideo.mutationOptions());

  const rootFolderData = (rootFolders ?? []) as RootFolderDataType[];
  const childFolderData = (childFolders ?? []) as FolderDataType[];
  const breadcrumbData = breadcrumbs as FolderDataType[];
  const isLoading =
    isWorkspaceLoading ||
    isRootFoldersLoading ||
    (Boolean(currentFolderId) &&
      (isChildFoldersLoading || isBreadcrumbsLoading));

  const folders = currentFolderId ? childFolderData : rootFolderData;

  const handleMove = async () => {
    if (item.type === "folder" && item.id === currentFolderId) {
      toast.error("A folder cannot be moved into itself.");
      return;
    }

    try {
      if (item.type === "folder") {
        await moveFolder.mutateAsync({
          folderID: item.id,
          workspaceID: resolvedWorkspaceId,
          parentID: currentFolderId,
        });
      } else {
        await moveVideo.mutateAsync({
          videoId: item.id,
          workspaceID: resolvedWorkspaceId,
          folderID: currentFolderId,
        });
      }

      toast.success("Item moved successfully.");
      onMoved?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to move item.",
      );
    }
  };

  const isMoving = moveFolder.isPending || moveVideo.isPending;

  const handleFolderCreated = async () => {
    if (currentFolderId) {
      await queryClient.invalidateQueries(
        trpc.folder.getChildrenFolder.queryOptions({
          workspaceID: resolvedWorkspaceId,
          folderID: currentFolderId,
        }),
      );
      return;
    }

    await queryClient.invalidateQueries(
      trpc.folder.getRootFolder.queryOptions({
        workspaceID: resolvedWorkspaceId,
      }),
    );
  };

  // --- Truncation Logic ---
  const MAX_VISIBLE_BREADCRUMBS = 2;
  const shouldTruncate = breadcrumbData.length > MAX_VISIBLE_BREADCRUMBS;

  // Middle hidden items placed in dropdown menu
  const hiddenBreadcrumbs = shouldTruncate
    ? breadcrumbData.slice(0, breadcrumbData.length - (MAX_VISIBLE_BREADCRUMBS - 1))
    : [];

  // End visible items
  const visibleBreadcrumbs = shouldTruncate
    ? breadcrumbData.slice(breadcrumbData.length - (MAX_VISIBLE_BREADCRUMBS - 1))
    : breadcrumbData;

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-3 bg-transparent">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b-[0.1px] bg-background/95 px-1 pb-4 backdrop-blur">
        <div className="flex items-center gap-3 min-w-0">
          {currentFolderId && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full shrink-0"
              onClick={() => setCurrentFolderId(null)}
            >
              <ChevronLeft className="size-5" />
            </Button>
          )}

          <Breadcrumb>
            <BreadcrumbList className="flex-nowrap gap-1 text-sm overflow-hidden">
              {/* Root item */}
              <BreadcrumbItem>
                <button
                  type="button"
                  onClick={() => setCurrentFolderId(null)}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-muted-foreground transition hover:bg-muted hover:text-foreground shrink-0"
                >
                  <Home className="size-4" />
                  Root
                </button>
              </BreadcrumbItem>

              {/* Truncated Ellipsis Dropdown */}
              {shouldTruncate && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center gap-1 rounded-md px-1.5 py-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <BreadcrumbEllipsis className="size-4" />
                        <span className="sr-only">Toggle menu</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {hiddenBreadcrumbs.map((folder) => (
                          <DropdownMenuItem
                            key={folder.id}
                            onClick={() => setCurrentFolderId(folder.id)}
                            className="cursor-pointer text-sm font-medium px-2.5 py-1.5 rounded-md hover:bg-muted focus:bg-muted"
                          >
                            {folder.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </BreadcrumbItem>
                </>
              )}

              {/* Visible End Breadcrumbs */}
              {visibleBreadcrumbs.map((folder) => (
                <React.Fragment key={folder.id}>
                  <BreadcrumbSeparator />

                  <BreadcrumbItem className="min-w-0">
                    {folder.id === currentFolderId ? (
                      <BreadcrumbPage className="max-w-[120px] sm:max-w-[160px] truncate font-medium">
                        {folder.name}
                      </BreadcrumbPage>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCurrentFolderId(folder.id)}
                        className="max-w-[120px] sm:max-w-[160px] truncate rounded-md px-2 py-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      >
                        {folder.name}
                      </button>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">
            Loading folders...
          </div>
        ) : (
          <FolderSectionOfMove
            selectedFolderChildren={folders}
            onOpenFolder={setCurrentFolderId}
          />
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t-[0.05px] bg-background/95 px-1 pt-4">
        <CreateFolder
          parentID={currentFolderId}
          workspaceID={resolvedWorkspaceId}
          onSucess={handleFolderCreated}
        >
             <Button
             variant="outline"
        //   onClick={handleMove}
        //   disabled={isLoading || isMoving}
          className="rounded-full  py-5 px-6"
        >
         New Folder
        </Button>
        </CreateFolder>

        <Button
          onClick={handleMove}
          disabled={isLoading || isMoving}
          className="rounded-full bg-main-btn py-5 px-6"
        >
          {isMoving ? "Moving..." : "Move here"}
        </Button>
      </div>
    </div>
  );
}

export default MoveItemsSection;