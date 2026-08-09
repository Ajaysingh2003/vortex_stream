import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLibraryFilters } from "@/lib/useLibraryFilters";
import { LibraryContentType, LibraryType } from "@/modules/types";
import { useParams } from "next/navigation";

interface RenameInterfaceProps {
  workspaceID: string;
  item: LibraryType;
  openDialog: boolean;
  setOpenDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

function RenameInterface({
  workspaceID,
  item,
  openDialog,
  setOpenDialog,
}: RenameInterfaceProps) {
  const trpc = useTRPC();
  const params = useParams();
  const queryClient = useQueryClient();
  const rootfolder = item.parentId == null;

  const [filters] = useLibraryFilters();
  const folderID = params.id as string;
  const [newName, setNewName] = useState(item.name);

  // 1. Folder Mutation
  const updateFolder = useMutation(
    trpc.folder.updateFolder.mutationOptions({
      onSuccess: async () => {
        toast.success("Folder Updated Successfully.");
        setOpenDialog(false);

        if (rootfolder) {
          await queryClient.invalidateQueries({
            queryKey: trpc.folder.getRootContent.infiniteQueryKey({
              workspaceID,
            }),
          });
        } else {
          await queryClient.invalidateQueries({
            queryKey: trpc.folder.getFolderContent.infiniteQueryKey({
              workspaceID,
              folderID,
            }),
          });
        }
      },
      onError: (err) => {
        toast.error(err.message);
      },
    })
  );

  // 2. Video Mutation
  const updateVideo = useMutation(
    trpc.video.updateName.mutationOptions({
      onSuccess: async () => {
        toast.success("Video Updated Successfully");
        setOpenDialog(false);

        if (rootfolder) {
          await queryClient.invalidateQueries({
            queryKey: trpc.folder.getRootContent.infiniteQueryKey({
              workspaceID,
            }),
          });
        } else {
          await queryClient.invalidateQueries({
            queryKey: trpc.folder.getFolderContent.infiniteQueryKey({
              workspaceID,
              folderID,
            }),
          });
        }
      },
      onError: (err) => {
        toast.error(err.message);
      },
    })
  );

  const isPending = updateFolder.isPending || updateVideo.isPending;

  const handleRename = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!newName.trim()) return;

    if (item.type === "video") {
      await updateVideo.mutateAsync({
        name: newName,
        workspaceID,
        videoID: item.id,
        folderID,
      });
    } else if (item.type === "folder") {
      await updateFolder.mutateAsync({
        name: newName,
        workspaceID,
        folderID: item.id,
      });
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogTrigger asChild />
        <DialogContent
          className="lg:w-84 rounded-xl"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>
              Rename {item.type === "video" ? "Video" : "Folder"}
            </DialogTitle>
          </DialogHeader>
          <section>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`Enter ${item.type === "video" ? "Video" : "Folder"} name`}
              className="rounded-lg border-none outline-none shadow-none ring-0 focus-within:ring-violet-300 focus-within:shadow-none"
            />
          </section>
          <DialogFooter className="w-full">
            <div className="grid grid-cols-2 gap-5 items-center w-full justify-center">
              <Button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDialog(false);
                }}
                className="w-full rounded-lg text-black hover:bg-black/5 cursor-pointer bg-black/10"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleRename}
                disabled={isPending || !newName.trim()}
                className="w-full cursor-pointer rounded-lg text-white bg-violet-400 hover:bg-violet-300"
              >
                {isPending ? "Updating..." : "Rename"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RenameInterface;