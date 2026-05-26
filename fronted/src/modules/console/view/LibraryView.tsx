"use client"
import React from 'react'
import TopHeader from '../component/TopHeader'
import UploadFile from '../component/UploadFile'
import ImportVideos from '@/modules/upload/component/ImportVideos'

function LibraryView() {
  return (
    <div className="w-full h-full min-h-screen relative">
      <div className="px-6 md:px-12 py-4 w-full">
        <TopHeader
          Header={"Library"}
          Btnchild={
            <div className="flex flex-row gap-3">
                <ImportVideos/>
              <UploadFile />
            </div>
          }
        />
      </div>
    </div>
  )
}

export default LibraryView