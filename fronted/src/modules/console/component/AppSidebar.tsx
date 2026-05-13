// components/app-sidebar.tsx

"use client";
import { ChartPie, ShieldCog, TvMinimalPlay } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
} from "@/components/ui/sidebar";

import { Home, BarChart, Settings, Video, Library, Import } from "lucide-react";
import Link from "next/link";
import ProfileMenu from "./ProfileMenu";

export function AppSidebar() {
  return (
    <Sidebar className="max-w-56 border-r-[0.5px] border-stone-200  font-content  tracking-tight" collapsible="icon">
      
      <SidebarHeader>
        <ProfileMenu/>
      </SidebarHeader>
      <SidebarContent className="bg-[#f9f9fd]">
        <SidebarGroup>
          <SidebarGroupContent className="pt-4 md:pt-2">
            <SidebarMenu className="pl-2 space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Video />
                  <Link href={`/console/overview`}>Overview</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Library />
                  <Link href={"/console/video-library"}>Video Library</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Import />
                  <Link href={"/console/import-video"}>Import Video</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton>
                  <TvMinimalPlay />
                  <Link href={"/console/Video-player/setting"}>
                    Player Setting
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton>
                  <ShieldCog />
                  <Link href={"/console/Video/security"}>Security</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <ChartPie />
                  <Link href={"/console/Video/usage"}>Usage</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

    </Sidebar>
  );
}
