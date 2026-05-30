import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { useParams } from "next/navigation";
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
  LibraryContentType,
  LibraryType,
  renameType,
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

export const libraryColumn: ColumnDef<LibraryType>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      const { id, type } = row.original;

      const context = useConsoleContext();

      const isRename = id == context?.rename?.id;

      console.log(isRename, context?.rename, "hgs23");
      const Inputref = useRef<HTMLInputElement | null>(null);
      const trpc = useTRPC();
      const queryClient = useQueryClient();
      const [filters, setFilters] = useLibraryFilters();
      const params = useParams();
      const folderID = params.id as string;
      console.log(folderID,"leah jaye")
      const rootfolder = folderID ==undefined;
      console.log(rootfolder,"yyyy")
      const updateFolder = useMutation(
        trpc.folder.updateFolder.mutationOptions({
          onSuccess: async () => {
            toast.success("Folder Updated Successfully.");

            if (rootfolder) {
              console.log("print from root");
              await queryClient.invalidateQueries(
                trpc.folder.getRootContent.infiniteQueryOptions(
                  {
                    limit: filters.limit,
                    workspaceID: workspaceData.id,
                    cursor: "",
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
            } else {
              console.log("non root")
              await queryClient.invalidateQueries(
                trpc.folder.getFolderContent.infiniteQueryOptions(
                  {
                    limit: filters.limit,
                    workspaceID: workspaceData.id,
                    cursor: "",
                    folderID: folderID,
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
            }
          },
          onError: (err) => {
            toast.error(err.message);
          },
        }),
      );
      
      const updateVideo = useMutation(
        trpc.video.updateName.mutationOptions({
          onSuccess: async () => {
            toast.success("Video Updated Successfully");

            if (rootfolder) {
              console.log("print from root");
              await queryClient.invalidateQueries(
                trpc.folder.getRootContent.infiniteQueryOptions(
                  {
                    limit: filters.limit,
                    workspaceID: workspaceData.id,
                    cursor: "",
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
            } else {
              console.log("yuyq")
              await queryClient.invalidateQueries(
                trpc.folder.getFolderContent.infiniteQueryOptions(
                  {
                    limit: filters.limit,
                    workspaceID: workspaceData.id,
                    cursor: "",
                    folderID: folderID,
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
            }
          },
          onError: (err) => {
            toast.error(err.message);
          },
        }),
      );

      const { data: workspace } = useSuspenseQuery(
        trpc.user.getWorkspace.queryOptions(),
      );
      const workspaceData = workspace as WorkspaceType;

      useEffect(() => {
        // if (!context?.rename?.newName) return null;
        const handleClickOutside = async (e: MouseEvent) => {
          if (
            Inputref.current &&
            !Inputref.current.contains(e.target as Node)
          ) {
            console.log("Clicked outside!");

            if (!context?.rename?.newName) {
              context?.setRename(null);
              return
            }

            // console.log(context.rename.newName,"new name")

            if (row.original.type == "video") {
              await updateVideo.mutateAsync({name:context.rename.newName,workspaceID:workspaceData.id,videoID:row.original.id,folderID})
            }
            if (row.original.type == "folder") {
              await updateFolder.mutateAsync({
                name: context.rename.newName,
                workspaceID: workspaceData.id,
                folderID: row.original.id,
              });
            }

            context?.setRename(null);
          }
        };

        document.addEventListener("click", handleClickOutside);

        return () => {
          document.removeEventListener("click", handleClickOutside);
        };
      }, [context?.rename?.newName]);

      useEffect(() => {
        console.log("lollol", Inputref.current);
        if (Inputref.current) {
          Inputref.current.focus();
          // Inputref.current.select();
          console.log("done", Inputref);
        }
      }, [isRename, Inputref.current]);

      return (
        <div className="flex items-center gap-3 min-w-0 px-2 py-1">
          <div className=" relative max-w-[100px] min-w-[80px] lg:min-w-[130px]">
            {type == "video" ? (
              <Image
                height={100}
                width={100}
                unoptimized
                src={row.original.thumbnailUrl ?? "/video-player.png"}
                alt={row.original.name}
                className="w-28 h-18 rounded-lg object-contain border"
              />
            ) : (
              <div className="bg-blue-50 lg:w-28 lg:h-18 rounded-xl flex items-center justify-center">
                <Image
                  src={"/folder.png"}
                  height={100}
                  width={100}
                  quality={100}
                  alt={row.original.name}
                  className="w-16 h-12 rounded-lg object-cover border"
                />
              </div>
            )}
          </div>

          {!isRename ? (
            <div className="flex flex-col gap-3 min-w-0">
              <p className="font-semibold text-sm  md:text-[13px] line-clamp-1 truncate">
                {row.original.name}
              </p>
              {type == "folder" && (
                <p className="font-semibold text-sm  md:text-[13px] line-clamp-1 truncate">
                  {row.original.childCount} items
                </p>
              )}
            </div>
          ) : (
            <Input
              ref={Inputref}
              className="max-w-64 rounded-xl"
              onClick={(e) => {
                e.stopPropagation();
              }}
              value={
                context?.rename?.newName !== undefined
                  ? context?.rename?.newName
                  : (context?.rename?.oldName ?? "")
              }
              onChange={(e) => {
                e.preventDefault();
                e.stopPropagation();
                context?.setRename((prev) => {
                  if (!prev) return null;

                  return {
                    ...prev,
                    newName: e.target.value,
                  };
                });
              }}
              onKeyDown={(e) => {
                e.stopPropagation();
              }}
              name={row.original.type}
            />
          )}
        </div>
      );
    },
  },

  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 capitalize text-sm max-w-[250px]">
        <h3 className="font-semibold text-sm  md:text-[13px] line-clamp-1 truncate">
          {row.original.type}
        </h3>
      </div>
    ),
  },

  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => (
      <div className="flex items-center capitalize gap-2 text-sm font-medium">
        <p className="font-semibold text-sm  md:text-[13px] line-clamp-1 truncate">
          {row.original.duration ? formatDuration(row.original.duration) : "-"}
        </p>
      </div>
    ),
  },
  // {
  //   accessorKey: "item",
  //   header: "Item",
  //   cell: ({ row }) => (
  //     <div className="flex items-center gap-2 text-sm font-medium">

  //     </div>
  //   ),
  // },

  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const formatted = format(new Date(row.original.createdAt), "MMM d, yyyy");

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
      const trpc = useTRPC();
      const queryClient = useQueryClient();

      const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        e.preventDefault();
        alert("pressed");
        console.log("button pressed");
      };

      const [hover, setHover] = useState(false);
      const handleTriggerClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        e.preventDefault();
      };
      const [filters, setFilters] = useLibraryFilters();
      const { data: workspace } = useSuspenseQuery(
        trpc.user.getWorkspace.queryOptions(),
      );
      const workspaceData = workspace as WorkspaceType;

      const rootfolder = row.original?.parentId == null;

      
      console.log(rootfolder, "row data");
      const params = useParams();
      const folderID = params.id as string;

      const context = useConsoleContext();

      const deleteMutate = useMutation(
        trpc.folder.deleteFolder.mutationOptions({
          onSuccess: async () => {
            toast.success("Folder Deleted Successfully.");
            if (rootfolder) {
              console.log("print from root");
              await queryClient.invalidateQueries(
                trpc.folder.getRootContent.infiniteQueryOptions(
                  {
                    limit: filters.limit,
                    workspaceID: workspaceData.id,
                    cursor: "",
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
            } else {
              await queryClient.invalidateQueries(
                trpc.folder.getFolderContent.infiniteQueryOptions(
                  {
                    limit: filters.limit,
                    workspaceID: workspaceData.id,
                    cursor: "",
                    folderID: folderID,
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
            }
          },
          onError: (err) => {
            console.log(err, "error come's");
            toast.error(err.message);
          },
        }),
      );

      const handleDelete = async () => {
        if (row.original.type == "folder") {
          await deleteMutate.mutateAsync({
            folderID: row.original.id,
            workspaceID: workspaceData.id,
          });
        }
        if (row.original.type == "video") {
        }
      };

      const handleRename = (asset: renameType) => {
        console.log(asset);

        context?.setRename({
          id: asset.id,
          assetType: asset.assetType,
          oldName: asset.oldName,
          newName: undefined,
        });
      };

      const [open, setOpen] = useState(false);
      return (
        <div
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className={`w-fit flex rounded-lg items-center gap-2 m px-2 py-0.5 min-w-[120px] justify-center duration-200 transition-all ease-in-out border-black/10 
            ${hover && row.original.type === "video" ? "shadow-md border-[0.5px]" : ""} 
            `}
        >
          {hover && row.original.type == "video" && (
            <>
              <ToolTipBar
                icon={Share01Icon}
                tooltip="copy share URL"
                onClick={() => {}}
              />
              <ToolTipBar
                icon={PencilEdit01Icon}
                tooltip="rename"
                onClick={() =>
                  handleRename({
                    id: row.original.id,
                    assetType: row.original.type,
                    oldName: row.original.name,
                    newName: "",
                  })
                }
              />
              <ToolTipBar
                icon={ArrowDataTransferHorizontalIcon}
                tooltip="copy embed"
                onClick={() => {}}
              />
            </>
          )}

          <DropdownMenu
            open={open}
            onOpenChange={(e) => {
              setOpen(e);
              // setHover(e)
            }}
          >
            <DropdownMenuTrigger asChild>
              <button
                onClick={handleTriggerClick}
                className="bg-transparent cursor-pointer p-1 hover:bg-neutral-100 rounded-lg flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
              >
                <HugeiconsIcon className="size-4.5" icon={MoreVerticalIcon} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="shadow-md p-1 min-w-[120px] w-auto bg-white dark:bg-zinc-950 border border-border rounded-md"
              onClick={(e: React.MouseEvent<HTMLDivElement>) =>
                e.stopPropagation()
              }
            >
              <DropdownMenuItem
                className="cursor-pointer text-accent text-sm font-medium px-2.5 py-1.5 rounded-md hover:bg-muted focus:bg-muted"
                onClick={() =>
                  handleRename({
                    id: row.original.id,
                    assetType: row.original.type,
                    oldName: row.original.name,
                    newName: "",
                  })
                }
              >
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-accent text-sm font-medium px-2.5 py-1.5 rounded-md hover:bg-muted focus:bg-muted"
                onClick={() => {
                  console.log("Trigger Rename Workflow Actions...");
                }}
              >
                Move Folder
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-accent text-sm font-medium px-2.5 py-1.5 rounded-md hover:bg-muted focus:bg-muted"
                onClick={() => {
                  console.log("Trigger Rename Workflow Actions...");
                }}
              >
                Add to favorite
              </DropdownMenuItem>
              <DeleteBox
                message="Delete this folder permanently? This action cannot be undone and all contained media will be lost."
                handleDelete={handleDelete}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
