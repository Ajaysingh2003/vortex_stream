"use client"
import { Button } from '@/components/ui/button'
import React from 'react'
import { Save,RotateCcw } from 'lucide-react'
// import Settings from '../component/Settings'
import Preview from '../component/Preview'
import { Settings } from '../component/Settings'
function PlayerSettingsView() {
  return (
    <div className=' w-full h-full px-4 md:px-6 p-3 md:px-10 md:py-4'>
        <div className='flex items-center justify-between  my-2 md:my-4'>
            <div className='right '>
                <h3 className='font-heading leading-8 font-bold tracking-wider text-lg md:text-xl lg:2xl capitalize'>Player Settings</h3>
                <p className='font-content text-sm md:text-[15px]'>build the perfect experience for your audience</p>
            </div>
            <div className='left flex items-center gap-4'>
                <Button variant={"outline"} font-heading className='rounded-lg'><RotateCcw className='size-4'/> <span className='text-sm tracking-tight'>
                    Reset to default
                </span></Button>
                <Button className='rounded-lg font-heading font-bold text-sm md:text-sm tracking-wide md:-tracking-wider bg-[#7067f3] bg-primary-btn'> <Save className='size-4'/>  Save Changes</Button>
            </div>
        </div>
        <div className=' grid grid-cols-1 md:grid-cols-12 gap-3  h-full w-full'>
            <div className=' col-span-7 h-full     w-full'>
                <Settings>
                    <Settings.Menu/>
                    <Settings.Content/>
                </Settings>
            </div>
            <div className=' col-span-5 w-full'>
                <Preview/>
            </div>
        </div>
    </div>
  )
}

export default PlayerSettingsView