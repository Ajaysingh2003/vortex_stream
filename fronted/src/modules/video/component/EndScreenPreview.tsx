import Image from 'next/image';
import React from 'react'
import EndScreenShowOff from './EndScreenShowOff';

function EndScreenPreview() {
    const thumbnail =
    "https://pub-db02f4666efb4ae9b337950ff0610772.r2.dev/blogimages/madisonbeer%2BCHWB_w9lckT-1-1200x630.jpg";
  
  return (
    <div className='w-full h-full '>
        <div className='w-full h-full overflow-hidden relative min-h-100   lg:min-h-[700px] rounded-2xl bg-black/80'>

            <div className=' absolute w-full h-full'>
                <EndScreenShowOff/>
            </div>
        </div>
    </div>
  )
}

export default EndScreenPreview