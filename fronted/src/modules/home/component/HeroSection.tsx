import React from 'react'
import TopHeader from './TopHeader'
import HeroImageShow from './HeroImageShow'
import IntroVideo from './IntroVideo'

function HeroSection() {
  return (
    <div className=' relative  w-full min-h-screen  mt-10 md:mt-6  h-full'>
        {/* <div className="absolute top-0 h-full w-full inset-0 overflow-hidden">
        <div className="grid-pattern h-full w-full" />
      </div> */}
       <TopHeader />
 {/* <IntroVideo/> */}
    </div>
  )
}

export default HeroSection