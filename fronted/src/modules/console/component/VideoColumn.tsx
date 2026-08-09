import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import toast from "react-hot-toast";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import {
  renameType,
  VideoAsset,
  VideoListType,
  WorkspaceType,
} from "@/modules/types";
import Image from "next/image";
import { formatDuration } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDataTransferHorizontalIcon,
  MoreVerticalIcon,
  PencilEdit01Icon,
  Share01Icon,
} from "@hugeicons/core-free-icons";
import ToolTipBar from "./ToolTipBar";
import { useEffect, useRef, useState } from "react";
import DeleteBox from "@/components/static/DeleteBox";
import { useLibraryFilters } from "@/lib/useLibraryFilters";
import { useConsoleContext } from "../context/ConsoleContext";
import { Input } from "@/components/ui/input";

const GRADIENTS = [
  "bg-gradient-to-tr from-amber-200 via-yellow-300 to-indigo-400",
  "bg-gradient-to-tr from-emerald-300 via-green-400 to-teal-500",
  "bg-gradient-to-tr from-blue-300 via-indigo-300 to-purple-400",
  "bg-gradient-to-tr from-pink-300 via-purple-300 to-indigo-300",
  "bg-gradient-to-tr from-orange-200 via-rose-300 to-amber-300",
];

const getGradientClass = (id: string) => {
  const charCodeSum = id
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return GRADIENTS[charCodeSum % GRADIENTS.length];
};

