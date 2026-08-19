"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { FolderOpen, Layers3, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTRPC } from "@/trpc/client";
import { WorkspaceType } from "@/modules/types";
import TopHeader from "@/modules/console/component/TopHeader";
import ChannelCreateDialog from "../components/ChannelCreateDialog";
import ChannelCard, { Channel } from "../components/ChannelCard";

export default function ChannelsView() {
  const trpc = useTRPC();
  const { data: workspace } = useSuspenseQuery(
    trpc.user.getWorkspace.queryOptions(),
  );
  const { data: response } = useSuspenseQuery(trpc.channel.list.queryOptions());
  const workspaceData = workspace as WorkspaceType;
  const channels = ((response as { data?: Channel[] })?.data ??
    []) as Channel[];

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 px-4 py-6 md:px-10 lg:px-14">
      <div className="mx-auto max-w-7xl space-y-8">
        <TopHeader
          Header="Channels"
          Btnchild={<ChannelCreateDialog workspaceId={workspaceData.id} />}
        />
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary/90 to-indigo-700 p-7 text-primary-foreground shadow-xl md:p-10">
          <div className="absolute -right-16 -top-24 size-72 rounded-full bg-white/10 blur-2xl" />
          <div className="relative max-w-2xl space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white/75">
              <Sparkles className="size-4" /> Organize your video library
            </div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
              Build collections people can follow.
            </h1>
            <p className="max-w-xl text-sm leading-6 text-white/75 md:text-base">
              Create focused channels for courses, launches, clients, or
              anything else you want to keep together.
            </p>
            <ChannelCreateDialog workspaceId={workspaceData.id} />
          </div>
        </section>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Your workspace</p>
            <h2 className="font-heading text-2xl font-semibold">
              All channels
            </h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Layers3 className="size-4" /> {channels.length}{" "}
            {channels.length === 1 ? "channel" : "channels"}
          </div>
        </div>
        {channels.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {channels.map((channel, index) => (
              <ChannelCard key={channel.id} channel={channel} index={index} />
            ))}
          </div>
        ) : (
          <Card className="rounded-3xl border-dashed bg-muted/20 shadow-none">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FolderOpen className="size-7" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">
                  Your first channel starts here
                </h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Create a collection and add videos whenever you are ready.
                </p>
              </div>
              <ChannelCreateDialog workspaceId={workspaceData.id} />
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
