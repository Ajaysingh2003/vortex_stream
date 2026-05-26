import React from 'react'


import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/client';
import { useSearchParams } from 'next/navigation';
import { FolderDataType, ProviderType, WorkspaceType } from '@/modules/types';


type intigrationType ={
    intigration:{
        label:string;
        scope:string;
        logo:string;
    }[]
    selectedProvider:ProviderType | undefined
    setSelectedProvider: React.Dispatch<React.SetStateAction<ProviderType | undefined>>
}

function SelectProvider({intigration,selectedProvider,setSelectedProvider}:intigrationType) {


      const searchParams=useSearchParams()
    
      const folderIdParam=searchParams.get("id")


      const trpc=useTRPC()
        const { data: workspace } = useSuspenseQuery(
                trpc.user.getWorkspace.queryOptions(),
              );
            
        const workspaceData = workspace as WorkspaceType;
            
    const { data: selectedFolder } = useSuspenseQuery(
      trpc.folder.getFolderBreadCumb.queryOptions(
    
       { workspaceID: workspaceData.id, folderID: folderIdParam }
      
    )
  );
      const selectedFolderChildren=selectedFolder as FolderDataType[] 

      console.log(selectedFolderChildren,"singha")
    let selectedPath : string |null="Library/"

   const path = selectedFolderChildren.length==0 ? selectedPath : [{name:"Library"},...selectedFolderChildren].map((e)=>e.name).join(",").replaceAll(',',"/")
  return (
    <div className='grid grid-cols-2 gap-3 md:gap-16 items-start justify-center'>
       <div className='font-semibold flex flex-col gap-2'>
            <label form='source' className='text-sm  leading-relaxed tracking-wide'>
                Source
            </label>
             <Select value={selectedProvider} onValueChange={(e)=>setSelectedProvider(e as ProviderType)}>
                <SelectTrigger id='source' className="w-full rounded-md min-w-full focus-within:rounded-md data-[state=open]:border data-[state=open]:border-blue-500">
                    <SelectValue placeholder="Import from" />
                </SelectTrigger>
                <SelectContent className='rounded-md top-10'>
                    <SelectGroup>
                        {
                            intigration.map((e)=>(
                                <SelectItem key={e.scope} value={e.scope} className='flex items-center gap-4'>
                                   <div className=' relative  rounded-sm  flex items-center justify-center  overflow-hidden '>
                                    <Image src={e.logo} height={16} className='object-contain' width={16} alt={e.label}/>
                                   </div>
                                        <span className=' capitalize tracking-wide'>  {e.label}</span>
                                </SelectItem>
                                   
                            ))
                        }
                    </SelectGroup>
                </SelectContent>
    </Select>
       </div>

    <div className='w-full flex flex-col gap-2 '>
         <label form='destination' className='text-sm font-semibold  leading-relaxed tracking-wide'>
                Destination
            </label>

        <Input readOnly  className='w-full rounded-md  focus-within:rounded-md data-[state=open]:border data-[state=open]:border-blue-500' value={path} />
    </div>
    </div>
  )
}

export default SelectProvider