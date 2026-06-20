import { VideoAsset } from "@/modules/types";
import React from "react";
import { useVideoContext } from "../context/VideoContext";
import { Play } from "lucide-react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01FreeIcons,
  Add02Icon,
  AddCircleFreeIcons,
  AddCircleHalfDotIcon,
  Remove02FreeIcons,
  RemoveCircleHalfDotIcon,
} from "@hugeicons/core-free-icons";
import toast from "react-hot-toast";

interface ChooseMoreVideoProps {
  items: VideoAsset[];
}

function ChooseMoreVideo({ items }: ChooseMoreVideoProps) {
  const { selectMoreVideo, setSelectMoreVideo } = useVideoContext()!;

  const handleVideoToggle = (video: VideoAsset) => {
  const isAlreadySelected = selectMoreVideo.some((v) => v.id === video.id);

  if (isAlreadySelected) {
    setSelectMoreVideo((prev) => prev.filter((v) => v.id !== video.id));
    return;
  }

  if (selectMoreVideo.length >= 3) {
    
    toast.error("Max 3 Videos can be added.");
    return; 
  }

  // 3. Add the video if it passes the gate
  setSelectMoreVideo((prev) => [...prev, video]);
};
  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const selectedCount = selectMoreVideo?.length || 0;

  return (
    <div className="w-full h-full">
      {/* {JSON.stringify(selectMoreVideo,null,2)} */}
      <ul className="w-full space-y-2 ">
        {items.map((item) => {
          const isSelected = selectMoreVideo.some((e) => e.id == item.id);
          return (
            <li key={item.id} className="w-full">
              <div className="grid grid-cols-[60px_1fr_10px]  gap-3">
                <div className="max-w-12 relative ">
                  <Image
                    src={
                      (item.thumbnail &&
                        `${process.env.NEXT_PUBLIC_CDN_URL}/${item.thumbnail}`) ||
                      "/video-player.png"
                    }
                    height={100}
                    className="w-full rounded-lg object-contain"
                    width={100}
                    alt=""
                  />
                </div>
                <div className="flex flex-col justify-center gap-1 text-[13px] items-start min-w-0">
                  <p className="text-accent text-[13px] max-w-full  leading-slug  truncate">
                    {item.title}
                  </p>
                  <span className="text-accent">{item.duration}</span>
                </div>
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => handleVideoToggle(item)}
                    className=" cursor-pointer"
                  >
                    <HugeiconsIcon
                      className={`size-5 transition-transform duration-200 ${isSelected ? "fill-red-300  text-white hover:scale-105" : "text-gray-500  hover:scale-105"}`}
                      icon={
                        isSelected
                          ? RemoveCircleHalfDotIcon
                          : AddCircleFreeIcons
                      }
                    />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default ChooseMoreVideo;

{
  /* <div className="flex items-center justify-center">
  <button
    type="button"
    onClick={() => handleVideoToggle(item)}
    className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md"
  >
    <HugeiconsIcon
      className={`size-5 transition-transform duration-200 ${isSelected ? "fill-red-300  text-white hover:scale-105" : "text-gray-500  hover:scale-105"}`}
      icon={isSelected ? RemoveCircleHalfDotIcon : AddCircleFreeIcons}
    />
  </button>
</div>; */
}
