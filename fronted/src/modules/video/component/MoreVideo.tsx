import { useTRPC } from "@/trpc/client";
import React, { useCallback, useEffect, useRef } from "react";
import { useVideoContext } from "../context/VideoContext";
import { VideoAsset, VideoListType } from "@/modules/types";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useLibraryFilters } from "@/lib/useLibraryFilters";
import { Loader2, Film } from "lucide-react";
import ChooseMoreVideo from "./ChooseMoreVideo";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { StarsIcon, Video01FreeIcons } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";

function MoreVideo() {
  const { workspaceData } = useVideoContext()!;
  const trpc = useTRPC();
  const [filters] = useLibraryFilters();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(
      trpc.video.getVideoList.infiniteQueryOptions(
        {
          limit: filters.limit,
          workspaceId: workspaceData.id,
        },
        {
          getNextPageParam: (lastPage: VideoListType) =>
            lastPage.metadata.hasNextPage
              ? lastPage.metadata.nextCursor
              : undefined,
          initialCursor: "",
        },
      ),
    );

  // De-dupe defensively — belt and suspenders on top of the real fix below.
  const items: VideoAsset[] = Array.from(
    new Map(
      data.pages.flatMap((page) => page.items).map((item) => [item.id, item]),
    ).values(),
  );

  // Always-fresh snapshot, read inside the observer callback instead of
  // being captured in its closure.
  const latestRef = useRef({ hasNextPage, isFetchingNextPage, fetchNextPage });
  useEffect(() => {
    latestRef.current = { hasNextPage, isFetchingNextPage, fetchNextPage };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    if (!node) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const { hasNextPage, isFetchingNextPage, fetchNextPage } =
          latestRef.current;
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );
    observerRef.current.observe(node);
  }, []); // only the node mounting/unmounting recreates this now — not fetch state

  return (
    <div className="w-full">
      <div className="mt-4">
        <div className="flex-1 overflow-y-auto px-2 py-2 custom-scrollbar space-y-4">
          {items.length == 0 ? (
            <UploadVideo />
          ) : (
            <ChooseMoreVideo items={items} />
          )}

          <div
            ref={sentinelRef}
            className="w-full py-3  flex items-center justify-center border-t border-gray-50 mt-4"
          >
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                <Loader2 className="size-3.5 animate-spin text-blue-600" />
                Loading assets...
              </div>
            )}

            {!hasNextPage && items.length > 0 && (
              <span className="text-[11px] font-medium tracking-wide text-gray-400 bg-gray-50/50 border border-gray-100 px-3 py-1 rounded-full select-none">
                All videos loaded
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MoreVideo;

function UploadVideo() {
  const router = useRouter();
  return (
    <div className="flex items-center flex-col">
      <div className="flex justify-end flex-col items-center justify-center gap-2 w-full max-w-sm">
        <h3 className="font-heading max-w-48 text-center  capitalize text-accent text-lg md:text-lg font-bold leading-snug tracking-tight ">
          Upload Your first Video
        </h3>

        <p className="text-xs md:text-sm text-neutral-500 text-center max-w-xs leading-relaxed mb-1">
          You don't have any videos in this workspace yet. Upload your first
          video asset to get started.
        </p>

        <Button
          onClick={() => router.push(`/console/content-library`)}
          className="tracking-wider rounded-xl bg-main-btn capitalize px-2 font-bold cursor-pointer border py-2 md:py-1 text-[13px] transition-all duration-200 flex items-center justify-center gap-2 rounded- h-[29px]"
        >
          <HugeiconsIcon
            width={700}
            className="font-bold "
            icon={Video01FreeIcons}
            size={14}
          />
          Upload Video
        </Button>
      </div>
    </div>
  );
}
