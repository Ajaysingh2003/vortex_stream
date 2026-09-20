import { Button } from '@/components/ui/button'
import React from 'react'

function CtaSection() {
  return (
    
        <div className='side_2   justify-centezr mt-5 flex items-center flex-col md:flex-row gap-5'>
          <Button className=' h-11 capitalize secondary-btn w-full md:w-56 cursor-pointer border-[0.5px] border-[#0000009b] rounded-lg' variant={"ghost"}>Sign up</Button>
          <Button className='capitalize h-11 px-8 w-full md:w-56 rounded-md primary-btn font-bold  cursor-pointer text-white '>Join Waitlist</Button>
        </div>
  )
}

export default CtaSection