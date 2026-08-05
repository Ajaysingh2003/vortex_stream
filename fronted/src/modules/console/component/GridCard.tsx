import {
  LibraryContentType,
  LibraryType,
  WorkspaceType,
} from "@/modules/types";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Folder, Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useLibraryFilters } from "@/lib/useLibraryFilters";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useParams, useRouter } from "next/dist/client/components/navigation";
import { useTRPC } from "@/trpc/client";
import DropDownOption from "./DropDownOption";

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function GridCard({ item }: { item: LibraryType }) {
  const trpc = useTRPC();
  const randomNumber = Math.floor(Math.random() * (3 - 1 + 1)) + 1;
  const folderImage = `/assets/img${randomNumber}.jpeg`;

  const [open, setOpen] = useState(false);

  const [filters, setFilters] = useLibraryFilters();

  const rootfolder = item.parentId == null;

  const { data: workspace } = useSuspenseQuery(
    trpc.user.getWorkspace.queryOptions(),
  );

  const workspaceData = workspace as WorkspaceType;

  const params = useParams();

  const folderID = params.id as string;

  const router = useRouter();

  const handleRowClick = (row: { id: string; type: "video" | "folder" }) => {
    // console.log("row.id", row.id);
    // let url = `/`;

    // row.type == "video"
    //   ? (url = `/console/content-library/video/${row.id}`)
    //   : (url = `/console/content-library/folder/${row.id}`);

    // router.push(url);
  };
  return (
    <Card
      className="
        group
        py-1
        overflow-hidden
        border-0
        shadow-none
        rounded-lg
        bg-white
        transition-all
        hover:bg-muted/15
        hover:shadow-sm
        cursor-pointer
      "
    >
      <CardContent
        role="button"
        onClick={() => handleRowClick(item)}
        className="p-3"
      >
        {/* Thumbnail */}

        <div
          role="button"
          onClick={() => console.log("Thumbnail clicked")}
          className="relative  aspect-video border-none  overflow-hidden rounded-lg bg-muted"
        >
          <Image
            fill
            unoptimized
            src={
              item.thumbnailUrl
                ? `${process.env.NEXT_PUBLIC_CDN_URL}${item.thumbnailUrl}`
                : folderImage
            }
            alt={item.name}
            className="object-cover transition-transform border-none duration-300 group-hover:scale-[1.02]"
          />

          {/* Video Badge */}

          <div className="absolute bottom-0 pb-2 right-2 flex items-center gap-1">
            {item.type === "video" && (
              <Badge className="bg-black/80 p-3 md:p-3 text-white border-none">
                <>
                  <Clock3 className="h-4 w-4" />
                  <span>{formatDuration(item.duration ?? 0)}</span>
                </>
              </Badge>
            )}
          </div>
        </div>

        {/* Bottom */}

        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-[15px]">{item.name}</h3>

            <div className="mt-1 flex flex-row items-center gap-2 text-sm text-muted-foreground">
              {item.type === "folder" ? (
                <>
                  <Folder className="h-4 w-4" />
                  <span>{item.childCount ?? 0} media</span>
                </>
              ) : null}

              {item.type === "video" && (
                <div className="text-sm text-gray-500">
                  <p>
                    {new Date(item.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
            <DropDownOption open={open} setOpen={setOpen} item={item} workspaceId={workspaceData.id} />
        </div>
      </CardContent>
    </Card>
  );
}
