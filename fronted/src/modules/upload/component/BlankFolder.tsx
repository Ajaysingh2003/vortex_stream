import { Button } from "@/components/ui/button";
import { useConsoleContext } from "@/modules/console/context/ConsoleContext";
import Image from "next/image";
import CreateFolder from "./CreateFolder";
import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

function BlankFolder({name,message,workspaceID}:{name:string,message:string,workspaceID:string}) {
  // const consoleContext=useConsoleContext()
  const queryClient=useQueryClient()
   const  trpc=useTRPC()
  const onSucess=async()=>{
    await queryClient.invalidateQueries(trpc.folder.getRootFolder.queryOptions({workspaceID:workspaceID}))
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      
      <div className="relative mb-4">
        <div className="absolute inset-0 scale-125 rounded-full bg-violet-500/10 blur-2xl" />

        <Image
          src="/empty.svg"
          alt="Empty folder"
          width={120}
          height={120}
          className="relative z-10 object-contain"
          priority
        />
      </div>

      <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">
        {/* {name} folder is empty */}
        {message}
      </h3>

      <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-stone-500 dark:text-stone-400">
       Create A Folder To Organize Your Content.
      </p>

      <CreateFolder workspaceID={workspaceID} onSucess={onSucess} parentID={""} />
    </div>
  );
}

export default BlankFolder;