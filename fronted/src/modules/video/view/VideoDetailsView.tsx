"use client";
import React from "react";
import FormVideoSection from "../component/FormVideoSection";
import { useSearchParams } from "next/navigation";
import EndScreenControl from "../component/EndScrennControl";
import EndScreenPreview from "../component/EndScreenPreview";
import CtaSetting from "../component/CtaSetting";
import CTAShow from "../component/CtaSetting";

function VideoDetailsView() {
  const params = useSearchParams();
  const scope = params.get("setting_scope");


  switch (scope) {
    case "form":
      return (
        <div className="">
          <FormVideoSection />
        </div>
      );
    case "end_screen":
      return <EndScreenPreview />;
    case "subtitle":
      return <EndScreenPreview />;
    case "chapter":
      return <EndScreenPreview />;
    case "cta":
      return <CTAShow isPremium={true} />;

    

    // <div className="min-h-140">

    // </div>
  }
}

export default VideoDetailsView;
