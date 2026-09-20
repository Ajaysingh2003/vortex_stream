"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  Check,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  HardDrive,
  Loader2,
  LockKeyhole,
  Play,
  Sparkles,
  Tv,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { VideoAsset, WorkspaceType } from "@/modules/types";
import { useTRPC } from "@/trpc/client";
import { formatBytes, formatTime } from "@/utils/utils";

function VideoUpdate() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const params = useParams();
  const videoId = params.id as string;

  const { data: workspace } = useSuspenseQuery(
    trpc.user.getWorkspace.queryOptions(),
  );
  const workspaceData = workspace as WorkspaceType;

  const { data } = useSuspenseQuery(
    trpc.video.getVideoFromWorkspace.queryOptions({
      videoId,
      workspaceID: workspaceData.id,
    }),
  );
  const video = data as VideoAsset;

  const [title, setTitle] = useState(video.title);
  const [isPrivate, setIsPrivate] = useState(video.isPrivate);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    setTitle(video.title);
    setIsPrivate(video.isPrivate);
  }, [video.title, video.isPrivate]);

  const hasChanges =
    title.trim() !== video.title.trim() || isPrivate !== video.isPrivate;

  const updateVideo = useMutation(
    trpc.video.UpdateVideo.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.video.getVideoFromWorkspace.queryOptions({
            videoId: video.id,
            workspaceID: workspaceData.id,
          }),
        );
        toast.success("Video details saved successfully");
      },
      onError: (error) =>
        toast.error(error.message || "Could not save video details"),
    }),
  );

  const saveDetails = async () => {
    const nextTitle = title.trim();
    if (!nextTitle) {
      toast.error("A video title is required");
      return;
    }
    await updateVideo.mutateAsync({
      videoId: video.id,
      workspaceID: workspaceData.id,
      title: nextTitle,
      isPrivate,
    });
  };

  const copyVideoId = async () => {
    try {
      await navigator.clipboard.writeText(video.id);
      setCopiedId(true);
      toast.success("Video ID copied to clipboard");
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      toast.error("Failed to copy ID");
    }
  };

  return (
    <aside className="w-full max-w-4xl mx-auto space-y-5 pb-12 font-content">
      {/* Overview */}
      <section className="rounded-2xl shadow-xs bg-[#f6f6f6] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 font-subheading text-[11px] text-muted-foreground">
              <span
                className={`size-1.5 rounded-full ${
                  isPrivate ? "bg-amber-500" : "bg-emerald-500"
                }`}
              />
              {isPrivate ? "Private" : "Public"}
            </span>
            <h1 className="font-heading text-xl sm:text-2xl font-semibold tracking-tight text-foreground truncate max-w-xl">
              {title || video.title || "Untitled Video"}
            </h1>
            <p className="font-subheading text-xs text-muted-foreground">
              Manage your video title, viewer visibility, and live stream preview.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 self-start sm:self-center text-xs text-muted-foreground">
            {video.duration > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5 text-muted-foreground/60" />
                {formatTime(video.duration)}
              </span>
            )}
            {video.size > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <HardDrive className="size-3.5 text-muted-foreground/60" />
                {formatBytes(video.size)}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Video Preview Section */}
      <section className="rounded-2xl shadow-sm bg-white overflow-hidden">
        <div className="flex items-center justify-between bg-[#f5f5f5] px-5 py-3.5">
          <div className="space-y-0.5">
            <h2 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
              <Tv className="size-4 text-foreground/60" />
              Player preview
            </h2>
            <p className="font-subheading text-xs text-muted-foreground">
              Interact with the player without leaving this workspace.
            </p>
          </div>

          <a
            href={`/embed/${video.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-4.5 md:gap-2 text-xs font-subheading font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            <Play className="size-3.5" />
            <span className="hidden md:inline-block">Open player</span>
            <ExternalLink className="md:size-4 size-3 text-muted-foreground" />
          </a>
        </div>

        <div className="p-4 sm:p-5 space-y-3">
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-transparent">
            <iframe
              src={`/embed/${video.id}`}
              title={`Preview of ${video.title}`}
              className="block h-full w-full border-0"
              style={{ border: 0, outline: "none", display: "block" }}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Quick Meta Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-subheading text-[11px] font-medium text-muted-foreground">
                Video ID
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={copyVideoId}
                      className="inline-flex items-center gap-1.5 rounded-md bg-[#f5f5f5] hover:bg-neutral-200/80 px-2 py-1  text-[11px] text-foreground transition-colors cursor-pointer"
                    >
                      <span className="truncate max-w-[140px] sm:max-w-[220px]">
                        {video.id}
                      </span>
                      {copiedId ? (
                        <Check className="size-3 text-emerald-600" />
                      ) : (
                        <Copy className="size-3 text-muted-foreground" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Click to copy Video ID</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {video.resolutions && video.resolutions.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="font-subheading text-[11px] font-medium text-muted-foreground">
                  Available:
                </span>
                <div className="flex items-center gap-1">
                  { video.resolutions.map((res,i) => (
                    <span
                      key={i}
                      className="rounded-md bg-[#f5f5f5] px-1.5 py-0.5  text-[10px] text-muted-foreground"
                    >
                      {res.resolution}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Video Details Section */}
      <section className="rounded-2xl shadow-sm bg-white overflow-hidden">
        <div className="bg-[#f5f5f5] px-5 py-3.5">
          <h2 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
            {/* <Sparkles className="size-4 text-foreground/60" /> */}
            Video details
          </h2>
          <p className="font-subheading text-xs text-muted-foreground mt-0.5">
            Configure video title and who can view or stream this video.
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* Title input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="video-title"
                className="font-subheading text-xs font-semibold text-foreground"
              >
                Title
              </Label>
              <span className="font-content text-[11px] text-muted-foreground">
                {title.length} / 255
              </span>
            </div>
            <Input
              id="video-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void saveDetails();
              }}
              placeholder="e.g. Masterclass Introduction & Overview"
              className="bg-[#f5f5f5]/60 focus-visible:bg-white border-0 shadow-none focus-visible:ring-2 focus-visible:ring-black/10 rounded-xl h-11 px-4 text-sm font-content transition-all"
              maxLength={255}
            />
            <p className="font-content text-xs text-muted-foreground">
              This title is displayed on your embed player, channels, and search results.
            </p>
          </div>

          {/* Visibility options */}
          <div className="space-y-2.5">
            <div>
              <Label className="font-subheading text-xs font-semibold text-foreground">
                Access & visibility
              </Label>
              <p className="font-content text-xs text-muted-foreground mt-0.5">
                Control who is allowed to access and stream this video content.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`flex items-start gap-3 rounded-xl p-4 text-left transition-all cursor-pointer ${
                  !isPrivate
                    ? "bg-[#f5f5f5] shadow-sm ring-1 ring-black/10"
                    : "bg-[#f5f5f5]/50 hover:bg-[#f5f5f5]"
                }`}
              >
                <Globe
                  className={`size-4 mt-0.5 shrink-0 ${
                    !isPrivate ? "text-foreground" : "text-muted-foreground/60"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-subheading text-sm font-medium text-foreground">
                      Public
                    </span>
                    {!isPrivate && <Check className="size-3.5 text-foreground" />}
                  </div>
                  <p className="font-content text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Anyone with the player embed or direct video link can view.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`flex items-start gap-3 rounded-xl p-4 text-left transition-all cursor-pointer ${
                  isPrivate
                    ? "bg-[#f5f5f5] shadow-sm ring-1 ring-black/10"
                    : "bg-[#f5f5f5]/50 hover:bg-[#f5f5f5]"
                }`}
              >
                <LockKeyhole
                  className={`size-4 mt-0.5 shrink-0 ${
                    isPrivate ? "text-foreground" : "text-muted-foreground/60"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-subheading text-sm font-medium text-foreground">
                      Private
                    </span>
                    {isPrivate && <Check className="size-3.5 text-foreground" />}
                  </div>
                  <p className="font-content text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Restricted access. Only authenticated workspace members can stream.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Action / CTA Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div>
              {hasChanges ? (
                <div className="flex items-center gap-2 text-amber-700 font-subheading text-xs">
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  <span>Unsaved changes</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground font-subheading text-xs">
                  <Check className="size-3.5 text-emerald-600" />
                  <span>All changes up to date</span>
                </div>
              )}
            </div>

            <Button
              onClick={saveDetails}
              disabled={updateVideo.isPending || !hasChanges}
              className="bg-main-btn h-10 rounded-xl px-5 text-xs font-semibold text-white flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateVideo.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span className="font-subheading">Saving changes...</span>
                </>
              ) : (
                <>
                  <Check className="size-3.5" />
                  <span className="font-subheading">Save changes</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </section>
    </aside>
  );
}

export default VideoUpdate;