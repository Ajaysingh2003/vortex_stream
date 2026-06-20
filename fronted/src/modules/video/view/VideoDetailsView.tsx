"use client";
import React from "react";
import FormVideoSection from "../component/FormVideoSection";
import { useSearchParams } from "next/navigation";

function VideoDetailsView() {
  
  const params= useSearchParams()
  const scope=params.get("setting_scope")
  console.log(scope,"89-leah")
      switch (scope){
    case 'form':
        return <FormVideoSection/>
  }
}

export default VideoDetailsView;
