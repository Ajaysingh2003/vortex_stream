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
  { label: "1 Active Workspace", icon: WorkIcon },
  { label: "500 MB Video Storage", icon: Database02Icon },
  { label: "2 GB Video Delivery", icon: ArrowDataTransferVerticalIcon },
  { label: "3 Hours Video Playback", icon: PlayIcon },
  { label: "Adaptive Video Streaming", icon: AiVideoIcon },
  { label: "Global CDN Delivery", icon: ArrowDataTransferVerticalIcon },
  { label: "Custom Video Player", icon: AiVideoIcon },
  { label: "Basic Analytics", icon: AnalysisTextLinkIcon },
  { label: "Secure Video Playback", icon: PlayIcon },
  { label: "Email Support", icon: Mail01Icon },
];

const Starterfeature: FeatureItem[] = [
  { label: "3 Active Workspaces", icon: WorkIcon },
  { label: "10 GB Video Storage", icon: Database02Icon },
  { label: "100 GB Video Delivery", icon: ArrowDataTransferVerticalIcon },
  { label: "30 Hours Video Playback", icon: PlayIcon },
  { label: "Adaptive Bitrate Streaming", icon: AiVideoIcon },
  { label: "Global CDN Delivery", icon: ArrowDataTransferVerticalIcon },
  { label: "Custom Video Player", icon: AiVideoIcon },
  { label: "Advanced Analytics", icon: AnalysisTextLinkIcon },
  { label: "API Access", icon: ArrowDataTransferVerticalIcon },
  { label: "Email Support", icon: Mail01Icon },
];

const Profeature: FeatureItem[] = [
  { label: "5 Active Workspaces", icon: WorkIcon },
  { label: "100 GB Video Storage", icon: Database02Icon },
  { label: "1 TB Video Delivery", icon: ArrowDataTransferVerticalIcon },
  { label: "300 Hours Video Playback", icon: PlayIcon },
  { label: "Adaptive Bitrate Streaming", icon: AiVideoIcon },
  { label: "Global Edge CDN", icon: ArrowDataTransferVerticalIcon },
  { label: "Custom Branding", icon: BrandfetchIcon },
  { label: "Advanced Analytics", icon: AnalysisTextLinkIcon },
  { label: "API & Webhooks", icon: ArrowDataTransferVerticalIcon },
  { label: "Signed & Private Playback", icon: PlayIcon },
];

const Businessfeature: FeatureItem[] = [
  { label: "10 Active Workspaces", icon: WorkIcon },
  { label: "1 TB Video Storage", icon: Database02Icon },
  { label: "5 TB Video Delivery", icon: ArrowDataTransferVerticalIcon },
  { label: "1,500 Hours Video Playback", icon: PlayIcon },
  { label: "4K Adaptive Streaming", icon: AiVideoIcon },
  { label: "Priority Global CDN", icon: ArrowDataTransferVerticalIcon },
  { label: "White-label Video Player", icon: BrandfetchIcon },
  { label: "Advanced Analytics", icon: AnalysisTextLinkIcon },
  { label: "Full API & Webhooks", icon: ArrowDataTransferVerticalIcon },
  { label: "Priority Support", icon: Mail01Icon },
];
  return (
    <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-5 lg:grid-cols-4">
      <PlanCard feature={Freefeature} timeLine={timeLine} plan={plans["free"]} />
      <PlanCard feature={Starterfeature} timeLine={timeLine} plan={plans["starter"]} />
      <PlanCard feature={Profeature} popular={true} plan={plans["pro"]} timeLine={timeLine} />
      <PlanCard feature={Businessfeature} plan={plans["business"]} timeLine={timeLine} />
    </div>
  );
}

export default PricingCardSection;
