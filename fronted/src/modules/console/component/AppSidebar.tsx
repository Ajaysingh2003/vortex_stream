"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Library, 
  Star, 
  TvMinimalPlay, 
  ShieldCog, 
  ChartPie, 
  Video,
  TvMinimal
} from "lucide-react";

import {
  Setting07Icon,
  ConversationIcon,
  AnalyticsUpIcon,
  SubtitleIcon,
} from "@hugeicons/core-free-icons";
import {
  GalleryThumbnailsIcon,
  SlidersHorizontal,
  MonitorPlay,
  Link2,
  BookMarked,
  MousePointerClick,
} from "lucide-react";

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
import { cn } from "@/lib/utils"; // Standard shadcn helper utility
import SidebarStorage from "./SidebarStorage";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { WorkspaceType } from "@/modules/types";
import { HugeiconsIcon } from "@hugeicons/react";

export function AppSidebar() {

  const trpc=useTRPC()
  const {data:workspace}=useSuspenseQuery(trpc.user.getWorkspace.queryOptions())

  const workspaceData= workspace as WorkspaceType
  const { open } = useSidebar();
  const pathName = usePathname();



  const menuItems = [
    {
      title: "Home",
      href: "/console",
      icon: Home,
      exact: true,
    },
    {
      title: "Content Library",
      href: "/console/content-library",
      icon: Library,
    },
    {
      title: "Video's",
      href: "/console/videos",
      icon: TvMinimalPlay,
    },
    {
      title: "channel",
      href: "/console/channel",
      icon: TvMinimal,
    },
    {
      title: "Favorites",
      href: "/console/favorites",
      icon: Star,
    },
    {
      title: "Player Setting",
      href: `/console/player/settings`,
      icon: TvMinimalPlay,
    },
    {
      title: "Security",
      href: "/console/Video/security",
      icon: ShieldCog,
    },
    {
      title: "Usage",
      href: "/console/Video/usage",
      icon: ChartPie,
    },
  ];


  const TABS = [
  // {
  //   value: "general",
  //   label: "General",
  //   icon: "hugeicons",
  //   hugeIcon: Setting07Icon,
  // },
  {
    value: "thumbnail",
    label: "Thumbnail",
    icon: "lucide",
    lucideIcon: GalleryThumbnailsIcon,
  },
  {
    value: "form",
    label: "Form's",
    icon: "lucide",
    lucideIcon: SlidersHorizontal,
  },
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
  { value: "cta", label: "CTA", icon: "lucide", lucideIcon: MousePointerClick },
  {
    value: "review_link",
    label: "Share link",
    icon: "lucide",
    lucideIcon: Link2,
  },
  {
    value: "comment",
    label: "Comments",
    icon: "hugeicons",
    hugeIcon: ConversationIcon,
  },
  ] as const;

  return (
    <Sidebar 
      className="max-w-64 border-r-[0.5px] border-stone-200 font-content bg-surface tracking-tight" 
      collapsible="icon"
    >
      <SidebarHeader className={cn("bg-surface transition-all", open && "pl-2.5")}>
        <ProfileMenu />
      </SidebarHeader>

      <SidebarContent className="bg-surface">

        {
        pathName.includes("/video") &&  <SidebarGroup  className="space-y-1">
            {
              TABS.map((item)=>{
                return <SidebarMenuButton key={item.label} className={cn(
                        "pl-4 transition-all duration-150 ease-in-out hover:bg-black/5",
                        false&& "bg-black/5 font-semibold text-slate-900"
                      )}>
                  <Link href={`?setting_scope=${item.value}`} className="flex items-center gap-4">
                        {item.icon === "hugeicons" ? (
                  <HugeiconsIcon
                    icon={(item as any).hugeIcon}
                    size={18}
                    strokeWidth={1.6}
                    className="shrink-0 size-6"
                  />
                ) : (
                  React.createElement((item as any).lucideIcon, {
                    size: 15,
                    strokeWidth: 1.6,
                    className: "shrink-0",
                  })
                )}
                        <span className="text-accent tracking-wide font-heading">
                          {item.label}
                        </span>
                      </Link>
                </SidebarMenuButton>
              })
            }
          </SidebarGroup>
        }

       { !pathName.includes("/video") && <SidebarGroup>
          <SidebarGroupContent className="pt-4z md:pt-z2">
            <SidebarMenu className="space-y-1">
              
              {menuItems.map((item) => {
                const Icon = item.icon;
                
                // 💡 Check active state checking rules dynamically
                const isActive = item.exact 
                  ? pathName === item.href || pathName === `${item.href}/`
                  : pathName.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        "pl-4 transition-all duration-150 ease-in-out hover:bg-black/5",
                        isActive && "bg-black/5 font-semibold text-slate-900"
                      )}
                    >
                      <Link href={item.href}>
                        <Icon className={cn("size-4 text-slate-500", isActive && "text-slate-900")} />
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
        </SidebarGroup>}

        <SidebarGroup className="mt-10 md:mt-24 pl-4">
          <SidebarStorage/>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}