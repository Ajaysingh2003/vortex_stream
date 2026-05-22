import React from 'react'
import ItemRow from './ItemRow'
import { ChartBarDecreasing, ChevronRightCircleIcon, Download, FullscreenIcon, GripHorizontal, Infinity, MonitorOff, Play, PlayCircle, Timer, Volume, Volume1 } from 'lucide-react'
import { FullScreenIcon } from '@hugeicons/core-free-icons'

function ControlsSetting() {

  let item=[
    {
      label:"Download Button",
      description:"Enable Download button",
      onChange:()=>{},
      icon:<Download className='size-5'/>
    },{
      label:"disable seek bar",
      description:"Prevent users from skipping through the video.",
      onChange:()=>{},
      icon:<GripHorizontal className='size-5'/>
    },{
       label:"Show Controls",
      description:"Hide the control bar on the page",
      onChange:()=>{},
      icon:<MonitorOff className=''/>
    },
    {
       label:"Skip forward / back (N seconds)",
      description:"Decide how many seconds to skip",
      onChange:()=>{},
      icon:<Infinity className=''/>
    },
    {
       label:"Casting",
      description:"Allow users to cast the video to other devices.",
      onChange:()=>{},
      icon:<ChartBarDecreasing className=''/>
    },
    {
       label:"fullscreen",
      description:"Show fullscreen button",
      onChange:()=>{},
      icon:<FullscreenIcon className=''/>
    },
    {
       label:"volume",
      description:"Show volume control",
      onChange:()=>{},
      icon:<Volume1 className=''/>
    },
  ]

  return (
    <div className='w-full h-full '>
      <div className='flex flex-col gap-2 md:gap-2 px-3 pt-2 pb-1'>
        <div className='heading'> 
          <h3 className='font-heading font-semibold text-md lg:text-md tracking-wide'>
            Controls Setting
          </h3>
        </div>
        <div className='w-full flex flex-col gap-2 md:gap-3'>
          {
            item.map((e)=>(
              <ItemRow key={e.label} label={e.label} description={e.description} onChange={e.onChange} icon={e.icon}/>
            ))
          }
        </div>
      </div>
    </div>
  )
}

export default ControlsSetting