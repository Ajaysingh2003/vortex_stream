"use client"

import { useTRPC } from '@/trpc/client'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import React, { Suspense, use } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import VideoPlayer from '../component/VideoPlayer'

function EmbedView({ videoId }: { videoId: string }) {
  const trpc = useTRPC()
  

  // if (error) {
  //   return (
  //     <div className="flex h-screen w-full flex-col items-center justify-center  text-black text-2xl">
  //       <p className="">{error.message}</p>
  //     </div>
  //   )
  // }

  return (
    <div className='w-full h-full  relative' >
      <div className='w-full bg-red-300 h-full'>
        <VideoPlayer videoId={videoId}/>
      </div>
    </div>
  )
}

export default EmbedView