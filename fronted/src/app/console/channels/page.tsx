import Loader from "@/components/static/Loader";
import ChannelsView from "@/modules/channel/view/ChannelsView";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";

export default async function ChannelsPage() {
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(trpc.user.getWorkspace.queryOptions()),
    queryClient.prefetchQuery(trpc.channel.list.queryOptions()),
  ]);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<Loader />}>
        <ChannelsView />
      </Suspense>
    </HydrationBoundary>
  );
}
