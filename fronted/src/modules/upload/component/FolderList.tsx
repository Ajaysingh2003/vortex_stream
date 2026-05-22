import React, { useState } from 'react'

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { skipToken, useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FolderDataType, RootFolderDataType, WorkspaceType } from '@/modules/types';
import { useTRPC } from '@/trpc/client';
import Link from 'next/link';
import { FolderArchive, FolderCode, FolderKanbanIcon, Home } from 'lucide-react';
import FolderTable from './FolderTable';
import BlankRootFolder from './BlankFolder';
import BlankFolder from './BlankFolder';
import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { useConsoleContext } from '@/modules/console/context/ConsoleContext';
import CreateFolder from './CreateFolder';


function FolderList() {

    const trpc = useTRPC();

  const { data: workspace } = useSuspenseQuery(
    trpc.user.getWorkspace.queryOptions(),
  );

  const workspaceData = workspace as WorkspaceType;

  const searchParams=useSearchParams()

  const folderIdParam=searchParams.get("id")
  
  const isValid=folderIdParam && folderIdParam.trim() !==""

// const { data: selectedFolder } = useQuery(
//   trpc.folder.getChildrenFolder.queryOptions(
//     isValid
//       ? { workspaceID: workspaceData.id, folderID: folderIdParam }
//       : skipToken
//   )
// );


    const { data: breadcumbs } = useSuspenseQuery(
    trpc.folder.getFolderBreadCumb.queryOptions(
      { workspaceID: workspaceData.id, folderID: folderIdParam }
    )
    );

     const { data: selectedFolder } = useSuspenseQuery(
      trpc.folder.getChildrenFolder.queryOptions(
    
       { workspaceID: workspaceData.id, folderID: folderIdParam }
      
      )
    );

  const { data: currentFolderData} = useSuspenseQuery(
  trpc.folder.CurrentFolder.queryOptions(
    
       { workspaceID: workspaceData.id, folderID: folderIdParam }
      
  )
);

    const selectedFolderChildren=selectedFolder as FolderDataType[] 

    const currentFolder=currentFolderData as FolderDataType
    

    const breadcumb = breadcumbs as FolderDataType[]

    // console.log(breadcumb,"123")

    
    const consoleContext=useConsoleContext()
    const router=useRouter()
    const pathName=usePathname()
    
    const handleFolderChange=(id:string)=>{
      router.push(`${pathName}?id=${id}`,{scroll:false})
    }
    
    const MAX_VISIBLE_BREADCRUMBS = 3;
    
    const shouldTruncate = breadcumb.length > MAX_VISIBLE_BREADCRUMBS;
    
    const visibleBreadcrumbs = shouldTruncate 
    ? breadcumb.slice(-1) 
    : breadcumb;

    const queryClient=useQueryClient()
    const onSuccess=async()=>{
      await queryClient.invalidateQueries(
          trpc.folder.getChildrenFolder.queryOptions({folderID:folderIdParam,workspaceID:workspaceData.id}),
        );
    }
    
    if (folderIdParam == "" || folderIdParam ==null) return <BlankFolder workspaceID={workspaceData.id} name='Root' message="File's will be here"/>
  return (
    <div className='w-full h-full bg-transparent flex flex-col gap-2'>
        <div className='w-full grid  grid-cols-[1fr_100px]  items-center px-1'>
          <Breadcrumb className="w-full">
              <BreadcrumbList className="flex items-center flex-nowrap text-xs">
                
                {/* 1. Root Anchor */}
                <BreadcrumbItem onClick={() => handleFolderChange("")} className="cursor-pointer text-stone-800 shrink-0">
                  <Home className="size-[14px]" />
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
                      className={`capitalize cursor-pointer shrink-0 truncate max-w-[100px] ${
                        e.id === folderIdParam ? "text-stone-900 font-semibold pointer-events-none" : "text-stone-500"
                      }`}
                      title={e.name}
                    >


                      {e.name}

                    </BreadcrumbItem>
                  </React.Fragment>
                ))}

              </BreadcrumbList>
            </Breadcrumb>

           <CreateFolder onSucess={onSuccess} parentID={folderIdParam} workspaceID={workspaceData.id}/>

        </div>

        <div className='w-full  overflow-scroll h-full'>
                    <FolderTable workspace={workspaceData} folderID={folderIdParam} selectedFolderChildren={selectedFolderChildren}/>    
        </div>

    </div>
  )
}

export default FolderList

