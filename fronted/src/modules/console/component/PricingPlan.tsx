import { Button } from "@/components/ui/button";
import React from "react";

type PricingTimelineType = {
  timeLine: "monthly" | "quarterly" | "annually";
  setTimeLine: React.Dispatch<
    React.SetStateAction<"monthly" | "quarterly" | "annually">
  >;
};

type planType = "monthly" | "quarterly" | "annually";
function PricingPlan({ timeLine, setTimeLine }: PricingTimelineType) {
  const plans = [
    { label: "Monthly", scope: "monthly" },
    { label: "Quarterly", scope: "quarterly" },
    { label: "Annually", scope: "annually" },
  ];

  return (
    <div className="bg-[#fbfbfb] p-0.5 flex gap-1  rounded-md">
      {plans.map((e, i) => {
        const isActive = e.scope == timeLine;
        return (
          <Button
            key={i}
            onClick={() => setTimeLine(e.scope as planType)}
            variant={"outline"}
            className={`rounded-md font-semibold  cursor-pointer border px-3 py-1.5 text-xs transition-all duration-200 ${
              isActive
                ? "bg-white/90 text-accent shadow-2xs  hover:bg-white/60  hover:border-zinc-200 hover:text-accent"
                : "border-transparent bg-transparent  text-stone-500 duration-300 transition-all hover:bg-white/10 hover:border-zinc-200 hover:text-accent hover:shadow-2xs"
            }
             relative
            `}
          >
            {e.scope != "monthly" && (
              <span className="bg-blue-500 absolute bottom-0 translate-y-1/2 px-2 py-0.5 font-bold text-white rounded-3xl text-center text-[10px]  uppercase">
                {e.scope == "quarterly" ? " save 10%" : " save 20%"}
              </span>
            )}
            {e.label}
          </Button>
        );
      })}
    </div>
  );
}

export default PricingPlan;
