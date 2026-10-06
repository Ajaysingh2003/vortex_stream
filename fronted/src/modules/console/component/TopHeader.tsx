import React from 'react'

interface Type {
    Header:string
    Btnchild:React.ReactNode
    otherLine?:boolean
}
function TopHeader({Header,Btnchild,otherLine=false}:Type) {

  return (
    <div className={otherLine ? 'flex flex-col md:flex-row md:items-center justify-between gap-4' : 'flex items-center justify-between w-full'}>
        <h3 className="font-semibold font-heading leading-relaxed tracking-tight  text-2xl md:text-xl lg:text-3xl truncate max-w-52 lg:max-w-128">
            {Header}
          </h3>

          <div className='w-fit'>
            {Btnchild}
          </div>

    </div>
  )
}

export default TopHeader