"use client";
import React from "react";
import TopHeader from "../component/TopHeader";
import HeroSection from "../component/HeroSection";
import IntroVideo from "../component/IntroVideo";
import FeatureSection from "../component/FeatureSection";
import ContactUs from "../component/ContactUs";

function HomeView() {
  return (
    <div className="w-full  bg-[#faf9f5]  h-full  min-h-screen zpt-3 zlg:pt-5 relative">
      <div className="max-w-[1280px]    mx-auto">

      <HeroSection/>
      <FeatureSection/>
      <ContactUs/>
      </div>
    </div>
  );
}

export default HomeView;
