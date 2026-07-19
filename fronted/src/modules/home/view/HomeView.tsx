"use client";
import React from "react";
import TopHeader from "../component/TopHeader";
import HeroSection from "../component/HeroSection";

function HomeView() {
  return (
    <div className="w-full h-full  min-h-screen pt-3 lg:pt-5 relative">
      <HeroSection/>
    </div>
  );
}

export default HomeView;
