import React from "react";
import { ChartCandlestick, Video } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import CtaSection from "./CtaSection";
function TopHeader() {
  return (
    <div className="w-full pb-3">
      <div className="mx-auto max-w-[90%] md:max-w-3xl cursor-pointer flex flex-col gap-4 items-center justify-center">
        <div className="group mx-auto flex w-fit cursor-pointer items-center gap-3 rounded-full border border-slate-200 bg-white/50 px-2 py-1 pr-4 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] backdrop-blur-xl transition-all duration-300 hover:border-violet-300/50 hover:bg-white hover:shadow-violet-500/10">
          {/* Icon Container with a subtle ring */}
          <div className="flex items-center justify-center rounded-full bg-violet-50 p-0.5 shadow-inner ring-1 ring-black/5 transition-colors group-hover:bg-violet-100">
            <Video className="size-3" />
          </div>

          {/* Text with clear hierarchy */}
          <span className="font-subheading text-[8px] font-semibold uppercase tracking-wider text-slate-500 md:text-[12px]">
            Built for <span className="text-slate-900">Video Excellence</span>
          </span>

          {/* Pulse Indicator */}
          <div className="relative flex h-2 w-2 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500"></span>
          </div>
        </div>
        <h1 className="capitalize max-w-2xl font-heading font-bold leading-[1.2] text-3xl md:text-5xl tracking-normal text-center font-jakarta">
          Unleash Your Creativity, Power Your Presence.
          <br className="hidden md:block" />
          <span className="text-slate-600 text-sm md:text-3xl font-semibold mt-2 block">
            Built for{" "}
            <span className="italic font-heading text-gradient bg-clip-text text-transparent">
              Video Excellence.
            </span>
          </span>
        </h1>
        <p className=" text-sm md:text-md text-center tracking-wide font-content md:text-[16px]">
          Video as an intelligence asset. We’ve built a secure, high-performance
          streaming engine that treats every view as a data point. Fast,
          encrypted, and designed to feed your strategy, it’s the infrastructure
          your team has been waiting for.
        </p>

        <div className="w-full flex items-center justify-center ">
          {/* <Button className='capitalize px-8 rounded-md bg-main-btn font-bold  cursor-pointer text-white '>Get Started</Button> */}
          <CtaSection />
        </div>
      </div>
    </div>
  );
}

export default TopHeader;

// import React from "react";
// import { ChartCandlestick, Video } from "lucide-react";
// import Image from "next/image";
// import { Button } from "@/components/ui/button";
// import CtaSection from "./CtaSection";
// function TopHeader() {
//   return (
//     <div className="w-full">
//       <div className="mx-auto max-w-[90%] md:max-w-3xl cursor-pointer flex flex-col gap-5 items-center justify-center">
//         <div className="group mx-auto flex w-fit cursor-pointer items-center gap-3 rounded-full border border-slate-200 bg-white/50 px-2 py-1 pr-4 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] backdrop-blur-xl transition-all duration-300 hover:border-violet-300/50 hover:bg-white hover:shadow-violet-500/10">

//   {/* Icon Container with a subtle ring */}
//   <div className="flex items-center justify-center rounded-full bg-violet-50 p-0.5 shadow-inner ring-1 ring-black/5 transition-colors group-hover:bg-violet-100">
//   <Video className="size-3"/>

//   </div>

//   {/* Text with clear hierarchy */}
//   <span className="font-jakarta text-[11px] font-semibold uppercase tracking-wider text-slate-500 md:text-[12px]">
//     Built for <span className="text-slate-900">Video Excellence</span>
//   </span>

//   {/* Pulse Indicator */}
//   <div className="relative flex h-2 w-2 items-center justify-center">
//     <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
//     <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500"></span>
//   </div>
// </div>
//         <h1 className="capitalize max-w-2xl font-heading font-bold leading-[1.2] text-3xl md:text-5xl tracking-normal text-center font-jakarta">
//           Unleash Your Creativity, Power Your Presence.
//           <br className="hidden md:block" />
//           <span className="text-slate-600 font-semibold mt-2 block">
//             Built for{" "}
//             <span className="italic font-subheading text-gradient bg-clip-text text-transparent">
//               Video Excellence.
//             </span>
//           </span>
//         </h1>
//         <p className=" text-sm md:text-md text-center tracking-wide font-content md:text-[16px]">
//           Video as an intelligence asset. We’ve built a secure, high-performance streaming engine that treats every view as a data point. Fast, encrypted, and designed to feed your strategy, it’s the infrastructure your team has been waiting for.
//         </p>

//             <div className="w-full flex items-center justify-center ">
//                  {/* <Button className='capitalize px-8 rounded-md bg-main-btn font-bold  cursor-pointer text-white '>Get Started</Button> */}
//                 <CtaSection/>
//             </div>

//       </div>
//     </div>
//   );
// }

// export default TopHeader;
