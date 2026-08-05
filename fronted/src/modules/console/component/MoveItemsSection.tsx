import React, { useState } from "react";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  FolderDataType,
  RootFolderDataType,
  WorkspaceType,
} from "@/modules/types";
import { useTRPC } from "@/trpc/client";
import Link from "next/link";
import {
  FolderArchive,
  FolderCode,
  FolderKanbanIcon,
  Home,
} from "lucide-react";
// import FolderTable from "./FolderTable";
// import BlankRootFolder from "./BlankFolder";
// import BlankFolder from "./BlankFolder";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { useConsoleContext } from "@/modules/console/context/ConsoleContext";
import BlankFolder from "@/modules/upload/component/BlankFolder";
import CreateFolder from "@/modules/upload/component/CreateFolder";
import FolderTable from "@/modules/upload/component/FolderTable";
import FolderSectionOfMove from "./FolderSectionOfMove";
// import CreateFolder from "./CreateFolder";

function MoveItemsSection() {
  const trpc = useTRPC();

  const { data: workspace } = useSuspenseQuery(
    trpc.user.getWorkspace.queryOptions(),
  );



  

  const workspaceData = workspace as WorkspaceType;

  const searchParams = useSearchParams();

  const folderIdParam = searchParams.get("id");

  const isValid = folderIdParam && folderIdParam.trim() !== "";



    const { data: rootFolder } = useSuspenseQuery(
        trpc.folder.getRootFolder.queryOptions({ workspaceID: workspaceData.id }),
    );
  
    const rootFolderData = rootFolder as RootFolderDataType[];
  

    const [isOnRootFolder, setIsOnRootFolder] = useState(
        !isValid || folderIdParam === rootFolderData[0].id,
    );
  
        
//   const { data: breadcumbs } = useSuspenseQuery(
//     trpc.folder.getFolderBreadCumb.queryOptions({
//       workspaceID: workspaceData.id,
//       folderID: folderIdParam,
//     }),
//   );
//   const breadcumb = breadcumbs as FolderDataType[];

  const { data: selectedFolder } = useSuspenseQuery(
    trpc.folder.getChildrenFolder.queryOptions({
      workspaceID: workspaceData.id,
      folderID: folderIdParam,
    }),
  );

  // const { data: currentFolderData } = useSuspenseQuery(
  //   trpc.folder.CurrentFolder.queryOptions({
  //     workspaceID: workspaceData.id,
  //     folderID: folderIdParam,
  //   }),
  // );

  
  
  const selectedFolderChildren = selectedFolder as FolderDataType[];
  // const currentFolder = currentFolderData as FolderDataType;

  // console.log(breadcumb,"123")


  const router = useRouter();
  const pathName = usePathname();

//   const handleFolderChange = (id: string) => {
//     router.push(`${pathName}?id=${id}`, { scroll: false });
//   };


  const MAX_VISIBLE_BREADCRUMBS = 3;

//   const shouldTruncate = breadcumb.length > MAX_VISIBLE_BREADCRUMBS;

//   const visibleBreadcrumbs = shouldTruncate ? breadcumb.slice(-1) : breadcumb;

  const queryClient = useQueryClient();
//   const onSuccess = async () => {
//     await queryClient.invalidateQueries(
//       trpc.folder.getChildrenFolder.queryOptions({
//         folderID: folderIdParam,
//         workspaceID: workspaceData.id,
//       }),
//     );
//   };

  return (
    <div className="w-full h-full bg-transparent flex flex-col gap-2">
      <div className="w-full grid  grid-cols-[1fr_100px]  items-center px-1">
        

        {/* <CreateFolder
          onSucess={onSuccess}
          parentID={folderIdParam}
          workspaceID={workspaceData.id}
        /> */}
      </div>

      <div className="w-full  overflow-scroll h-full">
        <FolderSectionOfMove
        setIsOnRootFolder={setIsOnRootFolder}

          selectedFolderChildren={isOnRootFolder ? rootFolderData : selectedFolderChildren}
        />
      </div>
    </div>
  );
}

export default MoveItemsSection;
