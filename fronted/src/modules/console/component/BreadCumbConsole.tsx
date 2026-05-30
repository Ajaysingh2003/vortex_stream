import React from "react";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { FolderDataType, WorkspaceType } from "@/modules/types";

function BreadCumbConsole() {
  const router = useRouter();
  const pathName = usePathname();
  const handleFolderChange = (id: string) => {
    router.push(`/console/content-library/folder/${id}`, { scroll: false });
  };

  const MAX_VISIBLE_BREADCRUMBS = 3;

  const params = useParams();
  const folderID = params.id as string;
  const trpc = useTRPC();

  const { data: workspace } = useSuspenseQuery(
    trpc.user.getWorkspace.queryOptions(),
  );

  const workspaceData = workspace as WorkspaceType;

  const { data: breadcumbs } = useSuspenseQuery(
    trpc.folder.getFolderBreadCumb.queryOptions({
      workspaceID: workspaceData.id,
      folderID,
    }),
  );
  const breadcumb = breadcumbs as FolderDataType[];

  const shouldTruncate = breadcumb.length > MAX_VISIBLE_BREADCRUMBS;

  const visibleBreadcrumbs = shouldTruncate ? breadcumb.slice(-1) : breadcumb;

  return (
    <div className="w-fit">
      {folderID && (
        <Breadcrumb className="w-full">
          <BreadcrumbList className="flex items-center flex-nowrap text-xs">
            {/* 1. Root Anchor */}
            <BreadcrumbItem
              onClick={() => router.push("/console/content-library")}
              className="cursor-pointer text-stone-800 shrink-0"
            >
              <Home className="size-[16px]" />
            </BreadcrumbItem>

            {/* 2. Middle Collapsed Ellipsis Indicator */}
            {shouldTruncate && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem className="text-stone-400 select-none cursor-default">
                  ...
                </BreadcrumbItem>
              </>
            )}

            {/* 3. Render shortened visible array list sequence */}
            {visibleBreadcrumbs.map((e) => (
              <React.Fragment key={e.id}>
                <BreadcrumbSeparator className="shrink-0" />
                <BreadcrumbItem
                  onClick={() => handleFolderChange(e.id)}
                  className={`capitalize cursor-pointer shrink-0 md:text-[15px] hover:underline truncate max-w-[100px] ${
                    e.id === folderID
                      ? "text-stone-900 font-semibold pointer-events-none"
                      : "text-accent"
                  }`}
                  title={e.name}
                >
                  {e.name}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
    </div>
  );
}

export default BreadCumbConsole;
