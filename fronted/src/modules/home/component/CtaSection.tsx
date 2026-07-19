import { Button } from '@/components/ui/button'
import React from 'react'

function CtaSection() {
  return (
    
        <div className='side_2  justify-center mt-5 flex items-center gap-2'>
          <Button className=' capitalize  cursor-pointer border-[0.5px] border-[#0000009b] rounded-lg' variant={"ghost"}>Sign up</Button>
          <Button className='capitalize px-8 rounded-md bg-main-btn font-bold  cursor-pointer text-white '>Join Waitlist</Button>
          {/* <Button className='capitalize rounded-md bg-primary-btn  cursor-pointer text-white px-3'>Join Waitlist</Button> */}
        </div>
  )
}

export default CtaSection