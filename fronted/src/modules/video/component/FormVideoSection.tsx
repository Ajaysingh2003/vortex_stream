import Image from "next/image";
import React from "react";
import { useVideoContext } from "../context/VideoContext";
import PreviewForm from "./PreviewForm";
import { Button } from "@/components/ui/button";

function FormVideoSection() {
  const thumbnail =
    "https://pub-db02f4666efb4ae9b337950ff0610772.r2.dev/blogimages/madisonbeer%2BCHWB_w9lckT-1-1200x630.jpg";

  const header = "Form header";
  const description = "form description";
  const { background, skipForm } = useVideoContext()!;

  return (
    <div className="w-full h-full">
      <div className="w-full h-full overflow-hidden relative  lg:min-h-[700px] rounded-2xl bg-black">
        <div
          style={{ background: `${background}` }}
          className="w-full h-full rounded-2xl  absolute"
        >
          <PreviewForm />

          {skipForm && (
            <div className="absolute inset-0 flex items-end justify-end px-4 py-2 lg:py-3  h-fit z-10 pointer-events-none">
              <Button className="rounded-lg text-white bg-gray-400 hover:bg-gray-500 capitalize cursor-pointer text-xs lg:text-sm  pointer-events-auto">
                Skip to video
              </Button>
            </div>
          )}
        </div>
        <Image
          unoptimized
          className="w-full object-contain h-full rounded-2xl"
          alt="hii"
          src={thumbnail}
          height={100}
          width={100}
        />
      </div>
    </div>
  );
}

export default FormVideoSection;
