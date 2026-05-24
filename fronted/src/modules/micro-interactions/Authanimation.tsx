import React from 'react'
import UploadUI from './UploadUI'

function InteractiveAuthScreen() {
  return (
    <div className='w-full h-full'>
      <div className='flex items-center w-full h-full justify-center'>
        <div className=' w-full h-128'>
          <div className=' borderj-l-[0.5px] border-t-[1px]  border-[#eee] h-full w-full overflow-hidden rounded-md shadow-[0_-2px_0px_0_#0000000D]'>
              <UploadUI/>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InteractiveAuthScreen