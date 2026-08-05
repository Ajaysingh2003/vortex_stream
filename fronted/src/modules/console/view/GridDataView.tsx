"use client"
import { LibraryType } from '@/modules/types'
import React from 'react'
import GridCard from '../component/GridCard'

function GridDataView({items}:{items:LibraryType[]}) {
  return (
    <div className="grid  grid-cols-1  md:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        
        <GridCard key={item.id} item={item}/>
      ))}
    </div>
  )
}

export default GridDataView