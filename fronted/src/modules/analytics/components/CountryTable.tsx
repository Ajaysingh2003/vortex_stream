"use client";

import React from "react";
import { type CountryActivity } from "../lib/country-activity";
import { formatNumber, formatPercent } from "../lib/format";
import { cn } from "@/lib/utils";

interface CountryTableProps {
  countries: CountryActivity[];
  measureLabel?: string;
  maxRows?: number;
  onViewAll?: () => void;
  selectedCountryCode?: string | null;
  onSelectCountry?: (code: string | null) => void;
  className?: string;
}

export function CountryTable({
  countries,
  measureLabel = "Views",
  maxRows = 8,
  onViewAll,
  selectedCountryCode,
  onSelectCountry,
  className,
}: CountryTableProps) {
  const displayRows = maxRows ? countries.slice(0, maxRows) : countries;

  return (
    <div
  className={cn(
    "flex h-[400px] no-scrollbar  min-h-0 w-full flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xs",
    className,
  )}
>
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between px-5 pt-5 pb-3">
        <h3 className="text-sm font-semibold tracking-tight text-stone-900">
          Top Countries
        </h3>

        {onViewAll && countries.length > maxRows && (
          <button
            type="button"
            onClick={onViewAll}
            className="
              text-xs font-medium text-stone-500
              transition-colors
              hover:text-stone-900
            "
          >
            View all
          </button>
        )}
      </div>

      {/* Scrollable table area */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto px-5">
        <table className="w-full min-w-[360px] border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b border-stone-100 text-stone-400">
              <th className="py-2 pr-3 font-medium">
                Country
              </th>

              <th className="px-3 py-2 text-right font-medium">
                {measureLabel}
              </th>

              <th className="py-2 pl-3 text-right font-medium">
                Share
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100/70">
            {displayRows.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="py-8 text-center text-stone-400"
                >
                  No country activity recorded
                </td>
              </tr>
            ) : (
              displayRows.map((c) => {
                const isSelected = selectedCountryCode === c.code;

                return (
                  <tr
                    key={c.code}
                    onClick={() =>
                      onSelectCountry?.(isSelected ? null : c.code)
                    }
                    className={cn(
                      `
                      cursor-pointer
                      transition-colors
                      hover:bg-stone-50/80
                      `,
                      isSelected && "bg-lime-50/80",
                    )}
                  >
                    <td className="py-2.5 pr-3">
                      <div className="flex min-w-0 items-center gap-2">
                        {c.code !== "UNKNOWN" && (
                          <span className="
                            shrink-0
                            font-mono text-[10px]
                            uppercase text-stone-400
                          ">
                            {c.code}
                          </span>
                        )}

                        <span
                          className={cn(
                            "truncate text-stone-800",
                            isSelected
                              ? "font-semibold"
                              : "font-medium",
                          )}
                        >
                          {c.name}
                        </span>
                      </div>
                    </td>

                    <td className="
                      whitespace-nowrap
                      px-3 py-2.5
                      text-right
                      font-mono
                      tabular-nums
                      text-stone-900
                    ">
                      {formatNumber(c.value)}
                    </td>

                    <td className="
                      whitespace-nowrap
                      py-2.5 pl-3
                      text-right
                      font-mono
                      tabular-nums
                      text-stone-500
                    ">
                      {c.sharePercent !== undefined
                        ? formatPercent(c.sharePercent)
                        : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {countries.some((c) => c.code === "UNKNOWN") && (
        <div className="shrink-0 border-t border-stone-100 px-5 py-3">
          <p className="text-[11px] leading-4 text-stone-400">
            * Unknown denotes traffic without resolved GeoIP headers
          </p>
        </div>
      )}
    </div>
  );
}