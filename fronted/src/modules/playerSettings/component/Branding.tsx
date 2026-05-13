import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sticker,LayoutTemplate } from 'lucide-react'
import React from 'react'

function Branding() {

  
  return (
    <div className='w-full h-full '>
      <div className='flex flex-col gap-2 md:gap-2 px-3 pt-2 pb-1'>
        <div className='heading'> 
          <h3 className='font-heading font-semibold text-md lg:text-md tracking-wide'>
            Branding Setting
          </h3>
        </div>
        <div className='w-full flex flex-col gap-2 md:gap-3'>
           <section className='w-full border-b-[0.5px] border-stone-200'>
        <div className='w-full grid grid-cols-[40px_1fr_auto] pb-3 gap-3'>
            <div className='flex items-center justify-center'>
                <div className='bg-stone-100  rounded-md px-2 py-2'>

                <Sticker/>
                </div>
            </div>
            <div className=' flex items-scenter justify-center  flex-col space-y-0.5 '>
                <h3 className='text-[14px] font-medium text-stone-800 capitalize leading-none'>Logo url</h3>
                <p className=' capitalize text-stone-500 text-[13px] leading-relaxed'>
                  logo for display on the video
                </p>
            </div>
            <div className=' flex items-center justify-center  pr-4'>
                <Input type='text' className='w-36 placeholder:text-black h-8 rounded-md shadow-none' placeholder='logo url' />
            </div>
        </div>
          </section>
           <section className='w-full border-b-[0.5px] border-stone-200'>
        <div className='w-full grid grid-cols-[40px_1fr_auto] pb-3 gap-3'>
            <div className='flex items-center justify-center'>
                <div className='bg-stone-100  rounded-md px-2 py-2'>

                <LayoutTemplate/>
                </div>
            </div>
            <div className=' flex items-scenter justify-center  flex-col space-y-0.5 '>
                <h3 className='text-[14px] font-medium text-stone-800 capitalize leading-none'>Logo Position</h3>
                <p className=' capitalize text-stone-500 text-[13px] leading-relaxed'>
                  logo for display on the video
                </p>
            </div>
            <div className=' flex items-center justify-center  pr-4'>
                <Select >
                  <SelectTrigger className="w-[150px] rounded-md max-h-8">
                    <SelectValue placeholder="Theme" />
                  </SelectTrigger>
                  <SelectContent side='top' sideOffset={64}  className='rounded-md  shadow-none'>
                    <SelectGroup className='rounded-md'>
                      <SelectItem className='py-1 rounded-md' value="top_right">Top Right</SelectItem>
                      <SelectItem className='py-1 rounded-md' value="top_left">Top Left</SelectItem>
                      <SelectItem className='py-1 rounded-md' value="bottom_right">Bottom Right</SelectItem>
                      <SelectItem className='py-1 rounded-md' value="bottom_left">Bottom Left</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
            </div>
        </div>
          </section>
          <section className='w-full border-b-[0.5px] border-stone-200'>
        <div className='w-full grid grid-cols-[40px_1fr_auto] pb-3 gap-3'>
            <div className='flex items-center justify-center'>
                <div className='bg-stone-100  rounded-md px-2 py-2'>
                  <Sticker/>
                </div>
            </div>
            <div className=' flex items-scenter justify-center  flex-col space-y-0.5 '>
                <h3 className='text-[14px] font-medium text-stone-800 capitalize leading-none'>Logo Position</h3>
                <p className=' capitalize text-stone-500 text-[13px] leading-relaxed'>
                  Choose where the logo will appear.
                </p>
            </div>
            <div className=' flex items-center justify-center  pr-4'>
                <Input type='text' className='w-36 h-8 placeholder:text-black rounded-md shadow-none' placeholder='100' />
            </div>
        </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Branding