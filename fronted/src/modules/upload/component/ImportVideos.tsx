import React from 'react'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import SelectProvider from './SelectProvider'
import SaveVideos from './SaveVideos'


function ImportVideos() {

    let intigration=[
        {
            label:"google drive",logo:"/intigration/google-drive.png",scope:"google_drive"
        },
        {
            label:"dropbox",logo:"/intigration/dropbox.png",scope:"dropbox"
        },
        {
            label:"oneDrive",logo:"/intigration/oneDrive.svg",scope:"onedrive"
        },
        {
            label:"vimeo",logo:"/intigration/vimeo.png",scope:"vimeo"
        },
        {
            label:"wistia",logo:"/intigration/wistia.svg",scope:"wistia"
        },

    ]
  return (
   <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button variant="outline">Open Dialog</Button>
        </DialogTrigger>
            <DialogContent className="sm:max-w-sm md:max-w-[390px] rounded-md">
          <DialogHeader>
            <DialogTitle className='text-lg md:text-xl font-semibold font-heading'>Import Video to Vortex</DialogTitle>
            <DialogDescription className=''>
              Make changes to your profile here. Click save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>
          <section className='w-full flex flex-col gap-3 '>
            
           
           <SelectProvider intigration={intigration}/>
            <SaveVideos/>
          </section>
          <DialogFooter className='grid grid-cols-1 md:grid-cols-2'>
            <DialogClose asChild>
              <Button className='rounded-md tracking-wide cursor-pointer font-subheading' variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" className='rounded-md bg-violet-400 hover:bg-violet-500 cursor-pointer tracking-wider font-subheading '>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}

export default ImportVideos