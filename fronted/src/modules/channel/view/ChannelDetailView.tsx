"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowLeft, Film, Play, Trash2, Video } from "lucide-react";
import toast from "react-hot-toast";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/trpc/client";
import { WorkspaceType, VideoAsset } from "@/modules/types";
import AddVideoDialog from "../components/AddVideoDialog";

const cdn = process.env.NEXT_PUBLIC_CDN_URL ?? "";
export default function ChannelDetailView({ channelId }: { channelId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: workspace } = useSuspenseQuery(trpc.user.getWorkspace.queryOptions());
  const { data: channelResponse } = useSuspenseQuery(trpc.channel.get.queryOptions({ channelId }));
  const { data: videosResponse } = useSuspenseQuery(trpc.channel.listVideos.queryOptions({ channelId }));
  const channel = (channelResponse as { data?: { id: string; name: string; createdAt: string } }).data;
  const videos = ((videosResponse as { data?: VideoAsset[] }).data ?? []) as VideoAsset[];
  const remove = useMutation(trpc.channel.removeVideo.mutationOptions({ onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: trpc.channel.listVideos.queryKey({ channelId }) }); toast.success("Video removed"); }, onError: (error) => toast.error(error.message) }));
  const [confirming, setConfirming] = useState<string | null>(null);
  if (!channel) return null;
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 px-4 py-6 md:px-10 lg:px-14">
      <div className="mx-auto max-w-7xl space-y-8">
        <Link href="/console/channels" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> All channels</Link>
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 p-7 text-white shadow-xl md:p-10"><div className="absolute -right-10 -top-32 size-80 rounded-full bg-white/10 blur-3xl" /><div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><Badge className="mb-4 rounded-full border-white/20 bg-white/10 text-white">Video collection</Badge><h1 className="font-heading text-3xl font-semibold md:text-4xl">{channel.name}</h1><p className="mt-2 text-sm text-white/70">A focused collection in your workspace.</p></div><AddVideoDialog channelId={channelId} workspace={workspace as WorkspaceType} /></div></section>
        <div className="flex items-end justify-between"><div><p className="text-sm text-muted-foreground">Channel library</p><h2 className="font-heading text-2xl font-semibold">Videos in this channel</h2></div><span className="text-sm text-muted-foreground">{videos.length} {videos.length === 1 ? "video" : "videos"}</span></div>
        {videos.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{videos.map((video) => <Card key={video.id} className="group overflow-hidden rounded-3xl border-0 shadow-sm ring-1 ring-foreground/10"><div className="relative aspect-video overflow-hidden bg-muted">{video.thumbnail ? <Image fill unoptimized src={`${cdn}${video.thumbnail}`} alt="" className="object-cover transition-transform duration-300 group-hover:scale-105" /> : <div className="flex size-full items-center justify-center"><Film className="size-8 text-muted-foreground" /></div>}<Button size="icon" variant="secondary" className="absolute bottom-3 left-3 size-9 rounded-full opacity-0 transition-opacity group-hover:opacity-100" asChild><Link href={`/console/content-library/video/${video.id}`}><Play /></Link></Button></div><CardContent className="flex items-center gap-3 p-4"><div className="min-w-0 flex-1"><h3 className="truncate font-medium">{video.title}</h3><p className="mt-1 text-xs text-muted-foreground">{video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, "0")}` : "Video"}</p></div>{confirming === video.id ? <Button size="sm" variant="destructive" disabled={remove.isPending} onClick={() => { remove.mutate({ channelId, videoId: video.id }); setConfirming(null); }}>Remove</Button> : <Button size="icon-sm" variant="ghost" aria-label="Remove video" onClick={() => setConfirming(video.id)}><Trash2 /></Button>}</CardContent></Card>)}</div> : <Card className="rounded-3xl border-dashed bg-muted/20 shadow-none"><CardContent className="flex flex-col items-center justify-center gap-4 py-20 text-center"><div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Video className="size-7" /></div><h3 className="font-heading text-lg font-semibold">This channel is ready for its first video</h3><p className="max-w-sm text-sm text-muted-foreground">Add videos from your workspace to make this collection useful.</p><AddVideoDialog channelId={channelId} workspace={workspace as WorkspaceType} /></CardContent></Card>}
      </div>
    </main>
  );
}
