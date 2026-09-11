"use client";
import React, { useEffect } from "react";
import FormVideoSection from "../component/FormVideoSection";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import EndScreenControl from "../component/EndScrennControl";
import EndScreenPreview from "../component/EndScreenPreview";
import CtaSetting from "../component/CtaSetting";
import CTAShow from "../component/CtaSetting";
import VideoUpdate from "../component/VideoUpdate";

function VideoDetailsView() {
  const searchParams = useSearchParams();
  const scope = searchParams.get("setting_scope");

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!searchParams.has("setting_scope")) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("setting_scope", "thumbnail");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  switch (scope) {

    case "thumbnail":
      return (
        <div className="">
          <VideoUpdate />
        </div>
      );
    case "analytics":
      return (
        <div className="">
          <VideoUpdate />
        </div>
      );
    case "domain_restriction":
      return (
        <div className="">
          <VideoUpdate />
        </div>
      );
    case "controls":
      return (
        <div className="">
          <VideoUpdate />
        </div>
      );
    case "general":
      return (
        <div className="">
          <VideoUpdate />
        </div>
      );
    case "subtitle":
      return (
        <div className="">
          <VideoUpdate />
        </div>
      );
    

    case "form":
      return (
        <div className="">
          <FormVideoSection />
        </div>
      );
    case "end_screen":
      return <EndScreenPreview />;
    case "chapter":
      return <EndScreenPreview />;
    case "cta":
      return <CTAShow isPremium={true} />;
    default:
      return (
        <div>
          <VideoUpdate />
        </div>
      );
  }

}

export default VideoDetailsView;
