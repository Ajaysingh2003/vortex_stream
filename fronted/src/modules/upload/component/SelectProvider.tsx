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

type intigrationType ={
    intigration:{
        label:string;
        scope:string;
        logo:string;
    }[]
}

function SelectProvider({intigration}:intigrationType) {
  return (
    <Select>
                <SelectTrigger className="w-full rounded-md min-w-full focus-within:rounded-md data-[state=open]:border data-[state=open]:border-blue-500">
                    <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent className='rounded-md top-10'>
                    <SelectGroup>
                        {
                            intigration.map((e)=>(
                                <SelectItem value={e.scope} className='flex items-center gap-4'>
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
  )
}

export default SelectProvider