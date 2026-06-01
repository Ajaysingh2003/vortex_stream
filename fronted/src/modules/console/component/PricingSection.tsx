import React, { useState } from "react";
import PricingPlan from "./PricingPlan";
import PricingCardSection from "./PricingCardSection";

function PricingSection() {
  const [timeLine, setTimeLine] = useState<
    "monthly" | "quarterly" | "annually"
  >("monthly");
  return (
    <div className="w-full flex flex-col gap-10 ">
      <div className=" flex items-center justify-center w-full">
        <h3 className="text-2xl md:max-w-164z md:text-4xl tracking-wider font-heading font-semibold text-center">
          The all-in-one platform <br /> for your Video,{" "}
          <span className=" italic text-gradient font-bold">at any scale</span>
        </h3>
      </div>
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
