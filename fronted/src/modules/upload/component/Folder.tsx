import { Button } from "@/components/ui/button";
import { RootFolderDataType, WorkspaceType } from "@/modules/types";
import { useTRPC } from "@/trpc/client";
import { skipToken, useQueries, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import Image from "next/image";
import React, { startTransition, useState, useTransition } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import FolderList from "./FolderList";

function Folder() {
  const [open, setOpen] = useState(true);
  const trpc=useTRPC()
  // console.log(rootFolderData,"vickysingh")

  const { data: workspace } = useSuspenseQuery(
          trpc.user.getWorkspace.queryOptions(),
        );
      
  const workspaceData = workspace as WorkspaceType;
      
  const { data: rootFolder } = useSuspenseQuery(
      trpc.folder.getRootFolder.queryOptions({ workspaceID: workspaceData.id }),
  );

  const rootFolderData = rootFolder as RootFolderDataType[];


      
  
  return (
    <div className="w-full">


      {open && (
        <div className="rounded-md  w-full  mt-2 md:mt-4  md:h-70  ">
          <div className="grid grid-col-1 gap-4 w-full h-full md:grid-cols-12 ">
            <div className=" col-span-5  h-full bg-[#e2ebf93c] rounded-md md:rounded-lg pl-2 md:pl-3 py-3 overflow-scroll">
              
                <RootFolderRow name="Content library" id={""}  rootFolder={rootFolderData} />
              
            </div>
            <div className=" col-span-7 hidden md:block h-full overflow-scroll">
              <FolderList/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Folder;

function FolderRow({ name, id }: { name: string; id: string | null }) {
  // const
  const router=useRouter()
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  console.log(name,"usus")
  const searchParams = useSearchParams();

  const activeState=searchParams.get("id") == id
  const onSelect=()=>{
    startTransition(() => {
      router.push(`${pathname}?id=${id}`, { scroll: false });
    });
  }

  return (

    <button onClick={onSelect} className={`flex flex-row gap-2  items-center capitalize ${activeState && "active-folder-btn"} w-full px-2 py-1 rounded-md cursor-pointer`}>
      <Image src={"/folder.png"} height={20} width={15} alt={name} />
      <span className="  capitalize font-semibold font-heading tracking-wide text-xs">
        {name}
      </span>
    </button>

  );
}

function RootFolderRow({
  name,
  id,
  rootFolder
}: {
  name: string;
  id: string | null;
  rootFolder: RootFolderDataType[];
}) {
  const [rootExpend, setRootExpend] = useState(false);
  console.log(rootFolder,"999")
  const router=useRouter()
  const pathname=usePathname()
  const ClickonLibrary=()=>{

    
    // startTransition(() => {
      router.push(`${pathname}?id=${id}`, { scroll: false });
    // });
    
  }

  return (
    <div className="flex flex-col relative">
      <div className=" absolute w-[1px] folder-bg-linear  left-[8px] h-[calc(100%-20px)] top-4"/>

      <div className="flex flex-row gap-1">
        <button
          className=" cursor-pointer"
          onClick={()=>setRootExpend((e) => !e)}
        >
          {!rootExpend ? (
            <ChevronRight className="size-4 text-stone-400" />
          ) : (
            <ChevronDown className="size-4 text-stone-400" />
          )}
        </button>
        <button onClick={ClickonLibrary} className="flex flex-row gap-2 items-center capitalize ">
          <Image src={"/folder.png"} height={20} width={15} alt={name} />
          <span className=" uppercase font-semibold font-heading tracking-tight text-xs">
            {name}
          </span>
        </button>
        
      </div>

        <div>
          {
       rootExpend && <div className="px-11 py-2 transition-all duration-300 ease-linear">
        {rootFolder.map((e)=>(
         <div className="py-1" key={e.id}>
             <FolderRow name={e.name} id={e.id} key={e.id} />
         </div>
        ))}
       </div>
        }
        </div>
    </div>
  );
}
