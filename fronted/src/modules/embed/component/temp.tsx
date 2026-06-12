import {
  brandingType,
  ctaType,
  PlayerSource,
  securityType,
  VideoAsset,
} from "@/modules/types";
import { cx } from "class-variance-authority";
import { X } from "lucide-react";
import { useEffect } from "react";

import Hls from "hls.js";
export function joinCdnUrl(baseUrl: string, key: string) {
  if (!key) return "";
  if (/^https?:\/\//i.test(key)) return key;
  return `${baseUrl.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
}

export function parseSourceType(src: string): PlayerSource["type"] {
  return src.includes(".m3u8") ? "application/x-mpegURL" : "video/mp4";
}

export function buildSources(
  asset: VideoAsset,
  cdnBaseUrl: string,
): PlayerSource[] {
  const masterSrc = joinCdnUrl(cdnBaseUrl, asset.masterKey || asset.videoKey);
  const sources: PlayerSource[] = masterSrc
    ? [
        {
          label: asset.masterKey?.includes(".m3u8") ? "Auto" : "Original",
          src: masterSrc,
          type: parseSourceType(masterSrc),
        },
      ]
    : [];
      
  for (const item of asset.resolutions || []) {
    if (typeof item === "string") {
      const src = joinCdnUrl(cdnBaseUrl, item);
      sources.push({
        label: item.match(/(\d{3,4}p)/)?.[1] || "MP4",
        src,
        type: parseSourceType(src),
      });
      continue;
    }

    if (item?.url || item?.key) {
      const src = joinCdnUrl(cdnBaseUrl, item.url || item.key);
      sources.push({
        label: item.label || item.quality || item.resolution || "MP4",
        src,
        type: parseSourceType(src),
      });
    }
  }

  const source = Array.from(
    new Map(
      sources
        .filter((source) => source.src)
        .map((source) => [source.src, source]),
    ).values(),
  );

  console.log(source, "789456123");
  return source;
}

export function useHlsSource(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  source?: PlayerSource,
) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !source?.src) return;

    if (source.type !== "application/x-mpegURL") {
      video.src = source.src;
      return;
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source.src;
      return;
    }

    if (!Hls.isSupported()) return;

    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90,
    });

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      console.log(hls.levels);
    });

    hls.loadSource(source.src);
    hls.attachMedia(video);
    
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
  console.log(hls.levels,"");
});
    return () => hls.destroy();
  }, [source, videoRef]);
}

export function OverlayButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  const chromeButtonClass =
    "grid h-9 w-9 shrink-0 place-items-center rounded-md text-[color:var(--vp-icon)] transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--vp-accent)]";

  return (
    <button
      className={chromeButtonClass}
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function LogoOverlay({ branding }: { branding: brandingType }) {
  if (!branding.logoUrl) return null;

  const positionClass: Record<string, string> = {
    "top-left": "left-4 top-4",
    "top-right": "right-4 top-4",
    "bottom-left": "bottom-[74px] left-4",
    "bottom-right": "bottom-[74px] right-4",
  };

  return (
    <img
      className={cx(
        "pointer-events-none absolute z-20 h-auto max-w-[22%] drop-shadow-[0_5px_12px_rgba(0,0,0,0.35)]",
        positionClass[branding.logoPosition] || positionClass["top-right"],
      )}
      src={branding.logoUrl}
      alt=""
      style={{ width: Math.max(32, branding.logoWidth || 80) }}
    />
  );
}

export function Watermark({
  security,
  viewerEmail,
  viewerIp,
}: {
  security: securityType;
  viewerEmail?: string;
  viewerIp?: string;
}) {
  if (!security.watermarkEnabled) return null;

  const text =
    security.watermarkTextType === "viewer_email"
      ? viewerEmail
      : security.watermarkTextType === "viewer_ip"
        ? viewerIp
        : "";

  if (security.watermarkImage) {
    return (
      <img
        className="pointer-events-none absolute left-[10%] top-[18%] z-20 h-auto w-[min(160px,22%)] select-none opacity-40"
        src={security.watermarkImage}
        alt=""
      />
    );
  }

  if (!text) return null;

  return (
    <span className="pointer-events-none absolute left-[10%] top-[18%] z-20 select-none rounded border border-white/15 bg-black/25 px-2 py-1 font-mono text-xs leading-none text-white/65 opacity-45">
      {text}
    </span>
  );
}

export function CtaOverlay({
  cta,
  accentColor,
  onClose,
}: {
  cta: ctaType;
  accentColor: string;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-40 grid place-items-center bg-black/75 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={cta.heading}
    >
      <button
        className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        type="button"
        aria-label="Close CTA"
        onClick={onClose}
      >
        <X size={18} />
      </button>

      <div className="w-full max-w-[420px] rounded-lg border border-white/15 bg-[#0a0c10]/95 p-7 text-center shadow-2xl shadow-black/40">
        <p className="mb-5 text-balance text-xl font-bold leading-tight text-white sm:text-2xl">
          {cta.heading}
        </p>
        <a
          className="inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-bold text-[#061015] no-underline transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          href={cta.redirectUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ backgroundColor: accentColor }}
        >
          {cta.buttonText || "Learn more"}
        </a>
      </div>
    </div>
  );
}