export const VideoColumn: ColumnDef<VideoAsset>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      const video = row.original;
      const context = useConsoleContext();
      const isRename = video.id === context?.rename?.id;

      const inputRef = useRef<HTMLInputElement | null>(null);
      const trpc = useTRPC();
      const queryClient = useQueryClient();
      const [filters] = useLibraryFilters();

      const { data: workspace } = useSuspenseQuery(
        trpc.user.getWorkspace.queryOptions()
      );
      const workspaceData = workspace as WorkspaceType;

      const invalidateVideoList = async () => {
        await queryClient.invalidateQueries(
          trpc.video.videoListFromWorkspace.infiniteQueryOptions(
            {
              limit: filters.limit,
              cursor: "",
              workspaceId: workspaceData.id,
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
            }
          )
        );
      };

      const updateVideo = useMutation(
        trpc.video.updateName.mutationOptions({
          onSuccess: async () => {
            toast.success("Video name updated");
            await invalidateVideoList();
          },
          onError: (err) => {
            toast.error(err.message);
          },
        })
      );

      useEffect(() => {
        const handleClickOutside = async (e: MouseEvent) => {
          if (
            inputRef.current &&
            !inputRef.current.contains(e.target as Node)
          ) {
            if (!context?.rename?.newName) {
              context?.setRename(null);
              return;
            }

            await updateVideo.mutateAsync({
              name: context.rename.newName,
              workspaceID: workspaceData.id,
              videoID: video.id,
            });

            context?.setRename(null);
          }
        };

        if (isRename) {
          document.addEventListener("click", handleClickOutside);
        }

        return () => {
          document.removeEventListener("click", handleClickOutside);
        };
      }, [context?.rename?.newName, isRename]);

      useEffect(() => {
        if (isRename && inputRef.current) {
          inputRef.current.focus();
        }
      }, [isRename]);

      const hasThumbnail = Boolean(video.thumbnail);
      const thumbnailSrc = hasThumbnail
        ? `${process.env.NEXT_PUBLIC_CDN_URL}${video.thumbnail}`
        : "";

      return (
        <div className="flex items-center gap-3 min-w-0 px-2 py-1">
          <div className="relative w-28 h-18 rounded-xl overflow-hidden shrink-0 border border-stone-200/80 shadow-sm">
            {hasThumbnail ? (
              <Image
                fill
                unoptimized
                src={thumbnailSrc}
                alt={video.title}
                className="object-cover transition-transform duration-300 hover:scale-105"
              />
            ) : (
              <div
                className={`w-full h-full ${getGradientClass(
                  video.id
                )} transition-opacity duration-300 hover:opacity-90`}
              />
            )}
          </div>

          {!isRename ? (
            <div className="flex flex-col gap-1 min-w-0">
              <p
                className="font-semibold text-sm md:text-[13px] line-clamp-1 truncate"
                title={video.title}
              >
                {video.title}
              </p>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                {video.status}
              </span>
            </div>
          ) : (
            <Input
              ref={inputRef}
              className="max-w-64 rounded-xl"
              onClick={(e) => e.stopPropagation()}
              value={
                context?.rename?.newName !== undefined
                  ? context?.rename?.newName
                  : context?.rename?.oldName ?? video.title
              }
              onChange={(e) => {
                e.preventDefault();
                e.stopPropagation();
                context?.setRename((prev) =>
                  prev ? { ...prev, newName: e.target.value } : null
                );
              }}
              onKeyDown={(e) => e.stopPropagation()}
            />
          )}
        </div>
      );
    },
  },

  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-sm font-medium">
        <p className="font-semibold text-sm md:text-[13px]">
          {row.original.duration ? formatDuration(row.original.duration) : "-"}
        </p>
      </div>
    ),
  },

  {
    accessorKey: "isPrivate",
    header: "Visibility",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-sm font-medium">
        <span
          className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
            row.original.isPrivate
              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
          }`}
        >
          {row.original.isPrivate ? "Private" : "Public"}
        </span>
      </div>
    ),
  },

  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const formatted = row.original.createdAt
        ? format(new Date(row.original.createdAt), "MMM d, yyyy")
        : "-";

      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="size-4" />
          {formatted}
        </div>
      );
    },
  },

  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const video = row.original;
      const trpc = useTRPC();
      const queryClient = useQueryClient();
      const [hover, setHover] = useState(false);
      const [open, setOpen] = useState(false);
      const [filters] = useLibraryFilters();

      const { data: workspace } = useSuspenseQuery(
        trpc.user.getWorkspace.queryOptions()
      );
      const workspaceData = workspace as WorkspaceType;
      const context = useConsoleContext();

      const deleteMutate = useMutation(
        trpc.video.deleteVideo.mutationOptions({
          onSuccess: async () => {
            toast.success("Video Deleted Successfully");
            await queryClient.invalidateQueries(
              trpc.video.videoListFromWorkspace.infiniteQueryOptions(
                {
                  limit: filters.limit,
                  cursor: "",
                  workspaceId: workspaceData.id,
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
                }
              )
            );
          },
          onError: (err) => {
            toast.error(err.message);
          },
        })
      );

      const handleDelete = async () => {
        await deleteMutate.mutateAsync({
          id: video.id,
          workspaceId: workspaceData.id,
        });
      };

      const handleRename = (asset: renameType) => {
        context?.setRename({
          id: asset.id,
          assetType: "video",
          oldName: asset.oldName,
          newName: undefined,
        });
      };

      return (
        <div
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className={`w-fit flex rounded-lg items-center gap-2 px-2 py-0.5 min-w-[120px] justify-center duration-200 transition-all ease-in-out border-black/10 
            ${hover ? "shadow-md border-[0.5px]" : ""} 
          `}
        >
          {hover && (
            <>
              <ToolTipBar
                icon={Share01Icon}
                tooltip="copy share URL"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/video/${video.id}`
                  );
                  toast.success("Share URL copied!");
                }}
              />
              <ToolTipBar
                icon={PencilEdit01Icon}
                tooltip="rename"
                onClick={() =>
                  handleRename({
                    id: video.id,
                    assetType: "video",
                    oldName: video.title,
                    newName: "",
                  })
                }
              />
              <ToolTipBar
                icon={ArrowDataTransferHorizontalIcon}
                tooltip="copy embed"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `<iframe src="${window.location.origin}/embed/${video.id}" allowfullscreen></iframe>`
                  );
                  toast.success("Embed code copied!");
                }}
              />
            </>
          )}

          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                className="bg-transparent cursor-pointer p-1 hover:bg-neutral-100 rounded-lg flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
              >
                <HugeiconsIcon className="size-4.5" icon={MoreVerticalIcon} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="shadow-md p-1 min-w-[120px] w-auto bg-white dark:bg-zinc-950 border border-border rounded-md"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                className="cursor-pointer text-accent text-sm font-medium px-2.5 py-1.5 rounded-md hover:bg-muted focus:bg-muted"
                onClick={() =>
                  handleRename({
                    id: video.id,
                    assetType: "video",
                    oldName: video.title,
                    newName: "",
                  })
                }
              >
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-accent text-sm font-medium px-2.5 py-1.5 rounded-md hover:bg-muted focus:bg-muted"
                onClick={() => {
                  // Trigger move video modal
                }}
              >
                Move Video
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-accent text-sm font-medium px-2.5 py-1.5 rounded-md hover:bg-muted focus:bg-muted"
                onClick={() => {
                  // Trigger favorite status toggle
                }}
              >
                Add to favorite
              </DropdownMenuItem>
              <DeleteBox
                message="Delete this video permanently? This action cannot be undone."
                handleDelete={handleDelete}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];