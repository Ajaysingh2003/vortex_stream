import React from 'react'

interface Type {
    Header:string
    Btnchild:React.ReactNode
}
function TopHeader({Header,Btnchild}:Type) {

  return (
    <div className='flex items-center text-primary justify-between w-full'>
        <h3 className="font-semibold font-heading leading-relaxed tracking-tight  text-4xl md:text-xl lg:text-3xl truncate max-w-52 lg:max-w-128">
            {Header}
          </h3>

          <div className='w-fit'>
            {Btnchild}
          </div>

    </div>
  )
}

export default TopHeader