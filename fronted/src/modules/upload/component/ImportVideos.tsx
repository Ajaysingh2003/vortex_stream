import React, { useState } from 'react'

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
import { ProviderType } from '@/modules/types'
import ConnectGoogleDrive from './ConnectGoogleDrive'
import { ChevronLeft, CloudDownload } from 'lucide-react'


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

    const Connect={
      "google_drive":<ConnectGoogleDrive/>,
      "dropbox":<div>dropbox</div>,
      "onedrive":<div>onedrive</div>,
      "vimeo":<div>vimeo</div>,
      "wistia":<div>wistia</div>
    }
    const [selectedProvider,setSelectedProvider]=useState<ProviderType>()
    const [contunue,setContinue]=useState<boolean>(false)

    // const [continue,setContinue]=useState(false)

  return (
   <Dialog>
      {/* <form> */}
        <DialogTrigger asChild>
          <Button className='rounded-md text-accent capitalize text-sm md:text-md' variant="outline">
            <CloudDownload/>
            Import
            </Button>
        </DialogTrigger>
          <DialogContent className="sm:max-w-sm pb-0 md:max-w-[650px] rounded-md px-0">
          <DialogHeader className='flex gap-3'>

            
          
            <DialogTitle className='text-lg w-fit md:text-xl font-semibold font-heading text-left px-3 md:px-6'>Import Video to Vortex</DialogTitle>
          </DialogHeader>
          
          {
            selectedProvider && contunue ? Connect[selectedProvider] : <section className='w-full flex flex-col gap-3 px-3 md:px-5'>
            
           
           <SelectProvider selectedProvider={selectedProvider} setSelectedProvider={setSelectedProvider}  intigration={intigration}/>
            <SaveVideos/>
          </section>
          }
          

          <DialogFooter className='grida grid-cols-2 flex-row-reverse   md:grid-cols-2 border-t border-stone-200 py-2 px-3 md:px-6'>
            

            <DialogClose asChild className='w-24 md:w-26'>
              <Button className='rounded-full text-xs md:text-md tracking-wide cursor-pointer font-subheading ' variant="outline">Cancel</Button>
            </DialogClose>
           <Button
           disabled={!selectedProvider}
           onClick={()=>setContinue((e)=>!e)}
            type="submit"
            className={`rounded-full  w-24 md:w-28 bg-primary-btn active:scale-[0.97] cursor-pointer tracking-wider font-subheading text-xs md:text-sm  transition-all duration-150`}
          >
            {contunue ? "Back" : "Continue"}
          </Button>
          </DialogFooter>
        </DialogContent>
      {/* </form> */}
    </Dialog>
  )
}

export default ImportVideos