import React from "react";
import { ChartCandlestick } from "lucide-react";
import Image from "next/image";
function TopHeader() {
  return (
    <div className="w-full">
      <div className="mx-auto max-w-[90%] md:max-w-3xl cursor-pointer flex flex-col gap-5 items-center justify-center">
        <div className="group mx-auto flex w-fit items-center gap-2.5 rounded-full border border-slate-200/60 bg-white/80 px-3 py-1.5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07),0_0_0_1px_rgba(0,0,0,0.02)] backdrop-blur-md transition-all hover:border-violet-200 hover:shadow-md">
          {/* Icon Container with a subtle background pulse */}
          <div className="relative flex items-center justify-center rounded-lg bg-slate-50 p-1 group-hover:bg-violet-50 transition-colors">
            <Image
              alt="Trade"
              src={"/candlestick-chart.png"}
              height={18}
              width={18}
              className="opacity-80 group-hover:opacity-100 transition-opacity"
            />
          </div>

          {/* Text with your custom font and gradient-ready style */}
          <span className="font-jakarta text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 md:text-[12px]">
            Build for <span className="text-slate-900">Video Excellence.</span>{" "}
            & {/* <span className="text-slate-900">Equity</span> Research */}
          </span>

          {/* Tiny Arrow or Dot to make it feel like a clickable 'pill' */}
          <div className="ml-1 h-1 w-1 rounded-full bg-violet-400 group-hover:animate-pulse"></div>
        </div>
        <h1 className="capitalize max-w-2xl font-heading font-bold leading-[1.2] text-3xl md:text-5xl tracking-normal text-center font-jakarta">
          Unleash Your Creativity, Power Your Presence.
          <br className="hidden md:block" />
          <span className="text-slate-600 font-semibold mt-2 block">
            Built for{" "}
            <span className="italic font-subheading text-gradient bg-clip-text text-transparent">
              Video Excellence.
            </span>
          </span>
        </h1>
        <p className=" text-sm md:text-md text-center tracking-wide font-content md:text-[16px]">
          A unified agentic research platform that continuously monitors global
          markets, decodes public sentiment, and surfaces actionable
          intelligence — all in real time. By combining social signal analysis
          with live financial data, it gives analysts and traders a decisive
          edge.
        </p>
      </div>
    </div>
  );
}

export default TopHeader;
