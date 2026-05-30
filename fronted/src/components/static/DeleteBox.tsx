import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { DeletePutBackIcon } from '@hugeicons/core-free-icons'

function DeleteBox({handleDelete,message}:{handleDelete:(e:React.MouseEvent)=>void,message:string}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
       <button className="hover:bg-black/4 rounded-md w-full cursor-pointer focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex items-center gap-2 px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">Delete</button>
      </AlertDialogTrigger>
      <AlertDialogContent className='rounded-md p-0'>
        <AlertDialogHeader className='p-4'>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className='bg-[#f7f7f7] px-4 border-t-[0.5px] border-[#b8b7b7] py-2 '>
          <AlertDialogCancel className='rounded-md'>Cancel</AlertDialogCancel>
          <AlertDialogAction className='rounded-md flex items-center justify-center' variant={"destructive"} onClick={handleDelete}>
            <HugeiconsIcon className='size-4' icon={DeletePutBackIcon} />
            <span className=''>Delete</span>
            </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default DeleteBox