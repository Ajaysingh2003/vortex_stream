import React, { useState } from 'react'



import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { FolderKanbanIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'
import { useTRPC } from '@/trpc/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

function CreateFolder({parentID,workspaceID,onSucess}:{parentID:string | null,workspaceID:string,onSucess:()=>void}) {


    const [openDialog,setOpenDialog]=useState(false)
    const [folder,setNewFolder]=useState("")

    const trpc=useTRPC()
    const createFolderMutate = useMutation(trpc.folder.createFolder.mutationOptions({
      onSuccess:async()=>{
        
        onSucess()
        setOpenDialog(false)
        toast.success("Folder Created Successfully.")
      },
      onError:(err)=>{
        const mess=err.message

        // const errMessage=mess.charAt(0).toUpperCase()
        toast.error(mess)
      }
    }))

    const handleCreateFolder=async()=>{
     await createFolderMutate.mutateAsync({name:folder,parentID:parentID,workspaceID:workspaceID})
    }
    

  return (
    <Dialog open={openDialog} onOpenChange={(e)=>setOpenDialog(e)}>
    <DialogTrigger asChild>

    <Button variant={"secondary"} className='rounded-md cursor-pointer bg-black/5 hover:bg-black/8 text-stone-700 leading-relaxed  max-h-8  text-xs flex items-center justify-center gap-1 border-[0.5px] border-stone-200'>
             <FolderKanbanIcon className='size-4'/> <span> New Folder</span></Button>


  </DialogTrigger>
  <DialogContent className="lg:w-84 rounded-xl">
                  <DialogHeader>
                    <DialogTitle>Create Folder</DialogTitle>
                  </DialogHeader>
                  <section>
                    <Input
                      onChange={(e) => setNewFolder(e.target.value)}
                      placeholder="Folder name"
                      className="rounded-lg border-none outline-none shadow-none ring-0  focus-within:ring-violet-300 focus-within:shadow-none"
                    />
                  </section>
                  <DialogFooter className="w-full">
                    <div className="grid grid-cols-2 gap-5 items-center  w-full justify-center">
                      <Button
                        onClick={() => setOpenDialog(false)}
                        className="w-full rounded-lg text-black hover:bg-black/5 cursor-pointer bg-black/10 "
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateFolder}
                        disabled={createFolderMutate.isPending || !folder.trim()}
                        className="w-full cursor-pointer rounded-lg text-white bg-violet-400 hover:bg-violet-300"
                      >
                        Create
                      </Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
            </Dialog>
  )
}

export default CreateFolder