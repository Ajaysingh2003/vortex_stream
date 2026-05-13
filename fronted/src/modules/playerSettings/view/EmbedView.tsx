"use client"

import { useTRPC } from '@/trpc/client'
import { useSuspenseQuery } from '@tanstack/react-query'
import React from 'react'

function EmbedView({videoId}:{videoId:string}) {
    const trpc=useTRPC()
    const {data}=useSuspenseQuery(trpc.video.getVideo.queryOptions({videoId}))
  return (
    <div>
        {JSON.stringify(data,null,2)}
    </div>
  )
}

export default EmbedView