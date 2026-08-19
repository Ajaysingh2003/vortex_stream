"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Film, Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTRPC } from "@/trpc/client";
import { WorkspaceType, VideoListType } from "@/modules/types";

const cdn = process.env.NEXT_PUBLIC_CDN_URL ?? "";
export default function AddVideoDialog({ channelId, workspace }: { channelId: string; workspace: WorkspaceType }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(trpc.video.videoListFromWorkspace.queryOptions({ workspaceId: workspace.id, limit: 100, cursor: "", date: "any", visibility: "all", sort: "created_desc" }));
  const videos = (data as VideoListType).items ?? [];
  const add = useMutation(trpc.channel.addVideo.mutationOptions({
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: trpc.channel.listVideos.queryKey({ channelId }) }); toast.success("Video added to channel"); },
    onError: (error) => toast.error(error.message),
  }));
  const filtered = videos.filter((video) => video.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="rounded-full"><Plus /> Add videos</Button></DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-xl">
        <DialogHeader><DialogTitle className="font-heading text-xl">Add videos to this channel</DialogTitle><DialogDescription>Choose videos from your workspace. You can remove them later.</DialogDescription></DialogHeader>
        <div className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your videos" className="h-10 rounded-xl pl-9" /></div>
        <div className="max-h-[min(55vh,420px)] space-y-2 overflow-y-auto pr-1">
          {filtered.length ? filtered.map((video) => (
            <button key={video.id} type="button" disabled={add.isPending} onClick={() => add.mutate({ channelId, videoId: video.id })} className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-muted disabled:opacity-60">
              <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">{video.thumbnail ? <Image fill unoptimized src={`${cdn}${video.thumbnail}`} alt="" className="object-cover" /> : <Film className="size-5 text-muted-foreground" />}</div>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{video.title}</span><Check className="size-4 text-muted-foreground" />
            </button>
          )) : <div className="py-10 text-center text-sm text-muted-foreground">No matching videos found.</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
