import React from "react";
import PlanCard from "./PlanCard";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { BillingConfigResponse, FeatureItem } from "@/modules/types";

import { 
  BrandfetchIcon, 
  WorkIcon,
  Database02Icon, 
  PlayIcon, 
  AnalysisTextLinkIcon, 
  AiVideoIcon, 
  ArrowDataTransferVerticalIcon,
  Mail01Icon 
} from '@hugeicons/core-free-icons';
function PricingCardSection({
  timeLine,
}: {
  timeLine: "monthly" | "quarterly" | "annually";
}) {
  const trpc = useTRPC();
  const { data, error } = useSuspenseQuery(
    trpc.billing.getPlans.queryOptions(),
  );

  const plans = data as BillingConfigResponse;

  const Freefeature: FeatureItem[] = [
    {
      label: "1 Active Workspace",
      icon: WorkIcon,
    },
    {
      label: "500 MB Secure Storage",
      icon: Database02Icon,
    },
    {
      label: "3 Hours Video Playback",
      icon: PlayIcon,
    },
    // {
    //   label: "10 GB Bandwidth Delivery",
    //   icon: ArrowDataTransferVerticalIcon,
    // },
    {
      label: "Custom Video Player",
      icon: AiVideoIcon,
    },
    {
      label: "Email Support",
      icon: Mail01Icon,
    },
    {
      label: "Advance Analytics",
      icon: AnalysisTextLinkIcon,
    },
  ];
  const Starterfeature: FeatureItem[] = [
    {
      label: "1 Active Workspace",
      icon: WorkIcon,
    },
    {
      label: "500 MB Secure Storage",
      icon: Database02Icon,
    },
    {
      label: "3 Hours Video Playback",
      icon: PlayIcon,
    },
    // {
    //   label: "10 GB Bandwidth Delivery",
    //   icon: ArrowDataTransferVerticalIcon,
    // },
    {
      label: "Custom Video Player",
      icon: AiVideoIcon,
    },
    {
      label: "Email Support",
      icon: Mail01Icon,
    },
    {
      label: "Advance Analytics",
      icon: AnalysisTextLinkIcon,
    },
    {
      label: "Custom Branding",
      icon: BrandfetchIcon,
    },
  ];

  return (
    <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-5 lg:grid-cols-4">
      <PlanCard feature={Freefeature} timeLine={timeLine} plan={plans["free"]} />
      <PlanCard feature={Starterfeature} timeLine={timeLine} plan={plans["starter"]} />
      <PlanCard popular={true} plan={plans["pro"]} timeLine={timeLine} />
      <PlanCard plan={plans["business"]} timeLine={timeLine} />
    </div>
  );
}

export default PricingCardSection;
