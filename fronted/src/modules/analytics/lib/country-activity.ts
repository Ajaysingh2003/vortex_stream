import countryPointsData from "../data/country-points.json";
import type { BreakdownItem } from "../types";

export interface CountryPoint {
  lat: number;
  lng: number;
}

export interface CountryActivity {
  code: string;
  name: string;
  value: number;
  sharePercent?: number;
  point?: CountryPoint;
}

const lookup: Record<string, { name: string; lat: number; lng: number }> = countryPointsData;

export function normalizeCountryBreakdown(
  items: BreakdownItem[],
  measure: "views" | "unique_viewers" | "playback_ms" = "views",
): CountryActivity[] {
  let totalValue = 0;
  const rawList = items.map((item) => {
    const code = (item.key || "").trim().toUpperCase();
    const val = item.metrics[measure] || 0;
    totalValue += val;

    if (!code || code === "UNKNOWN" || code === "DIRECT / UNKNOWN") {
      return {
        code: "UNKNOWN",
        name: "Unknown / Unresolved",
        value: val,
      };
    }

    const geo = lookup[code];
    return {
      code,
      name: geo ? geo.name : code,
      value: val,
      point: geo ? { lat: geo.lat, lng: geo.lng } : undefined,
    };
  });

  return rawList
    .map((c) => ({
      ...c,
      sharePercent: totalValue > 0 ? (c.value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

export function normalizeLiveCountries(
  items: Array<{ key?: string; country?: string; active_sessions: number }>,
): CountryActivity[] {
  let total = 0;
  const rawList = (items || []).map((item) => {
    const rawCode = item.key || item.country || "";
    const code = rawCode.trim().toUpperCase();
    const val = item.active_sessions || 0;
    total += val;

    if (!code || code === "UNKNOWN" || code === "DIRECT / UNKNOWN") {
      return {
        code: "UNKNOWN",
        name: "Unknown location",
        value: val,
      };
    }

    const geo = lookup[code];
    return {
      code,
      name: geo ? geo.name : code,
      value: val,
      point: geo ? { lat: geo.lat, lng: geo.lng } : undefined,
    };
  });

  return rawList
    .map((c) => ({
      ...c,
      sharePercent: total > 0 ? (c.value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}
