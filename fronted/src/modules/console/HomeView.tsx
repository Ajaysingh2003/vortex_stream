"use client";
import React from "react";
import UploadFile from "./component/UploadFile";
import TopHeader from "./component/TopHeader";
import ImportVideos from "../upload/component/ImportVideos";
import StorageCard from "./component/StorageCard";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { UserDataType, UserSubscriptionType, WorkspaceType } from "@/modules/types";
import { getMaxGb } from "@/lib/config";
import BandwidthCard from "./component/BandwidthCard";
import TotalVideosCard from "./component/TotalVideoCount";
import LeadSubmissionsCard from "../channel/components/LeadFormCard";

type BandwidthOverview = {
  usedBytes: number;
  limitGb: number;
  dailyData: { date: string; gb: number }[];
};

function HomeView() {
  const trpc = useTRPC();
  const { data: user } = useSuspenseQuery(trpc.user.profile.queryOptions());
  const { data: plan } = useSuspenseQuery(trpc.user.getCurrentPlan.queryOptions());
  const { data: workspace } = useSuspenseQuery(
    trpc.user.getWorkspace.queryOptions(),
  );
  const { data: bandwidthData } = useSuspenseQuery(
    trpc.bandwidth.overview.queryOptions(),
  );
  const bandwidth = bandwidthData as BandwidthOverview;
  const userData = user as UserDataType;
  const planData = plan as UserSubscriptionType;
  const workspaceData = workspace as WorkspaceType;
  // console.log(,"fuck")
  return (
    <div className="w-full h-full min-h-screen relative bg-transparent">
      <div className="px-4 md:px-12 py-4 w-full">
        <div className="flex flex-col gap-6 md:gap-4">
          <TopHeader
            Header="Dashboard"
            Btnchild={
              <div className="flex flex-row gap-3">
               <div className="hidden md:inline-block">
                 <ImportVideos />
               </div>
                <UploadFile />
              </div>
            }
          />

          <div className="grid-cols-1 grid gap-2 md:gap-3 lg:gap-5  md:grid-cols-2 lg:grid-cols-3">
            <StorageCard
              usedBytes={userData.userStorageUsage.usedBytes}
              limitGb={getMaxGb(planData.plan)}
            />
            <BandwidthCard
              usedBytes={userData.usageCounters[0].bandwidthBytesUsed}
              limitGb={bandwidth.limitGb}
              dailyData={bandwidth.dailyData}
            />
            <TotalVideosCard workspaceId={workspaceData.id} />
            <LeadSubmissionsCard/>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeView;
