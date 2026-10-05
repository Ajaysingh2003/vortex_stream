import type { AnalyticsTab } from "../types";

export interface AnalyticsRouteConfig {
  value: AnalyticsTab;
  label: string;
  slug: string;
  aliases: string[];
}

export const ANALYTICS_ROUTE_CONFIGS: AnalyticsRouteConfig[] = [
  { value: "overview", label: "Overview", slug: "", aliases: ["overview"] },
  { value: "live", label: "Real-time", slug: "live", aliases: ["real-time", "realtime"] },
  { value: "audience", label: "Audience", slug: "audience", aliases: [] },
  { value: "engagement", label: "Engagement", slug: "engagement", aliases: [] },
  { value: "conversions", label: "Conversions", slug: "conversions", aliases: [] },
  { value: "playback", label: "Playback quality", slug: "playback", aliases: ["playback-quality"] },
  {
    value: "form_submissions",
    label: "Form Submissions",
    slug: "form-submissions",
    aliases: ["form_submissions", "leads"],
  },
  {
    value: "cta_clicks",
    label: "CTA Clicks",
    slug: "cta-clicks",
    aliases: ["cta_clicks", "cta"],
  },
  {
    value: "watch_time",
    label: "Watch Time",
    slug: "watch-time",
    aliases: ["watch_time", "playtime"],
  },
  { value: "views", label: "Views", slug: "views", aliases: [] },
];

const KNOWN_SLUGS = new Set<string>();
for (const cfg of ANALYTICS_ROUTE_CONFIGS) {
  if (cfg.slug) KNOWN_SLUGS.add(cfg.slug.toLowerCase());
  for (const a of cfg.aliases) {
    KNOWN_SLUGS.add(a.toLowerCase());
  }
}

/**
 * Returns the canonical URL path for a given tab, preserving optional query parameters.
 */
export function getAnalyticsUrl(
  tab: AnalyticsTab,
  videoId?: string,
  searchParams?: URLSearchParams | string | null,
): string {
  const cfg = ANALYTICS_ROUTE_CONFIGS.find((c) => c.value === tab);
  const slug = cfg ? cfg.slug : "";

  let basePath = "/console/analytics";
  if (videoId && videoId.trim().length > 0) {
    basePath = `${basePath}/${videoId.trim()}`;
  }

  const path = slug ? `${basePath}/${slug}` : basePath;

  if (searchParams) {
    const params = new URLSearchParams(
      typeof searchParams === "string" ? searchParams : searchParams.toString(),
    );
    // Strip redundant scope/tab query params since it's in the route path
    params.delete("scope");
    params.delete("tab");
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
  }

  return path;
}

/**
 * Parses an AnalyticsTab from a raw string or slug.
 */
export function parseAnalyticsTab(raw?: string | null): AnalyticsTab | undefined {
  if (!raw) return undefined;
  const clean = raw.trim().toLowerCase();
  for (const cfg of ANALYTICS_ROUTE_CONFIGS) {
    if (cfg.value === clean || cfg.slug === clean || cfg.aliases.includes(clean)) {
      return cfg.value;
    }
  }
  return undefined;
}

/**
 * Determines the active analytics tab given the current pathname and search params.
 */
export function getAnalyticsTabFromPath(
  pathname: string,
  searchParams?: URLSearchParams | null,
): AnalyticsTab {
  // Strip trailing slashes
  const cleanPath = pathname.replace(/\/+$/, "");
  const segments = cleanPath.split("/").filter(Boolean);

  // Expecting segments like ['console', 'analytics', ...]
  const analyticsIdx = segments.indexOf("analytics");
  if (analyticsIdx !== -1 && segments.length > analyticsIdx + 1) {
    const lastSegment = segments[segments.length - 1];
    const parsedFromLast = parseAnalyticsTab(lastSegment);
    if (parsedFromLast) {
      return parsedFromLast;
    }
  }

  // Fallback to query param (?scope= or ?tab=)
  if (searchParams) {
    const scopeParam = searchParams.get("scope") || searchParams.get("tab");
    const parsedFromParam = parseAnalyticsTab(scopeParam);
    if (parsedFromParam) {
      return parsedFromParam;
    }
  }

  return "overview";
}

/**
 * Extracts videoId if the route is within a video-specific analytics page.
 * e.g. /console/analytics/6c82db12-723a-4678-a31f-9cb214a91d06/audience -> 6c82db12-723a-4678-a31f-9cb214a91d06
 */
export function getVideoIdFromPath(pathname: string): string | undefined {
  const cleanPath = pathname.replace(/\/+$/, "");
  const segments = cleanPath.split("/").filter(Boolean);
  const analyticsIdx = segments.indexOf("analytics");
  if (analyticsIdx === -1) return undefined;

  const afterAnalytics = segments.slice(analyticsIdx + 1);
  if (afterAnalytics.length === 0) return undefined;

  const candidate = afterAnalytics[0];
  // If the candidate is a known slug/alias, it's not a video ID
  if (KNOWN_SLUGS.has(candidate.toLowerCase())) {
    return undefined;
  }

  return candidate;
}
