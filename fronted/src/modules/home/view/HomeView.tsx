"use client";
import React from "react";
import TopHeader from "../component/TopHeader";
import HeroSection from "../component/HeroSection";
import IntroVideo from "../component/IntroVideo";
import FeatureSection from "../component/FeatureSection";

import PricingSection from "@/modules/console/component/PricingSection";
import GlobalDeliverySection from "../component/GlobalDeliverySection";
import ReviewSection from "../component/ReviewSection";
import FinalCta from "../component/FinalCta";
import Intigration from "../component/Intigration";

function HomeView() {
  return (
    <div className="w-full  bg-[#faf9f5]  h-full  min-h-screen zpt-3 zlg:pt-5 relative">
      
      <div className="max-w-[1280px] px-5 sm:px-7 lg:px-8   mx-auto">

      <HeroSection/>
      <ReviewSection/>
      <FeatureSection/>
      <GlobalDeliverySection/>
      <Intigration/>
      <PricingSection/>
      <FinalCta/>

      </div>

    </div>
  );
}

export default HomeView;
