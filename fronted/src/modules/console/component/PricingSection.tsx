import React, { useState } from "react";
import PricingPlan from "./PricingPlan";
import PricingCardSection from "./PricingCardSection";

function PricingSection() {
  const [timeLine, setTimeLine] = useState<
    "monthly" | "quarterly" | "annually"
  >("monthly");
  return (
    <div className="w-full flex flex-col gap-10 ">
      
      <div
        aria-label="pricing-plan"
        className="w-full flex items-center justify-center"
      >
        <PricingPlan timeLine={timeLine} setTimeLine={setTimeLine} />
      </div>
      <div className="w-full h-full">
        <PricingCardSection timeLine={timeLine} />
      </div>
    </div>
  );
}

export default PricingSection;
