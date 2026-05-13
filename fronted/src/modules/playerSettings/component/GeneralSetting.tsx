import React from 'react'
import ItemRow from './ItemRow'
import { Captions, Infinity, Play, PlayCircle, Timer } from 'lucide-react'

function GeneralSetting() {

  let item=[
    {
      label:"autoplay",
      description:"Automatically play the video when the player loads.",
      onChange:()=>{},
      icon:<Play className='size-5'/>
    },{
      label:"preload video",
      description:"Preload video metadata when the player loads, enabling faster playback.",
      onChange:()=>{},
      icon:<Timer className='size-5'/>
    },{
       label:"Loop",
      description:"video will restart when it reaches the end ",
      onChange:()=>{},
      icon:<Infinity className=''/>
    },
     {
      label:"captions",
      description:"Enable Captions",
      onChange:()=>{},
      icon:<Captions className='size-5'/>
    },
  ]

  return (
    <div className='w-full h-full '>
      <div className='flex flex-col gap-2 md:gap-2 px-3 pt-2 pb-1'>
        <div className='heading'> 
          <h3 className='font-heading font-semibold text-md lg:text-md tracking-wide'>
            General Setting
          </h3>
        </div>
        <div className='w-full flex flex-col gap-2 md:gap-3'>
          {
            item.map((e)=>(
              <ItemRow label={e.label} description={e.description} onChange={e.onChange} icon={e.icon}/>
            ))
          }
        </div>
      </div>
    </div>
  )
}

export default GeneralSetting