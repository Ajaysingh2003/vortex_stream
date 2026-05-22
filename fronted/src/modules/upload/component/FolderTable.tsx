import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FolderDataType, WorkspaceType } from "@/modules/types";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { EllipsisVertical } from "lucide-react";
import Image from "next/image";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import React from 'react'
import { usePathname, useRouter } from "next/navigation";

function FolderTable({workspace, folderID,selectedFolderChildren}:{workspace:WorkspaceType , folderID : string | null,selectedFolderChildren:FolderDataType[]}) {
    // const trpc=useTRPC()

    const router=useRouter()
    const pathName=usePathname()

    const handleOpenFolder=(id:string)=>{
        router.push(`${pathName}?id=${id}`,{scroll:false})
    }
   


  return (
    <Table>
  <TableCaption className=" capitalize text-xs md:text-sm">
    {
      selectedFolderChildren.length > 0 ?  "A List Of your recent folder" : "This Folder is empty."
    }
  </TableCaption>
  <TableHeader className=" rounded-md p-1">
    <TableRow className="font-subheading text-xs border-b-[0.5px] border-stone-300 p-1">
      <TableHead className=" w-[120px] tracking-wide">Name</TableHead>
      <TableHead>Type</TableHead>
      <TableHead>Modified</TableHead>
      <TableHead className="w-[50px]"></TableHead>
    </TableRow>
  </TableHeader>
  
  <TableBody className="text-xs font-content text-stone-700 ">
    {selectedFolderChildren && selectedFolderChildren.length > 0 ? (
      selectedFolderChildren.map((e) => (
        <TableRow key={e.id} className="hover:bg-stone-100  border-b-[0.01px] border-stone-300 cursor-pointer rounded-sm   transition-colors" role="button" onClick={()=>handleOpenFolder(e.id)}>
          
          {/* <Button onClick={()=>alert(e.name)} className="" variant={"secondary"} > */}
            <TableCell className="font-medium max-w-[250px] text-lg" >
            <div className="flex items-center gap-2">
              <Image 
                src="/folder.png" 
                height={18} 
                width={18} 
                alt="folder icon" 
                className="shrink-0"
              />
              <span className="truncate text-xs md:text-sm  inline-block" title={e.name}>
                {e.name}
              </span>
            </div>
          </TableCell>
          
          <TableCell className="text-stone-500 text-xs md:text-sm">
            Folder
          </TableCell>
          
          <TableCell className="text-stone-500 text-xs md:text-sm" suppressHydrationWarning>
            {new Date(e.updatedAt).toLocaleDateString()}
          </TableCell>
          
          <TableCell className="text-right">

                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" className="bg-transparent hover:bg-transparent" >
                        <EllipsisVertical className="  size-3"/>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[100px] rounded-lg overflow-hidden">
                    <DropdownMenuGroup>
                    <DropdownMenuLabel className="py-1">Controls</DropdownMenuLabel>
                    <DropdownMenuSeparator/>
                    <DropdownMenuItem className="py-1 px-2 uppercases tracking-wide text-[13px] rounded-md" >Rename</DropdownMenuItem>
                    <DropdownMenuItem className="py-1 px-2 rounded-md text-[13px] tracking-wide uppercases ">Delete</DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
                </DropdownMenu>

          </TableCell>

          {/* </Button> */}
        </TableRow>
      ))
    ) : (
      null
    )}
  </TableBody>
</Table>
  )
}

export default FolderTable