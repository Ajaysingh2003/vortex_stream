"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  ANALYTICS_ROUTE_CONFIGS,
  getVideoIdFromPath,
  getAnalyticsTabFromPath,
} from "@/modules/analytics/lib/routes";
import { FolderDataType, WorkspaceType } from "@/modules/types";

interface Crumb {
  id: string;
  label: string;
  href?: string;
  isCurrent?: boolean;
}

const KNOWN_LABELS: Record<string, string> = {
  console: "Console",
  "content-library": "Content Library",
  videos: "Videos",
  analytics: "Analytics",
  channels: "Channels",
  favorites: "Favorites",
  player: "Player",
  settings: "Settings",
  security: "Security",
  usage: "Usage",
  leads: "Leads",
  overview: "Overview",
  live: "Real-time",
  audience: "Audience",
  engagement: "Engagement",
  conversions: "Conversions",
  playback: "Playback quality",
  "form-submissions": "Form Submissions",
  form_submissions: "Form Submissions",
  "cta-clicks": "CTA Clicks",
  cta_clicks: "CTA Clicks",
  "watch-time": "Watch Time",
  watch_time: "Watch Time",
  views: "Views",
};

function formatSegmentLabel(segment: string): string {
  if (!segment) return "";
  const lower = segment.toLowerCase();
  if (KNOWN_LABELS[lower]) {
    return KNOWN_LABELS[lower];
  }
  return segment
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function BreadCumbConsole() {
  const pathname = usePathname() || "/console";
  const params = useParams();
  const trpc = useTRPC();

  // 1. Workspace query for folder resolution
  const { data: workspace } = useQuery(trpc.user.getWorkspace.queryOptions());
  const workspaceData = workspace as WorkspaceType | undefined;

  // 2. Identify entity IDs from path and params
  const cleanPath = pathname.replace(/\/+$/, "") || "/console";

  const isFolderRoute = cleanPath.startsWith("/console/content-library/folder/");
  const folderID = isFolderRoute
    ? ((params?.id as string) || cleanPath.split("/folder/")[1]?.split("/")[0])
    : undefined;

  // Video ID resolution
  const videoMatch = cleanPath.match(/\/video\/([^/?#]+)/i);
  const analyticsVideoId = getVideoIdFromPath(cleanPath);
  const targetVideoId =
    analyticsVideoId ||
    (videoMatch ? videoMatch[1] : undefined) ||
    (cleanPath.includes("/video/") ? (params?.id as string) : undefined);

  // Channel ID resolution
  const isChannelDetail = cleanPath.startsWith("/console/channels/");
  const channelID = isChannelDetail
    ? ((params?.id as string) || cleanPath.split("/channels/")[1]?.split("/")[0])
    : undefined;

  // 3. Conditional queries
  const { data: folderBreadcrumbs } = useQuery({
    ...trpc.folder.getFolderBreadCumb.queryOptions({
      workspaceID: workspaceData?.id || "",
      folderID: folderID || "",
    }),
    enabled: isFolderRoute && !!folderID && !!workspaceData?.id,
  });

  const { data: videoData } = useQuery({
    ...trpc.video.getVideo.queryOptions({ videoId: targetVideoId || "" }),
    enabled: !!targetVideoId,
    staleTime: 60_000,
  });

  const { data: channelData } = useQuery({
    ...trpc.channel.get.queryOptions({ channelId: channelID || "" }),
    enabled: isChannelDetail && !!channelID,
    staleTime: 60_000,
  });

  const videoTitle = (videoData as { title?: string } | undefined)?.title;
  const channelName = (channelData as { name?: string } | undefined)?.name;
  const folders = (folderBreadcrumbs || []) as FolderDataType[];

  // 4. Construct Crumbs sequence
  const crumbs: Crumb[] = [];

  if (cleanPath === "/console") {
    crumbs.push({ id: "dashboard", label: "Dashboard", isCurrent: true });
  } else if (cleanPath.startsWith("/console/content-library")) {
    const rootCrumb: Crumb = {
      id: "content-library",
      label: "Content Library",
      href: "/console/content-library",
    };

    if (cleanPath === "/console/content-library") {
      crumbs.push({ ...rootCrumb, isCurrent: true, href: undefined });
    } else if (isFolderRoute) {
      crumbs.push(rootCrumb);
      if (folders.length > 0) {
        folders.forEach((f, idx) => {
          const isLast = idx === folders.length - 1;
          crumbs.push({
            id: f.id,
            label: f.name,
            href: isLast ? undefined : `/console/content-library/folder/${f.id}`,
            isCurrent: isLast,
          });
        });
      } else {
        crumbs.push({ id: "folder-current", label: "Folder", isCurrent: true });
      }
    } else if (cleanPath.startsWith("/console/content-library/video")) {
      crumbs.push(rootCrumb);
      if (targetVideoId) {
        const isLeads = cleanPath.endsWith("/leads");
        const videoHref = `/console/content-library/video/${targetVideoId}`;
        const label = videoTitle || "Video";

        if (isLeads) {
          crumbs.push({ id: "video", label, href: videoHref });
          crumbs.push({ id: "leads", label: "Leads", isCurrent: true });
        } else {
          crumbs.push({ id: "video", label, isCurrent: true });
        }
      } else {
        crumbs.push({ id: "video", label: "Videos", isCurrent: true });
      }
    } else {
      crumbs.push({ ...rootCrumb, isCurrent: true, href: undefined });
    }
  } else if (cleanPath.startsWith("/console/videos")) {
    crumbs.push({ id: "videos", label: "Videos", isCurrent: true });
  } else if (cleanPath.startsWith("/console/analytics")) {
    const analyticsCrumb: Crumb = {
      id: "analytics",
      label: "Analytics",
      href: "/console/analytics",
    };

    if (cleanPath === "/console/analytics" || cleanPath === "/console/analytics/overview") {
      crumbs.push({ ...analyticsCrumb, isCurrent: true, href: undefined });
    } else if (analyticsVideoId) {
      crumbs.push(analyticsCrumb);
      const videoLabel = videoTitle || "Video Analytics";
      const videoBase = `/console/analytics/${analyticsVideoId}`;

      const activeTab = getAnalyticsTabFromPath(cleanPath);
      if (activeTab === "overview") {
        crumbs.push({ id: "video", label: videoLabel, isCurrent: true });
      } else {
        const tabConfig = ANALYTICS_ROUTE_CONFIGS.find((c) => c.value === activeTab);
        const sectionLabel = tabConfig ? tabConfig.label : formatSegmentLabel(activeTab);
        crumbs.push({ id: "video", label: videoLabel, href: videoBase });
        crumbs.push({ id: "section", label: sectionLabel, isCurrent: true });
      }
    } else {
      crumbs.push(analyticsCrumb);
      const activeTab = getAnalyticsTabFromPath(cleanPath);
      const tabConfig = ANALYTICS_ROUTE_CONFIGS.find((c) => c.value === activeTab);
      const sectionLabel = tabConfig ? tabConfig.label : formatSegmentLabel(cleanPath.split("/").pop() || "");
      crumbs.push({ id: "section", label: sectionLabel, isCurrent: true });
    }
  } else if (cleanPath.startsWith("/console/channels")) {
    const channelsCrumb: Crumb = {
      id: "channels",
      label: "Channels",
      href: "/console/channels",
    };

    if (cleanPath === "/console/channels") {
      crumbs.push({ ...channelsCrumb, isCurrent: true, href: undefined });
    } else {
      crumbs.push(channelsCrumb);
      crumbs.push({
        id: "channel-details",
        label: channelName || "Channel Details",
        isCurrent: true,
      });
    }
  } else if (cleanPath === "/console/favorites") {
    crumbs.push({ id: "favorites", label: "Favorites", isCurrent: true });
  } else if (cleanPath.startsWith("/console/player/settings")) {
    crumbs.push({ id: "player-settings", label: "Player Settings", isCurrent: true });
  } else {
    // Dynamic fallback for any other console route
    const segments = cleanPath.split("/").filter(Boolean).slice(1); // skip 'console'
    let cumulative = "/console";
    segments.forEach((seg, idx) => {
      cumulative += `/${seg}`;
      const isLast = idx === segments.length - 1;
      crumbs.push({
        id: `crumb-${idx}`,
        label: formatSegmentLabel(seg),
        href: isLast ? undefined : cumulative,
        isCurrent: isLast,
      });
    });
  }

  // 5. Truncation logic (keep first, ellipsis, keep last 2)
  const MAX_VISIBLE = 3;
  const shouldTruncate = crumbs.length > MAX_VISIBLE;

  const firstCrumb = crumbs[0];
  const trailingCrumbs = shouldTruncate ? crumbs.slice(-2) : crumbs.slice(1);

  return (
    <div className="w-fit min-w-0">
      <Breadcrumb className="w-full">
        <BreadcrumbList className="flex items-center flex-nowrap text-xs md:text-sm">
          {/* Root Anchor: Console Home */}
          <BreadcrumbItem className="shrink-0">
            <BreadcrumbLink asChild>
              <Link
                href="/console"
                className="cursor-pointer text-stone-700 hover:text-stone-900 transition-colors flex items-center p-0.5 rounded hover:bg-stone-100"
                title="Console Home"
              >
                <Home className="size-4" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {crumbs.length > 0 && <BreadcrumbSeparator className="shrink-0" />}

          {/* First Crumb */}
          {firstCrumb && (
            <BreadcrumbItem className="shrink-0">
              {firstCrumb.isCurrent || !firstCrumb.href ? (
                <BreadcrumbPage
                  className="text-stone-900 font-semibold truncate max-w-[120px] sm:max-w-[180px]"
                  title={firstCrumb.label}
                >
                  {firstCrumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link
                    href={firstCrumb.href}
                    className="cursor-pointer text-stone-600 hover:text-stone-900 transition-colors font-medium truncate max-w-[120px] sm:max-w-[180px]"
                    title={firstCrumb.label}
                  >
                    {firstCrumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          )}

          {/* Middle Ellipsis Indicator if Truncated */}
          {shouldTruncate && (
            <>
              <BreadcrumbSeparator className="shrink-0" />
              <BreadcrumbItem className="shrink-0">
                <BreadcrumbEllipsis className="size-4 text-stone-400" />
              </BreadcrumbItem>
            </>
          )}

          {/* Trailing Crumbs */}
          {trailingCrumbs.map((crumb) => (
            <React.Fragment key={crumb.id}>
              <BreadcrumbSeparator className="shrink-0" />
              <BreadcrumbItem className="shrink-0 min-w-0">
                {crumb.isCurrent || !crumb.href ? (
                  <BreadcrumbPage
                    className="text-stone-900 font-semibold truncate max-w-[130px] sm:max-w-[200px] md:max-w-[260px]"
                    title={crumb.label}
                  >
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      href={crumb.href}
                      className="cursor-pointer text-stone-600 hover:text-stone-900 transition-colors font-medium truncate max-w-[120px] sm:max-w-[180px]"
                      title={crumb.label}
                    >
                      {crumb.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

export default BreadCumbConsole;
