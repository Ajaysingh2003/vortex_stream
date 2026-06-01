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

export function AppSidebar() {
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
      href: "/console/Video-player/setting",
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

  return (
    <Sidebar 
      className="max-w-64 border-r-[0.5px] border-stone-200 font-content bg-surface tracking-tight" 
      collapsible="icon"
    >
      <SidebarHeader className={cn("bg-surface transition-all", open && "pl-2.5")}>
        <ProfileMenu />
      </SidebarHeader>

      <SidebarContent className="bg-surface">
        <SidebarGroup>
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
                    {/* 💡 asChild forwards custom active class properties straight down to Next's Link */}
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
        </SidebarGroup>
        <SidebarGroup className="mt-10 md:mt-24 pl-4">
          <SidebarStorage/>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}