import React from "react";
// import HomeView from "../modules/console/HomeView";
import { SidebarTrigger } from "@/components/ui/sidebar";
import HomeView from "@/modules/console/HomeView";

function page() {
  return (
    <div className="w-full min-h-screen flex flex-col rounded-[12px] bg-[#ffff] h-full">
     
      <HomeView />
    </div>
  );
}

export default page;
