import VideoAnalyticView from "@/modules/analytics/view/VideoAnalyticView";
import { AnalyticsLoading } from "@/modules/analytics/components/AnalyticsLoading";
import React, { Suspense } from "react";

export default async function Page({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;

  return (
    <Suspense fallback={<AnalyticsLoading />}>
      <VideoAnalyticView videoId={videoId} tab="views" />
    </Suspense>
  );
}
