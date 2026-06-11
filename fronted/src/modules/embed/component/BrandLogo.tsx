"use client";

import { cx } from "class-variance-authority";
import Link from "next/link";
import React from "react";

export type LogoPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface BrandLogoProps {
  position?: LogoPosition;
  iconColor?: string;
  className?: string;
}

export default function BrandLogo({
  position = "top-right",
  iconColor = "#ffffff",
  className = "",
}: BrandLogoProps) {
  
  // Dynamic tailwind absolute positioning anchor classes
  const positionClasses: Record<LogoPosition, string> = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-14 left-4",
    "bottom-right": "bottom-14 right-4",
  };

  return (
    <div 
  className={cx(
    "z-20 inline-block pointer-events-auto h-5 lg:h-7 whitespace-nowrap transition-transform duration-200 hover:scale-105",
    positionClasses[position], 
    className
  )}
>
  <div className="h-full relative">
    <Link
      tabIndex={0}
      href="https://vortex.com/?utm_type=player"
      aria-label="Vortex Logo -- Learn More"
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full bg-transparent rounded-none shadow-none cursor-pointer outline-none"
      title="Vortex Logo -- Learn More"
      style={{ color: iconColor }}
    >
      
      <div className="box-sizing-border-box h-full flex items-center justify-center gap-0 lg:gap-0.5 relative opacity-100 ">
        
        <svg
          viewBox="0 0 40 50"
          aria-hidden="true"
          className="h-full w-auto fill-current"
          style={{ strokeWidth: "0px" }}
        >
          <path
            transform="translate(2, 10)"
            d="M16.09 17.1h-5.2c-1.58 0-3.08.68-4.11 1.87L.21 26.53c4.78.25 9.78.25 13.3.25 18.31 0 20.89-11.27 20.89-16.55-1.59 1.93-6.06 6.87-18.32 6.87ZM32.14 0c-.08.92-.59 4.69-11.31 4.69-8.72 0-12.24 0-20.83-.17l6.44 7.4a6.657 6.657 0 0 0 4.96 2.3c2.13.03 5.05.06 5.53.06 11.01 0 17.19-5.05 17.19-9.89 0-2.01-.67-3.44-1.97-4.4Z"
            style={{ strokeWidth: "0px" }}
          />
        </svg>

        
        <span style={{fontWeight:"800"}} className="font-heading hidden lg:inline-block font-bold text-sm lg:text-lg tracking-wide text-white">
          Vortex
        </span>
      </div>
    </Link>
  </div>
</div>
  );
}