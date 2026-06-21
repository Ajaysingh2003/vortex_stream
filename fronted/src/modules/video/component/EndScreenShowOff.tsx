import React from "react";
import { useVideoContext } from "../context/VideoContext";
import { VideoAsset } from "@/modules/types";
import Image from "next/image";
import { formatDuration } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Facebook, Instagram, Linkedin, Mail, NewTwitterIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import { Copy, X } from "lucide-react";
import { Input } from "@/components/ui/input";

function EndScreenShowOff() {
  const search_scope = useSearchParams();
  search_scope.get("");
  const { selectMoreVideo, endScreen } = useVideoContext()!;
  return (
    <div className="w-full h-full relative">
      {selectMoreVideo.length > 0 && <MoreVideo items={selectMoreVideo} />}
      {endScreen == "call_to_action" && <CtaSection />}
      {endScreen == "custom_image" && <CustomImage />}
      {endScreen == "share_button" && <ShareContent />}
      {endScreen == "custom_message" && <CustomMssagePreview />}

    </div>
  );
}

export default EndScreenShowOff;

function MoreVideo({ items }: { items: VideoAsset[] }) {
  const thumbnail =
    "https://pub-db02f4666efb4ae9b337950ff0610772.r2.dev/blogimages/madisonbeer%2BCHWB_w9lckT-1-1200x630.jpg";

  return (
    <div className="absolute bottom-0 p-6 space-y-2 w-full">
      <h4 className="text-white font-heading text-md font-semibold tracking-wider capitalize">
        select More video
      </h4>
      <div className="w-full mt-4">
        <ul className="w-full grid grid-cols-3 gap-3">
          {items.map((item) => (
            <li className="w-full rounded-lg min-h-18 lg:min-h-0 overflow-hidden relative">
              <div className=" absolute w-full h-full bg-transparent -z-10">
                a
              </div>
              <div className="w-full h-full bg-transparent absolute min-w-0">
                <div className="flex w-full h-full px-3 flex-col justify-between py-1 lg:py-2">
                  <h3 className="text-white  text-sm  capitalize font-medium truncate ">
                    {item.title}
                  </h3>
                  <div className="flex justify-end">
                    <p className="bg-white/70 text-black/80 font-medium  text-xs px-1 py-0.5 rounded-sm ">
                      {/* 01:20 */}
                      {item.duration ? formatDuration(item.duration) : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* <div className=" relative w-full h-full"> */}
              <Image
                className="w-full  h-full object-cover"
                unoptimized
                src={(item.thumbnail && "") || thumbnail}
                height={100}
                width={100}
                alt=""
              />
              {/* </div> */}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CtaSection() {
  const { ctaBtnText, ctaBtnUrl, ctaSubTitle, ctaTitle } = useVideoContext()!;
  return (
    <div className="w-full flex justify-center items-center h-full">
      <div className="flex  text-white flex-col gap-3">
        <h3 className="text-lg lg:text-3xl font-heading  text-center max-w-full tracking-wider">
          {ctaTitle || "Title"}
        </h3>

        <h4 className="text-md lg:text-xl font-subheading  text-center max-w-full tracking-wider">
          {ctaSubTitle || "Subtitle"}
        </h4>

        <Button
          variant={"secondary"}
          className=" capitalize hover:bg-white/95  cursor-pointer rounded-md px-3 py-2"
        >
          <Link href={ctaBtnUrl}>{ctaBtnText || "add link"}</Link>
        </Button>
      </div>
    </div>
  );
}

function CustomImage() {
  const { customImagePreview } = useVideoContext()!;
  return (
    <div className="w-full h-full">
      <div className="w-full h-full relative">
        {!customImagePreview ? <div className="w-full h-full flex items-center justify-center">
            <p className=" tracking-wider text-xs sm:text-sm text-white/70 capitalize    text-center">Add an image to see preview</p>
        </div>:<Image src={customImagePreview} className="w-full h-full object-contain" height={100} width={100} alt="" />}
    </div>
    </div>
  );
}


function ShareContent () {
    const url="https://google.com"
    const {instagramUrl,facebookUrl,mail,xUrl,linkedinUrl} =useVideoContext()!
    return <div className="w-full h-full flex items-center justify-center">
        <div className="flex items-center flex-col gap-4">
            <div className=" space-y-1">
                <h3 className="text-lg lg:text-3xl font-heading  text-center max-w-full tracking-wider text-white/80 capitalize">Share this video</h3>
            <p className=" tracking-wide text-white/70 font-medium">Help others discover this content</p>
            </div>

            <div className=" flex items-center justify-center gap-2 flex-wrap">
                <Logo  icon={Instagram} url={instagramUrl}/>
                <Logo  icon={Facebook} url={facebookUrl}/>
                <Logo  icon={Linkedin} url={linkedinUrl}/>
                <Logo  icon={NewTwitterIcon} url={xUrl}/>
                <Logo  icon={Mail} url={mail}/>
            </div>

            <div className=" relative w-full">
                <button className=" absolute text-white/80 cursor-pointer h-full top-0 flex items-center justify-center  right-0 cur  pr-2">
                    <Copy className="size-5"/>
                </button>
                <Input readOnly value={url}  className="rounded-md  text-white/90 bg-transparent border-stone-400" />
            </div>
        </div>
    </div>
}

function Logo({icon,url}:{icon:IconSvgElement,url:string}){
    return <div className=" p-2 lg:p-3 bg-white/10  rounded-full">
        <Link href={url}>
            <HugeiconsIcon size={24} icon={icon} className="text-white/90 font-bold" />
        </Link>
    </div>
}

function CustomMssagePreview(){
    const {customDescription,customTitle} =useVideoContext()!

    return <div className="w-full flex justify-center items-center h-full">
      <div className="flex  text-white flex-col gap-3">
        <h3 className="text-md lg:text-xl font-heading  text-center max-w-full tracking-wider">
          {customTitle || "Title"}
        </h3>

        <p className="text-sm lg:text-md font-subheading  text-center max-w-full tracking-wider">
          {customDescription || "description"}
        </p>       
      </div>
    </div>
}
