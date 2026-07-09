import Navbar from "@/modules/home/component/Navbar";
import React from "react";

function layout({ children }: { children: React.ReactNode }) {
  return <div className="w-full min-h-screen">
    <div className="w-full flex items-center justify-center">
      <Navbar/>
    </div>
   <section className="w-full h-full">
     {children}
   </section>
    </div>;
}

export default layout;
