import { useTRPC } from '@/trpc/client'
import { useSuspenseQuery } from '@tanstack/react-query'
import React from 'react'
import Folder from './Folder'

function SaveVideos() {
    const trpc=useTRPC()
    const {data:workspaces}=useSuspenseQuery(trpc.user.getWorkspace.queryOptions())

    console.log(workspaces,"leah jaye")
    
  return (
    
   <Folder/>
  )
}

export default SaveVideos