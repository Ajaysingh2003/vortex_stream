"use client";

import React, { useState } from "react";
import { MoreVerticalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import DeleteBox from "@/components/static/DeleteBox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LibraryType } from "@/modules/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useTRPC } from "@/trpc/client";
import { useParams } from "next/navigation";
import RenameInterface from "./RenameInterface";
import MoveItems from "./MoveItems";

function DropDownOption({
  open,
  setOpen,
  item,
  workspaceId,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  item: LibraryType;
  workspaceId: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const params = useParams();
  const folderID = params.id as string;

  const rootfolder = item.parentId == null;

  // Dialog & Sheet States
  const [openDialog, setOpenDialog] = useState(false);
  const [openMoveSheet, setOpenMoveSheet] = useState(false);

  const deleteMutate = useMutation(
    trpc.folder.deleteFolder.mutationOptions({
      onSuccess: async () => {
        toast.success("Folder Deleted Successfully.");
        if (rootfolder) {
          await queryClient.invalidateQueries({
            queryKey: trpc.folder.getRootContent.infiniteQueryKey({
              workspaceID: workspaceId,
            }),
          });
        } else {
          await queryClient.invalidateQueries({
            queryKey: trpc.folder.getFolderContent.infiniteQueryKey({
              workspaceID: workspaceId,
              folderID: folderID,
            }),
          });
        }
      },
      onError: (err) => {
        toast.error(err.message);
      },
    })
  );

  const handleDelete = async () => {
    if (item.type === "folder") {
      await deleteMutate.mutateAsync({
        folderID: item.id,
        workspaceID: workspaceId,
      });
    }
    if (item.type === "video") {
      // Implement video deletion logic here
    }
  };

  const addFavoriteMutate=useMutation(trpc.favorite.add.mutationOptions({
    onSuccess:()=>{
      toast.success("Video Added to Favorite.")
    },
    onError:(err)=>{
      toast.error(err.message || "Something went wrong.")
    }
  }))
  const addChannelMutate=useMutation(trpc.channel.create.mutationOptions({
    onSuccess:()=>{
      toast.success("Video Added to Favorite.")
    },
    onError:(err)=>{
      toast.error(err.message || "Something went wrong.")
    }
  }))


  const handleFavoriteAdd=async()=>{
    await addFavoriteMutate.mutateAsync({videoId:item.id})
  }

  const openRenameDialog = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setOpenDialog(true);
  };

  return (
    <>
      {/* 1. Modals & Sheets isolated at top level */}
      <RenameInterface
        item={item}
        workspaceID={workspaceId}
        openDialog={openDialog}
        setOpenDialog={setOpenDialog}
      />

      <MoveItems
        item={item}
        workspaceId={workspaceId}
        open={openMoveSheet}
        onOpenChange={setOpenMoveSheet}
        onMoved={() => {
          void queryClient.invalidateQueries();
          setOpenMoveSheet(false);
        }}
      />

      {/* 2. Dropdown Menu */}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="bg-transparent cursor-pointer p-1 hover:bg-neutral-100 rounded-lg flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <HugeiconsIcon className="size-4.5" icon={MoreVerticalIcon} />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="shadow-md p-1 min-w-[140px] w-auto bg-white dark:bg-zinc-950 border border-border rounded-md"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem
            className="cursor-pointer text-accent text-sm font-medium px-2.5 py-1.5 rounded-md hover:bg-muted focus:bg-muted"
            onClick={openRenameDialog}
          >
            Rename
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer text-accent text-sm font-medium px-2.5 py-1.5 rounded-md hover:bg-muted focus:bg-muted">
            Copy Link
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer text-accent text-sm font-medium px-2.5 py-1.5 rounded-md hover:bg-muted focus:bg-muted">
            Add to Channel
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer text-accent text-sm font-medium px-2.5 py-1.5 rounded-md hover:bg-muted focus:bg-muted"
            onSelect={() => {
              // Open sheet state cleanly after dropdown unmounts
              setOpenMoveSheet(true);
            }}
          >
            Move {item.type}
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer text-accent text-sm font-medium px-2.5 py-1.5 rounded-md hover:bg-muted focus:bg-muted">
            Share
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer text-accent text-sm font-medium px-2.5 py-1.5 rounded-md hover:bg-muted focus:bg-muted">
            Copy Embed Code
          </DropdownMenuItem>

          {item.type === "video" && (
            <>
              <DropdownMenuItem className="cursor-pointer text-accent text-sm font-medium px-2.5 py-1.5 rounded-md hover:bg-muted focus:bg-muted">
                Analytics
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer text-accent text-sm font-medium px-2.5 py-1.5 rounded-md hover:bg-muted focus:bg-muted">
                Download
              </DropdownMenuItem>
            </>
          )}

          { item.type == "video" &&<DropdownMenuItem onClick={handleFavoriteAdd} className="cursor-pointer text-accent text-sm font-medium px-2.5 py-1.5 rounded-md hover:bg-muted focus:bg-muted">
            Add to favorite
          </DropdownMenuItem>}

          <DeleteBox
            message="Delete this folder permanently? This action cannot be undone and all contained media will be lost."
            handleDelete={handleDelete}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export default DropDownOption;
