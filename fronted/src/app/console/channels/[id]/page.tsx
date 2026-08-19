import Loader from "@/components/static/Loader";
import ChannelDetailView from "@/modules/channel/view/ChannelDetailView";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";

export default async function ChannelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(trpc.user.getWorkspace.queryOptions()),
    queryClient.prefetchQuery(trpc.channel.get.queryOptions({ channelId: id })),
    queryClient.prefetchQuery(trpc.channel.listVideos.queryOptions({ channelId: id })),
  ]);
  return <HydrationBoundary state={dehydrate(queryClient)}><Suspense fallback={<Loader />}><ChannelDetailView channelId={id} /></Suspense></HydrationBoundary>;
}
