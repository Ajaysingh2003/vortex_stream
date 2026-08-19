"use client";

import Link from "next/link";
import { ArrowUpRight, MoreHorizontal, PlaySquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type Channel = { id: string; name: string; workspaceId: string; createdAt: string };

const colors = ["from-violet-500 to-indigo-600", "from-cyan-500 to-blue-600", "from-rose-500 to-orange-500", "from-emerald-500 to-teal-600"];

export default function ChannelCard({ channel, index }: { channel: Channel; index: number }) {
  const initials = channel.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <Card className="group overflow-hidden rounded-3xl border-0 bg-card shadow-sm ring-1 ring-foreground/10 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className={`relative flex h-36 items-end bg-gradient-to-br ${colors[index % colors.length]} p-5`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,.3),transparent_35%)]" />
        <div className="relative flex size-16 items-center justify-center rounded-2xl border border-white/30 bg-white/20 text-xl font-semibold text-white shadow-lg backdrop-blur-sm">
          {initials}
        </div>
        <Button asChild size="icon" variant="secondary" className="absolute right-4 top-4 size-9 rounded-full bg-white/90 opacity-0 transition-opacity group-hover:opacity-100">
          <Link href={`/console/channels/${channel.id}`} aria-label={`Open ${channel.name}`}><ArrowUpRight /></Link>
        </Button>
      </div>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-heading text-lg font-semibold">{channel.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">Created {new Date(channel.createdAt).toLocaleDateString()}</p>
          </div>
          <MoreHorizontal className="mt-1 size-5 text-muted-foreground" />
        </div>
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="rounded-full px-3 font-normal"><PlaySquare /> Video collection</Badge>
          <Link href={`/console/channels/${channel.id}`} className="text-sm font-medium text-primary hover:underline">Open</Link>
        </div>
      </CardContent>
    </Card>
  );
}
