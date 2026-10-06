"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { VideoPlayerSettings } from "@/modules/types";

interface PreviewProps {
  videoId?: string;
  playerSettings: VideoPlayerSettings;
}

export default function Preview({
  videoId = "6c82db12-723a-4678-a31f-9cb214a91d06",
  playerSettings,
}: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const postSettings = useCallback(() => {
    if (!iframeRef.current?.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "UPDATE_PLAYER_SETTINGS",
          settings: playerSettings,
        },
        "*",
      );
    } catch {
      // Ignore cross-origin errors if any
    }
  }, [playerSettings]);

  // Send real-time updates to iframe whenever playerSettings changes
  useEffect(() => {
    postSettings();
  }, [postSettings]);

  // Listen for handshake from iframe when it finishes mounting
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "PLAYER_EMBED_READY") {
        postSettings();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [postSettings]);

  // Sync settings when iframe DOM onLoad fires + retry intervals
  const handleIframeLoad = () => {
    postSettings();
    setTimeout(postSettings, 200);
    setTimeout(postSettings, 600);
  };

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-sm zshadow-[0_20px_50px_-15px_rgba(0,0,0,0.35)] border-0">
      <iframe

        ref={iframeRef}
        src={`/embed/${videoId}`}
        title="Video player preview"
        onLoad={handleIframeLoad}
        frameBorder="0"
        className="absolute inset-0 block h-full w-full border-0 border-none outline-none ring-0"
        style={{ border: 0, outline: "none" }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="eager"
      />
    </div>
  );
}