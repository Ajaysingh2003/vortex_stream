"use client";
import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/modules/console/component/AppSidebar";
import { ConsoleProvider } from "@/modules/console/context/ConsoleContext";
// import { AppSidebar } from "../modules/console/component/AppSidebar";

function layout({ children }: { children: React.ReactNode }) {
  return (
    <ConsoleProvider>
    <SidebarProvider>
      <section className="flex  w-full h-full">
        {
          <div className=" py-8 h-full">
            <AppSidebar />
          </div>
        }

        <div className="w-full">
          <div className="w-full py-1 px-1 md:px-2 md:py-2 border-stone-200 border-b">
            <SidebarTrigger />
          </div>
          {children}
        </div>
      </section>
    </SidebarProvider>
    </ConsoleProvider>
  );
}

export default layout;
