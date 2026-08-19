import { useIsMobile } from "@/hooks/use-mobile";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

function HeroImageShow() {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabsData = [
    { label: "Overview", maping: "overview", image_path: "/screen_1.png" }, // Best practice: start with a high-level dashboard
    {
      label: "Video Hosting",
      maping: "video_hosting",
      image_path: "/screen_1.png",
    }, // Essential core feature
    {
      label: "Player Customization",
      maping: "player_customization",
      image_path: "/screen_1.png",
    },
    {
      label: "Engagement Analytics",
      maping: "engagement_analytics",
      image_path: "/screen_1.png",
    }, // Professional naming
    {
      label: "Lead Generation",
      maping: "lead_generation",
      image_path: "/screen_1.png",
    }, // Replaces 'Capture Lead'
    {
      label: "Interactive CTA",
      maping: "interactive_cta",
      image_path: "/screen_1.png",
    },
    {
      label: "Integrations",
      maping: "integrations",
      image_path: "/screen_1.png",
    }, // Fixed spelling
    {
      label: "Security & DRM",
      maping: "security_drm",
      image_path: "/screen_1.png",
    }, // Critical for high-end SaaS
    {
      label: "Organization",
      maping: "organization",
      image_path: "/screen_1.png",
    }, // Better than 'workspace'
  ];
  const containerRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const activeElement = containerRef.current.children[activeIndex];
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "start",
        });
      }
    }
  }, [activeIndex]);

  const isMobile = useIsMobile();
  return (
    <div className=" relative  h-full w-full ">
      <div
        className="pointer-events-none absolute top-58 lg:top-80 h-84 lg:h-200 w-[90%] md:w-[90%]   -translate-y-1/2 rounded-[300px] blur-[50px] will-change-transform md:left-1/2 md:h-214 md:-translate-x-1/2"
        style={{
          backgroundImage:
            "linear-gradient(45deg, #FF3C001C 0%, #F6009C48 38%, #963EC61E 71%, #008CFF12 100%)",
          //  backgroundImage: "linear-gradient(45deg, #FF3B0033 0%, #F6009D33 38%, #973EC633 71%, #008EFF33 100%)",
          opacity: 1,
        }}
      />

      <div className="w-full h-full py-4 md:py-6 px-3">
        <div className="w-full flex items-center justify-center gap-8   overflow-x-auto no-scrollbar fade-navigation [scroll-snap-type:x_mandatory]">
          <div className="w-full flex items-center justify-center gap-8 overflow-x-auto no-scrollbar fade-navigation [scroll-snap-type:x_mandatory]">
            <div className="w-full flex items-center justify-center gaap-8 overflow-x-auto no-scrollbar fade-navigationa fade-middle-window [scroll-snap-type:x_mandatory]">
              <section
                ref={containerRef}
                className="w-full flex items-center no-scrollbar  justify-center gap-8 overflow-scroll fade-middle-window"
              >
                {tabsData.map((e, i) => (
                  <button key={i} onClick={() => setActiveIndex(i)} className="w-fit">
                    <p
                      className={`text-md ${activeIndex == i ? "text-black" : "text-black/50"}  md:text-[18px]   whitespace-nowrap  capitalize font-subheading font-semibold`}
                    >
                      {e.label}
                    </p>
                  </button>
                ))}
              </section>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full  flex items-centexr justify-center overflow-hidden h-72 lg:h-164">
        <div className="max-w-xs md:max-w-7xl w-[85%]">
          <div className="relative w-full  h-full flex items-center justify-center [perspective:3000px]">
            {tabsData.map((tab, i) => {
              const offset = i - activeIndex;
              const isActive = offset === 0;

              // clamp how far out side-images travel, so items 3+ away don't fly off
              const clampedOffset = Math.max(-2, Math.min(2, offset));
              const sizeTranslate = isMobile ? 30 : 90;
              const translateX =
                clampedOffset * sizeTranslate + (activeIndex != i ? i * 1 : 0); // horizontal spacing
              const scale = isActive ? 1 : 0.8;
              const opacity = Math.abs(offset) > 2 ? 0 : isActive ? 1 : 0.7;
              // const rotationFactor = isMobile ? -2 : -4;
              const rotateY = clampedOffset * -4;
              const zIndex = 10 - Math.abs(offset);

              return (
                <button
                  key={tab.label}
                  onClick={() => setActiveIndex(i)}
                  style={{
                    transform: `translateX(${translateX}px) scale(${scale}) ${`rotateY(${rotateY}deg)`}`,
                    opacity,
                    zIndex,
                    backfaceVisibility: "hidden",
                  }}
                  className="absolute  w-full h-full rounded-xl overflow-hidden shadow-xl transition-all duration-500 ease-out cursor-pointer"
                >
                  <Image
                    unoptimized
                    quality={100}
                    className="w-full h-full object-cover"
                    src={tab.image_path}
                    alt={tab.label}
                    fill
                    sizes="320px"
                  />
                  {!isActive && (
                    <div className="absolute inset-0 bg-white/40" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroImageShow;
