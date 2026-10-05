"use client";

import React, { useMemo, useState } from "react";
import DottedMap from "dotted-map";
import { type CountryActivity } from "../lib/country-activity";
import { formatNumber, formatPercent } from "../lib/format";
import { cn } from "@/lib/utils";

interface CountryMapProps {
  countries: CountryActivity[];
  measureLabel?: string;
  className?: string;
  selectedCountryCode?: string | null;
  onSelectCountry?: (code: string | null) => void;
}

export function CountryMap({
  countries,
  measureLabel = "Views",
  className,
  selectedCountryCode,
  onSelectCountry,
}: CountryMapProps) {
  const [hovered, setHovered] = useState<CountryActivity | null>(null);

  // 1. Generate base dotted map SVG
  const map = useMemo(() => new DottedMap({ height: 60, grid: "diagonal" }), []);

  const svgMapString = useMemo(() => {
    return map.getSVG({
      radius: 0.22,
      color: "#cbd5e1", // neutral stone-300 dots
      shape: "circle",
      backgroundColor: "transparent",
    });
  }, [map]);

  // Max value calculation for proportional pin radius
  const maxVal = useMemo(() => {
    return countries.reduce((acc, c) => Math.max(acc, c.value), 1);
  }, [countries]);

  // Project lat/lng to SVG coordinate space
  // DottedMap default aspect ratio is 2:1 (e.g. 800x400 viewBox)
  const projectPoint = (lat: number, lng: number) => {
    const x = (lng + 180) * (800 / 360);
    const y = (90 - lat) * (400 / 180);
    return { x, y };
  };

  // Filter countries with valid coordinates
  const mappedCountries = useMemo(() => {
    return countries.filter((c) => c.point && c.value > 0);
  }, [countries]);

  return (
    <div
      className={cn(
        "bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex flex-col justify-between relative",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 tracking-tight">
            Audience by country
          </h3>
          <p className="text-xs text-stone-500">
            {mappedCountries.length} active country locations
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary border border-stone-800" />
            <span className="text-[11px]">Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-3.5 rounded-full bg-primary border border-stone-800" />
            <span className="text-[11px]">High volume</span>
          </div>
        </div>
      </div>

      {/* Map SVG & Overlay */}
      <div className="relative w-full aspect-[2/1] overflow-hidden rounded-lg bg-stone-50/50 border border-stone-100 flex items-center justify-center">
        {/* Background dotted world map */}
        <div
          className="absolute inset-0 size-full pointer-events-none opacity-80"
          dangerouslySetInnerHTML={{ __html: svgMapString }}
        />

        {/* Interactive country pin overlay */}
        <svg
          viewBox="0 0 800 400"
          className="absolute inset-0 size-full z-10"
        >
          {mappedCountries.map((c) => {
            const { x, y } = projectPoint(c.point!.lat, c.point!.lng);
            // Proportional sqrt radius capped between 3 and 12
            const r = Math.min(12, Math.max(3.5, Math.sqrt(c.value / maxVal) * 12));
            const isSelected = selectedCountryCode === c.code;

            return (
              <g
                key={c.code}
                className="cursor-pointer transition-transform"
                onClick={() =>
                  onSelectCountry?.(isSelected ? null : c.code)
                }
                onMouseEnter={() => setHovered(c)}
                onMouseLeave={() => setHovered(null)}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill="#84cc16"
                  stroke="#18181b"
                  strokeWidth={isSelected ? 2.5 : 1.2}
                  className={cn(
                    "transition-all duration-150",
                    isSelected ? "opacity-100" : "opacity-90 hover:opacity-100",
                  )}
                />
              </g>
            );
          })}
        </svg>

        {/* Hover / Selection tooltip */}
        {hovered && (
          <div className="absolute bottom-2 left-2 z-20 bg-stone-900 text-white text-xs px-2.5 py-1.5 rounded-md shadow-md border border-stone-800 pointer-events-none flex items-center gap-2">
            <span className="font-semibold">{hovered.name}</span>
            <span className="text-stone-400 font-mono">
              {formatNumber(hovered.value)} {measureLabel.toLowerCase()}
            </span>
            {hovered.sharePercent !== undefined && (
              <span className="text-lime-400 font-mono text-[11px]">
                ({formatPercent(hovered.sharePercent)})
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-2 text-[11px] text-stone-400 flex items-center justify-between">
        <span>Country-level projection</span>
        <span>Click pin to inspect</span>
      </div>
    </div>
  );
}
