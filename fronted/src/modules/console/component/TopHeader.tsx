import React from 'react'

interface Type {
    Header:string
    Btnchild:React.ReactNode
}
function TopHeader({Header,Btnchild}:Type) {
  return (
    <div className='flex items-center text-primary justify-between w-full'>
        <h3 className="font-semibold font-heading leading-relaxed tracking-tight  text-md md:text-xl lg:text-3xl">
            {Header}
          </h3>

          <div className='w-fit'>
            {Btnchild}
          </div>

    </div>
  )
}

export default TopHeader