"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Users,
  Home,
  Library,
  Star,
  TvMinimalPlay,
  ShieldCog,
  ChartPie,
  TvMinimal,
  Activity,
  ChartNoAxesCombined,
  Radio,
  LayoutDashboard,
  FormInput,
  Timer,
  Eye,
  GalleryThumbnailsIcon,
  SlidersHorizontal,
  MonitorPlay,
  Link2,
  BookMarked,
  MousePointerClick,
} from "lucide-react";

import { AnalyticsUpIcon, SubtitleIcon } from "@hugeicons/core-free-icons";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

import ProfileMenu from "./ProfileMenu";
import { cn } from "@/lib/utils";
import SidebarStorage from "./SidebarStorage";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { WorkspaceType } from "@/modules/types";
import { HugeiconsIcon } from "@hugeicons/react";

export function AppSidebar() {
  const trpc = useTRPC();
  const { data: workspace } = useSuspenseQuery(
    trpc.user.getWorkspace.queryOptions(),
  );
  const workspaceData = workspace as WorkspaceType;

  const { open } = useSidebar();
  const pathName = usePathname();
  const searchParams = useSearchParams();

  const currentScope = searchParams.get("setting_scope") || "thumbnail";
  const currentAnalyticsScope = searchParams.get("scope") || "overview";

  // Route matchers
  const isVideoRoute = /\/video(\/.*)?$/i.test(pathName);
  const isAnalyticsRoute = /\/analytics(\/.*)?$/i.test(pathName);

  const createScopeUrl = (scope: string) => {
    const params = new URLSearchParams(
      searchParams ? searchParams.toString() : "",
    );
    params.set("setting_scope", scope);
    const videoPath = pathName.replace(/\/leads\/?$/, "");
    return scope === "leads"
      ? `${videoPath}/leads`
      : `${videoPath}?${params.toString()}`;
  };

  const createAnalyticsUrl = (scope: string) => {
    const params = new URLSearchParams(
      searchParams ? searchParams.toString() : "",
    );
    params.set("scope", scope);
    return `${pathName.split("?")[0]}?${params.toString()}`;
  };

  const menuItems = [
    { title: "Home", href: "/console", icon: Home, exact: true },
    {
      title: "Content Library",
      href: "/console/content-library",
      icon: Library,
    },
    { title: "Videos", href: "/console/videos", icon: TvMinimalPlay },
    { title: "Channels", href: "/console/channels", icon: TvMinimal },
    { title: "Favorites", href: "/console/favorites", icon: Star },
    {
      title: "Player Settings",
      href: "/console/player/settings",
      icon: TvMinimalPlay,
    },
    { title: "Security", href: "/console/Video/security", icon: ShieldCog },
    { title: "Usage", href: "/console/Video/usage", icon: ChartPie },
  ];

  const TABS = [
    {
      value: "thumbnail",
      label: "Thumbnail",
      icon: "lucide",
      lucideIcon: GalleryThumbnailsIcon,
    },
    {
      value: "form",
      label: "Forms",
      icon: "lucide",
      lucideIcon: SlidersHorizontal,
    },
    { value: "leads", label: "Leads", icon: "lucide", lucideIcon: Users },
    {
      value: "analytics",
      label: "Analytics",
      icon: "hugeicons",
      hugeIcon: AnalyticsUpIcon,
    },
    {
      value: "end_screen",
      label: "End screen",
      icon: "lucide",
      lucideIcon: MonitorPlay,
    },
    {
      value: "subtitle",
      label: "Subtitles",
      icon: "hugeicons",
      hugeIcon: SubtitleIcon,
    },
    {
      value: "chapter",
      label: "Chapters",
      icon: "lucide",
      lucideIcon: BookMarked,
    },
    {
      value: "cta",
      label: "CTA",
      icon: "lucide",
      lucideIcon: MousePointerClick,
    },
    {
      value: "domain_restriction",
      label: "Domain Restriction",
      icon: "lucide",
      lucideIcon: Link2,
    },
  ] as const;

  const ANALYTICS_TABS = [
    { value: "overview", label: "Overview", icon: LayoutDashboard },
    { value: "live", label: "Real-time", icon: Radio },
    { value: "audience", label: "Audience", icon: Users },
    { value: "engagement", label: "Engagement", icon: ChartNoAxesCombined },
    { value: "conversions", label: "Conversions", icon: MousePointerClick },
    { value: "playback", label: "Playback quality", icon: Activity },
    { value: "form_submissions", label: "Form Submission", icon: FormInput },
    { value: "cta_clicks", label: "CTA Clicks", icon: MousePointerClick },
    { value: "watch_time", label: "Watch Time", icon: Timer },
    { value: "views", label: "Views", icon: Eye },
  ] as const;

  return (
    <Sidebar
      className="max-w-64 border-r-[0.5px] border-stone-200 font-content bg-surface tracking-tight"
      collapsible="icon"
    >
      <SidebarHeader
        className={cn("bg-surface transition-all", open && "pl-2.5")}
      >
        <ProfileMenu />
      </SidebarHeader>

      <SidebarContent className="bg-surface">
        {isVideoRoute ? (
          /* Video Scope Navigation */
          <SidebarGroup>
            <SidebarGroupContent className="pt-4 md:pt-2">
              <SidebarMenu className="space-y-1">
                {TABS.map((item) => {
                  const isActive = pathName.endsWith("/leads")
                    ? item.value === "leads"
                    : currentScope === item.value;

                  return (
                    <SidebarMenuItem key={item.value}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                        className={cn(
                          "pl-4 transition-all duration-150 ease-in-out hover:bg-black/5",
                          isActive && "bg-black/5 font-semibold text-slate-900",
                        )}
                      >
                        <Link
                          href={createScopeUrl(item.value)}
                          scroll={false}
                          className="flex items-center gap-4 w-full"
                        >
                          {item.icon === "hugeicons" ? (
                            <HugeiconsIcon
                              icon={(item as any).hugeIcon}
                              size={18}
                              strokeWidth={1.6}
                              className={cn(
                                "shrink-0 size-6 text-slate-500",
                                isActive && "text-slate-900",
                              )}
                            />
                          ) : (
                            React.createElement((item as any).lucideIcon, {
                              size: 15,
                              strokeWidth: 1.6,
                              className: cn(
                                "shrink-0 text-slate-500",
                                isActive && "text-slate-900",
                              ),
                            })
                          )}
                          <span
                            className={cn(
                              "tracking-wide font-heading",
                              isActive
                                ? "text-slate-900 font-semibold"
                                : "text-accent",
                            )}
                          >
                            {item.label}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : isAnalyticsRoute ? (

          <SidebarGroup>
            <SidebarGroupContent className="pt-4 md:pt-2">
              <SidebarMenu className="space-y-1">
                {ANALYTICS_TABS.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentAnalyticsScope === item.value;

                  return (
                    <SidebarMenuItem key={item.value}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                        className={cn(
                          "pl-4 transition-all duration-150 ease-in-out hover:bg-black/5",
                          isActive && "bg-black/5 font-semibold text-slate-900",
                        )}
                      >
                        <Link
                          href={createAnalyticsUrl(item.value)}
                          scroll={false}
                          className="flex items-center gap-4 w-full"
                        >
                          <Icon
                            className={cn(
                              "size-4 text-slate-500 shrink-0",
                              isActive && "text-slate-900",
                            )}
                          />
                          <span
                            className={cn(
                              "tracking-wide font-heading",
                              isActive
                                ? "text-slate-900 font-semibold"
                                : "text-accent",
                            )}
                          >
                            {item.label}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (

          <SidebarGroup>
            <SidebarGroupContent className="pt-4 md:pt-2">
              <SidebarMenu className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.exact
                    ? pathName === item.href || pathName === `${item.href}/`
                    : pathName.startsWith(item.href);

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={cn(
                          "pl-4 transition-all duration-150 ease-in-out hover:bg-black/5",
                          isActive && "bg-black/5 font-semibold text-slate-900",
                        )}
                      >
                        <Link
                          href={item.href}
                          className="flex items-center gap-4 w-full"
                        >
                          <Icon
                            className={cn(
                              "size-4 text-slate-500 shrink-0",
                              isActive && "text-slate-900",
                            )}
                          />
                          <span className="text-accent tracking-wide font-heading">
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-10 md:mt-24 pl-4">
          <SidebarStorage />
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
