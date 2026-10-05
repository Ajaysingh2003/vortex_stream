import AnalyticsView from "@/modules/analytics/view/AnalyticsView";
import { AnalyticsLoading } from "@/modules/analytics/components/AnalyticsLoading";
import React, { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<AnalyticsLoading />}>
      <AnalyticsView tab="overview" />
    </Suspense>
  );
}