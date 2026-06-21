"use client";
import React from "react";
import FormVideoSection from "../component/FormVideoSection";
import { useSearchParams } from "next/navigation";
import EndScreenControl from "../component/EndScrennControl";
import EndScreenPreview from "../component/EndScreenPreview";

function VideoDetailsView() {
  
  const params= useSearchParams()
  const scope=params.get("setting_scope")
  console.log(scope,"89-leah")

      switch (scope){
    case 'form':
        // return <div className="min-h-400">
            <FormVideoSection/>
        // </div> 
    case 'end_screen' :
      return   <EndScreenPreview />
      // <div className="min-h-140">
        
      // </div>
  }
}

export default VideoDetailsView;
