"use client";

import React from "react";
import { ArrowRight, Check, Play, ShieldCheck, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import IntroVideo from "./IntroVideo";
import CtaSection from "./CtaSection";
import VideoInfraIllustration from "./VideoInfraIllustration";
import CompanyProof from "./CompanyProof";

const proofItems = [
  "Adaptive streaming",
  "Secure playback",
  "Realtime analytics",
];

export default function TopHeader() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative  isolate w-full overflow-hidden  text-[#11120e]">
      {/* ------------------------------------------------------------------ */}
      {/* Decorative background                                              */}
      {/* ------------------------------------------------------------------ */}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        {/* subtle top glow */}
        <div className="absolute left-[18%] top-[-280px] h-[520px] w-[720px] rounded-full bg-[#B3E61D]/[0.08] blur-[130px]" />

        {/* left curved line */}
        <div className="absolute -left-[420px] top-[-140px] h-[760px] w-[760px] rounded-full border-[24px] border-[#ebeae5]/70" />

        <div className="absolute -left-[390px] top-[-110px] h-[700px] w-[700px] rounded-full border border-[#deddd7]/60" />

        {/* right curved line */}
        <div className="absolute -right-[520px] top-[390px] h-[930px] w-[930px] rounded-full border-[22px] border-[#ebeae5]/70" />

        <div className="absolute -right-[470px] top-[430px] h-[840px] w-[840px] rounded-full border border-[#deddd7]/60" />

        {/* fade */}
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-[#faf9f5]" />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Main hero                                                          */}
      {/* ------------------------------------------------------------------ */}

      <div className="mx-auto w-full  px-5 sm:px-7 lg:px-8">
        <div className="pt-16 sm:pt-20 lg:pt-[118px]">
          <div className="max-w-[930px]">
            {/* eyebrow */}
            {/* <motion.div
              initial={
                reducedMotion
                  ? false
                  : {
                      opacity: 0,
                      y: 12,
                    }
              }
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.55,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mb-7 inline-flex items-center gap-2 rounded-full border border-black/[0.07] bg-white/70 px-3 py-1.5 shadow-sm backdrop-blur"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-[#B3E61D]">
                <Sparkles className="size-3.5 text-[#172000]" />
              </span>

              <span className="text-[12px] font-medium tracking-[-0.01em] text-[#595c52]">
                Video infrastructure for modern products
              </span>
            </motion.div> */}

            {/* ---------------------------------------------------------- */}
            {/* Heading                                                    */}
            {/* ---------------------------------------------------------- */}

            <motion.h1
              initial={
                reducedMotion
                  ? false
                  : {
                      opacity: 0,
                      y: 24,
                      filter: "blur(10px)",
                    }
              }
              animate={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
              }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="
                max-w-[940px]
                font-heading
                text-[43px]
                font-medium
                leading-[1.04]
                tracking-[-0.052em]
                text-[#11120e]
                sm:text-[56px]
                md:text-[66px]
                lg:text-[74px]
              "
            >
              The{" "}
              <span className="relative inline-block whitespace-nowrap">
                <span className="relative z-10">simple & scalable</span>

                <motion.span
                  initial={reducedMotion ? false : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    delay: 0.3,
                    duration: 0.75,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="
                    absolute
                    -inset-x-2
                    bottom-[2px]
                    top-[4px]
                    -z-0
                    origin-left
                    rounded-[5px]
                    bg-[#e7f6b8]
                    sm:-inset-x-3
                  "
                />
              </span>
              <br />
              video infrastructure layer
            </motion.h1>

            {/* ---------------------------------------------------------- */}
            {/* Description                                                */}
            {/* ---------------------------------------------------------- */}

            <motion.p
              initial={
                reducedMotion
                  ? false
                  : {
                      opacity: 0,
                      y: 16,
                    }
              }
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.13,
                duration: 0.65,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="
                mt-7
                max-w-[670px]
                font-content
                text-[16px]
                leading-[1.65]
                tracking-[-0.015em]
                text-[#6d6e68]
                sm:text-[18px]
              "
            >
              Upload once, stream everywhere. Secure playback, track viewer
              engagement, and skip the infrastructure headaches.
            </motion.p>

            {/* ---------------------------------------------------------- */}
            {/* CTAs                                                       */}
            {/* ---------------------------------------------------------- */}

            <motion.div
              initial={
                reducedMotion
                  ? false
                  : {
                      opacity: 0,
                      y: 14,
                    }
              }
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.22,
                duration: 0.65,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mt-7"
            >
              <CtaSection />
              <CompanyProof />
            </motion.div>

            {/* <CtaSection/> */}
            {/* <motion.div
              initial={
                reducedMotion
                  ? false
                  : {
                      opacity: 0,
                      y: 14,
                    }
              }
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.22,
                duration: 0.65,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mt-7 flex flex-col gap-3 sm:flex-row"
            >
              <button
                className="
                  group
                  inline-flex
                  h-12
                  items-center
                  justify-center
                  gap-2
                  rounded-[8px]
                  bg-[#B3E61D]
                  px-6
                  text-[14px]
                  font-semibold
                  tracking-[-0.01em]
                  text-[#172000]
                  shadow-[0_1px_1px_rgba(0,0,0,0.04),0_6px_18px_rgba(129,168,20,0.15)]
                  transition
                  hover:bg-[#aade13]
                  sm:w-auto
                "
              >
                Start building free

                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>

              <button
                className="
                  group
                  inline-flex
                  h-12
                  items-center
                  justify-center
                  gap-2.5
                  rounded-[8px]
                  border
                  border-black/[0.07]
                  bg-[#efeee9]
                  px-6
                  text-[14px]
                  font-medium
                  tracking-[-0.01em]
                  text-[#55574f]
                  transition
                  hover:border-black/[0.11]
                  hover:bg-[#eae9e3]
                  hover:text-[#171812]
                  sm:w-auto
                "
              >
                View live demo

                <span className="flex size-6 items-center justify-center rounded-full bg-white shadow-sm">
                  <Play className="ml-[1px] size-3 fill-current" />
                </span>
              </button>
            </motion.div> */}

            {/* ---------------------------------------------------------- */}
            {/* Proof row                                                  */}
            {/* ---------------------------------------------------------- */}

            <motion.div
              initial={
                reducedMotion
                  ? false
                  : {
                      opacity: 0,
                    }
              }
              animate={{
                opacity: 1,
              }}
              transition={{
                delay: 0.4,
                duration: 0.8,
              }}
              className="
                mt-7
                flex
                flex-wrap
                items-center
                gap-x-5
                gap-y-2.5
                text-[12px]
                font-medium
                text-[#8a8c84]
              "
            >
              {proofItems.map((item) => (
                <div key={item} className="flex text-[16px] sm:text-[16px]  items-center gap-1.5">
                  <Check className="size-3.5 text-[#7d9c1a]" />
                  <span>{item}</span>
                </div>
              ))}

              <div className="hidden h-3 w-px bg-black/10 sm:block" />

              <div className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-[#7d9c1a]" />

                <span>No credit card required</span>
              </div>
            </motion.div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Product preview                                                   */}
          {/* ---------------------------------------------------------------- */}

          <motion.div
            initial={
              reducedMotion
                ? false
                : {
                    opacity: 0,
                    y: 42,
                    scale: 0.985,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            transition={{
              delay: 0.35,
              duration: 0.9,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative mt-14 sm:mt-6 lg:mt-[74px]"
          >
            {/* tiny testimonial/status line like reference */}
            <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[14px] sm:text-[18px] text-[#50514f]">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="text-[#8a8c83]">
                    ★
                  </span>
                ))}
              </div>

              <span className="hidden text-black/15 sm:inline">•</span>

              <span>
                Built for teams that want video infrastructure without
                infrastructure complexity.
              </span>
            </div>

            {/* preview frame */}

            {/* background shadow plate */}
            <div className="absolute inset-x-10 -bottom-8 -z-10 h-24 rounded-full bg-black/[0.08] blur-[45px]" />
          </motion.div>
        </div>
        <VideoInfraIllustration />
      </div>

      <div className="h-14 sm:h-20 lg:h-28" />
    </section>
  );
}
