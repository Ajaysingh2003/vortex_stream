import InteractiveAuthScreen from '@/modules/micro-interactions/Authanimation'
import Authanimation from '@/modules/micro-interactions/Authanimation'
import React from 'react'

function layout({children}: {children: React.ReactNode}) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-12 '>
        <div className='col-span-12 md:col-span-6'>{children}</div>
        <div className='col-span-12 md:col-span-6 rounded-lg  overflow-hidden'>
            <InteractiveAuthScreen/>
        </div>
        
    </div>
  )
}

export default layout