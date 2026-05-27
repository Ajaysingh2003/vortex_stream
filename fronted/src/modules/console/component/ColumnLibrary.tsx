import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  EllipsisVertical,
  CalendarDays,
  IndianRupee,
  FileText,
  Share2,
} from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { useTutorialFilters } from "@/modules/tutorials/hook/useTutorials";
import { useTRPC } from "@/trpc/client";
import { LibraryType } from "@/modules/types";
import Image from "next/image";
import { formatDuration } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDataTransferHorizontalIcon,
  FirstBracketIcon,
  MoreVerticalIcon,
  PencilEdit01Icon,
  Share01Icon,
} from "@hugeicons/core-free-icons";
import ToolTipBar from "./ToolTipBar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
export const libraryColumn: ColumnDef<LibraryType>[] = [
  // 🖼️ Thumbnail + Title
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      const { id, type } = row.original;

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

          <div className="flex flex-col min-w-0">
            <p className="font-semibold text-sm  md:text-[13px] line-clamp-1 truncate">
              {row.original.name}
            </p>
          </div>
        </div>
      );
    },
  },

  // 📝 type
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
  {
    accessorKey: "item",
    header: "Item",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-sm font-medium">
        <p className="font-semibold text-sm  md:text-[13px] line-clamp-1 truncate">
          {row.original.childCount ? row.original.childCount : "-"}
        </p>
      </div>
    ),
  },

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

  // ⚙️ Actions
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const trpc = useTRPC();
      const queryClient = useQueryClient();

      // const [filters, setFilters] = useTutorialFilters();

      // const mutate = useMutation(
      //   trpc.tutorials.tutorialDelete.mutationOptions({
      //     onSuccess: async () => {
      //       toast.success("Tutorial Deleted Sucessfully.");
      //       await queryClient.invalidateQueries(
      //         trpc.tutorials.getTutorials.queryOptions({ ...filters }),
      //       );
      //     },
      //     onError: () => {
      //       toast.error("Something went wrong.");
      //     },
      //   }),
      // );

      // const updateChange = useMutation(
      //   trpc.tutorials.updateTutorial.mutationOptions({
      //     onSuccess: async () => {
      //       toast.success("Tutorial Updated.");
      //       await queryClient.invalidateQueries(
      //         trpc.tutorials.getTutorials.queryOptions({ ...filters }),
      //       );
      //     },
      //     onError: () => {
      //       toast.error("Something went wrong.");
      //     },
      //   }),
      // );

      // const handleDelete = async (e: React.MouseEvent) => {
      //   e.stopPropagation();
      //   await mutate.mutateAsync({ id: row.original.id });
      // };

      // const handleChange= async(e:React.MouseEvent)=>{

      //   e.stopPropagation()

      //   await updateChange.mutateAsync({id:row.original.id,isPublished:!row.original.isPublished})

      // }
      const [hover,setHover]=useState(false)
      return (
        <div  onMouseEnter={()=>(setHover(true))} onMouseLeave={()=>setHover(false)} className={`w-fit flex rounded-lg items-center gap-2  px-2 py-0.5 bg-whitez justify-center ${ hover && row.original.type =="video" && "shadow-md border-[0.5px]"} duration-200 transition-all ease-in-out  border-black/10 min-w-[120px]`}>
          { hover && row.original.type =="video" && <>
            <ToolTipBar
            icon={Share01Icon}
            tooltip="copy share URL"
            onClick={() => {}}
          />
          <ToolTipBar
            icon={PencilEdit01Icon}
            tooltip="rename"
            onClick={() => {}}
          />
          <ToolTipBar
            icon={ArrowDataTransferHorizontalIcon}
            tooltip="copy embed"
            onClick={() => {}}
          />
          </>}
          <button className="bg-transparent">
            <HugeiconsIcon className="size-4.5" icon={MoreVerticalIcon} />
          </button>
        </div>
      );
    },
  },
];
