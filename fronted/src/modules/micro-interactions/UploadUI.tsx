"use client";
import React, { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Clapperboard,
  EllipsisVertical,
  LucideCircleArrowOutDownLeft,
  MarsStroke,
  PanelLeftDashed,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import VideoUploadCard from "./VideoUploadCard";
function UploadUI() {
//   const [open, setOpen] = useState(false);
  return (
    <div className={`w-full h-full `}>
      <div className={`w-full h-full hidden-overlap grid grid-cols-[55px_1fr]`}>
        <div className={`bg-[#f3f3f3] py-3 `}>
          <div className="w-full flex flex-col gap-4 items-center justify-center">
            <div className=" bg-[#9b919123] rounded-md w-8 h-8" />
            <div className=" bg-[#9b919123] rounded-md w-6 h-6" />
            <div className=" bg-[#9b919123] rounded-md w-6 h-6" />
          </div>
        </div>
        <div className="h-full w-full rounded-2xl flex flex-col za-50">
          <div className="h-15 border-b-[1px] border-black/5 flex justify-between items-center px-6  w-full">
            <PanelLeftDashed className="text-stone-500 size-[20px]" />
            <div className="size-7  rounded-full">
              <Image
                src={"/icon/user.png"}
                height={100}
                width={100}
                alt="user"
              />
            </div>
          </div>

          <div className="h-full w-full px-3 py-2 ">
            <div className="w-full h-full relative p-4">
              <div className=" absolute w-115 z-10  -bottom-24 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md overflow-hidden">
                <div className="w-full overlap-card rounded-lg max-w-sm lg:max-w-128  shadow-[0_-2px_4px_0_rgba(0, 0, 0, 0.82)]  shadow-black/15 rounded-[10px]  bg-[#f5f5f5]">
                  <div className="bg-[#f7f7f7] border-b border-[#eee] py-2 px-4 w-full flex justify-between items-center">
                    <p className=" capitalize text-md font-normal text-[#040404] leading-6  text-nowrap   tracking-wide">
                      Uploading -{" "}
                      <span className="font-semibold text-sm">{57}%</span>
                    </p>
                    <Button
                      className="w-fit bg-transparent text-black border-none outline-none hover:bg-transparent"
                    >
                      {<ArrowDown />}
                    </Button>
                  </div>

                  <div className="border-b border-[#eee] py-2 px-4 w-full flex justify-between items-center ">
                    <VideoUploadCard />
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <h2 className="font-semibold leading-relaxed tracking-wider text-2xl  font-heading   text-black">
                  Library
                </h2>
                <div className="flex items-center gap-3">
                  <div
                    role="button"
                    className="bg-muted text-black border-black/30 border-[0.5px] bg-background-btnx text-center rounded-md px-2 h-9 gap-2 flex items-center justify-center font-medium animate"
                  >
                    {/* <MarsStroke className="size-4"/> */}
                    <Image
                      src={"/icon/create_folder.png"}
                      height={20}
                      width={20}
                      alt="folder"
                    />
                    {/* Folder */}
                  </div>
                  <div
                    role="button"
                    className="bg-mutedz text-white border-black/30 border-[0.5px] bg-background-btn text-center rounded-md px-6 h-9 gap-2 flex items-center justify-center font-medium animate"
                  >
                    <Upload className="size-4" />
                    Upload
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="w-full h-full">
                  <div className="w-full bg-white rounded-sm border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="w-full overflow-x-auto">
                      <table className="w-full border-collapse text-left">
                       
                        <thead>
                          <tr className="border-b border-[#eee] bg-[#f5f5f5] text-[11px] font-semibold text-accent uppercase tracking-wider select-none">
                            <th className="py-3 px-5">Title</th>
                            <th className="py-3 px-4">Duration</th>
                            <th className="py-3 px-4">Created At</th>
                            <th className="py-3 px-4 text-right"></th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                          <tr className="group hover:bg-slate-50/40 transition-colors">
                            
                            <td className="py-3.5 px-5 flex items-center gap-3">
                              <div className="flex-shrink-0 size-9 flex items-center justify-center">
                                <Image
                                  src="/folder.png"
                                  height={36}
                                  width={36}
                                  alt="folder"
                                  className="object-contain"
                                />
                              </div>
                              <span className="font-medium text-accent">
                                X Studio
                              </span>
                            </td>

                           
                            <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                              —
                            </td>

                            <td className="py-3.5 px-4 text-xs text-accent capitalize">
                              2 days ago
                            </td>

                            <td className="py-3.5 px-4 text-left">
                              <span className="font-semibold">
                                <EllipsisVertical className="size-3.5"/>
                              </span>
                            </td>
                          </tr>
                          <tr className=" group text-accent transition-colors">
                            
                            <td className="py-3.5 px-5 flex items-center gap-3">
                              <div className=" size-9 p-1 rounded-lg  flex items-center justify-center">
                               
                                {/* <Clapperboard className="size-10 text-black"/> */}
                                <Image src={"/video-player.png"} height={100} width={100} alt="player" />
                              </div>
                              <span className="font-medium text-accent">
                                Everything i wanted.mp4
                              </span>
                            </td>

                           
                            <td className="py-3.5 px-4 font-mono text-xs text-accent">
                              02:14
                            </td>

                            <td className="py-3.5 px-4 text-xs text-accent capitalize">
                              1 min ago
                            </td>

                            <td className="py-3.5 px-4 text-left">
                              <span className="font-semibold">
                                <EllipsisVertical className="size-3.5"/>
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadUI;
