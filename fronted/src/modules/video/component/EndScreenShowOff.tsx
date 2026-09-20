"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useVideoContext } from "../context/VideoContext";
import { VideoAsset } from "@/modules/types";
import { formatDuration } from "@/lib/utils";
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  NewTwitterIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import {
  ArrowRight,
  Check,
  Copy,
  Film,
} from "lucide-react";
import toast from "react-hot-toast";

const getThumbnailUrl = (thumb?: string | null) => {
  if (!thumb) return "/video-player.png";
  if (thumb.startsWith("http://") || thumb.startsWith("https://")) return thumb;
  const cdn =
    process.env.NEXT_PUBLIC_CDN_URL ||
    "https://pub-576a14c59513475e922c49a33696cd1f.r2.dev/";
  return `${cdn}${thumb.startsWith("/") ? thumb.slice(1) : thumb}`;
};

function EndScreenShowOff() {
  const { selectMoreVideo, endScreen } = useVideoContext()!;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center font-sans font-[family-name:var(--font-sans)]">
      {selectMoreVideo.length > 0 && <MoreVideo items={selectMoreVideo} />}
      {endScreen === "cta_action" && <CtaSection />}
      {endScreen === "custom_image" && <CustomImage />}
      {endScreen === "share_button" && <ShareContent />}
      {endScreen === "custom_message" && <CustomMessagePreview />}
      {endScreen === "empty" && <EmptyEndScreen />}
    </div>
  );
}

export default EndScreenShowOff;

/**
 * ── Call to Action (CTA) End Screen ──
 */
function CtaSection() {
  const { ctaBtnText, ctaBtnUrl, ctaSubTitle, ctaTitle } = useVideoContext()!;

  const handleCtaClick = () => {
    if (ctaBtnUrl?.trim()) {
      toast.success(
        `Simulated click: opening ${ctaBtnUrl.startsWith("http") ? ctaBtnUrl : `https://${ctaBtnUrl}`}`,
      );
      window.open(
        ctaBtnUrl.startsWith("http") ? ctaBtnUrl : `https://${ctaBtnUrl}`,
        "_blank",
        "noopener,noreferrer",
      );
    } else {
      toast("No CTA URL configured yet. Add a destination link in the form.");
    }
  };

  const hasTitle = Boolean(ctaTitle && ctaTitle.trim());
  const hasSubtitle = Boolean(ctaSubTitle && ctaSubTitle.trim());
  const hasBtnText = Boolean(ctaBtnText && ctaBtnText.trim());

  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-3.5 max-w-lg px-6 z-10">
      {/* Title: pure white font-bold drop-shadow-md */}
      <h3 className="text-white font-bold text-2xl sm:text-3xl tracking-tight drop-shadow-md leading-tight">
        {hasTitle ? (
          ctaTitle
        ) : (
          <span className="text-white/50 italic font-normal">
            Your Catchy Headline
          </span>
        )}
      </h3>

      {/* Subtitle: text-neutral-200 drop-shadow-sm */}
      <p className="text-neutral-200 text-sm font-normal max-w-md text-center drop-shadow-sm leading-relaxed">
        {hasSubtitle ? (
          ctaSubTitle
        ) : (
          <span className="text-white/40 italic">
            Add a brief takeaway or offer description
          </span>
        )}
      </p>

      {/* CTA Button */}
      <button
        type="button"
        onClick={handleCtaClick}
        className="mt-2 bg-white text-black hover:bg-neutral-100 font-medium text-xs px-5 py-2.5 rounded-full shadow-lg transition-all inline-flex items-center justify-center gap-2 cursor-pointer active:scale-95 group/btn"
      >
        {hasBtnText ? (
          <span>{ctaBtnText}</span>
        ) : (
          <span className="text-black/40">Call to Action</span>
        )}
        <ArrowRight className="size-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5 shrink-0" />
      </button>
    </div>
  );
}

/**
 * ── Custom Message End Screen ──
 * No sparkle badge, high contrast text, strictly centered.
 */
function CustomMessagePreview() {
  const { customDescription, customTitle } = useVideoContext()!;

  const hasTitle = Boolean(customTitle && customTitle.trim());
  const hasDesc = Boolean(customDescription && customDescription.trim());

  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-3.5 max-w-lg px-6 z-10">
      {/* Headline: text-white font-bold drop-shadow-md */}
      <h3 className="text-white font-bold text-2xl sm:text-3xl tracking-tight drop-shadow-md leading-tight">
        {hasTitle ? (
          customTitle
        ) : (
          <span className="text-white/50 italic font-normal">
            Your Custom Headline
          </span>
        )}
      </h3>

      {/* Description: text-neutral-200 drop-shadow-sm */}
      <p className="text-neutral-200 text-sm font-normal max-w-md text-center drop-shadow-sm leading-relaxed">
        {hasDesc ? (
          customDescription
        ) : (
          <span className="text-white/40 italic">
            Add a brief takeaway, announcement, or custom message for your viewers.
          </span>
        )}
      </p>
    </div>
  );
}

/**
 * ── Social Share End Screen ──
 */
function ShareContent() {
  const { instagramUrl, facebookUrl, mail, xUrl, linkedinUrl } =
    useVideoContext()!;
  const [copied, setCopied] = useState(false);

  const fallbackShareUrl =
    typeof window !== "undefined" ? window.location.href : "https://video.host";

  const handleCopy = () => {
    navigator.clipboard.writeText(fallbackShareUrl);
    setCopied(true);
    toast.success("Video URL copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-4 max-w-md px-6 z-10">
      <div className="space-y-1">
        <h3 className="text-white font-bold text-2xl sm:text-3xl tracking-tight drop-shadow-md">
          Share this video
        </h3>
        <p className="text-neutral-200 text-sm font-normal drop-shadow-sm">
          Help others discover and watch this content
        </p>
      </div>

      {/* Social Share Buttons */}
      <div className="flex items-center justify-center gap-2.5 flex-wrap">
        <SocialLogo icon={Instagram} url={instagramUrl} label="Instagram" />
        <SocialLogo icon={Facebook} url={facebookUrl} label="Facebook" />
        <SocialLogo icon={Linkedin} url={linkedinUrl} label="LinkedIn" />
        <SocialLogo icon={NewTwitterIcon} url={xUrl} label="X (Twitter)" />
        <SocialLogo icon={Mail} url={mail} label="Email" />
      </div>

      {/* Copy Link Input Bar */}
      <div className="relative w-full max-w-xs mt-1">
        <input
          readOnly
          value={fallbackShareUrl}
          className="w-full rounded-full text-xs font-mono text-white/90 bg-white/10 border border-white/15 px-4 py-2 pr-10 focus:outline-none backdrop-blur-xs"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 size-7 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Copy share link"
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-400" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

function SocialLogo({
  icon,
  url,
  label,
}: {
  icon: IconSvgElement;
  url?: string;
  label: string;
}) {
  const handleClick = (e: React.MouseEvent) => {
    if (!url?.trim()) {
      e.preventDefault();
      toast(`No ${label} link configured in the left panel yet.`);
    }
  };

  return (
    <a
      href={url || "#"}
      target={url ? "_blank" : undefined}
      rel="noreferrer"
      onClick={handleClick}
      className="p-2.5 sm:p-3 bg-white/10 hover:bg-white/20 border border-white/15 rounded-full transition-all duration-200 hover:scale-110 shadow-md cursor-pointer text-white flex items-center justify-center"
      title={`Share on ${label}`}
    >
      <HugeiconsIcon size={20} icon={icon} className="text-white/90" />
    </a>
  );
}

/**
 * ── Recommended Videos End Screen ──
 */
function MoreVideo({ items }: { items: VideoAsset[] }) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-3 z-10 px-4">
      <h4 className="text-white text-xs sm:text-sm font-semibold tracking-wider uppercase text-center text-white/90">
        Recommended Videos
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="group/card relative rounded-xl overflow-hidden ring-1 ring-white/15 bg-black/60 shadow-xl transition-all duration-200 hover:scale-[1.03]"
          >
            <div className="relative aspect-video w-full bg-neutral-900 overflow-hidden">
              <Image
                src={getThumbnailUrl(item.thumbnail)}
                alt={item.title || "Video thumbnail"}
                fill
                unoptimized
                className="object-cover transition-transform duration-300 group-hover/card:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
              <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                {item.duration ? formatDuration(item.duration) : "-"}
              </div>
            </div>
            <div className="p-2">
              <p className="text-white text-xs font-medium truncate">
                {item.title || "Untitled Video"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * ── Custom Image End Screen ──
 */
function CustomImage() {
  const { customImagePreview } = useVideoContext()!;

  if (!customImagePreview) {
    return (
      <div className="flex flex-col items-center justify-center text-center max-w-sm px-4 space-y-2 z-10">
        <Film className="size-8 text-white/40" />
        <p className="text-white font-semibold text-sm">
          No Custom Image Selected
        </p>
        <p className="text-white/40 text-xs">
          Upload an image in the left panel to preview it as your end screen.
        </p>
      </div>
    );
  }

  const imageUrl = customImagePreview.startsWith("http")
    ? customImagePreview
    : `${process.env.NEXT_PUBLIC_CDN_URL || "https://pub-576a14c59513475e922c49a33696cd1f.r2.dev/"}${customImagePreview}`;

  return (
    <div className="relative max-w-md max-h-[380px] rounded-2xl overflow-hidden shadow-2xl mx-auto z-10">
      <Image
        unoptimized
        src={imageUrl}
        className="w-full h-auto object-contain max-h-[360px] rounded-xl"
        height={300}
        width={500}
        alt="End screen graphic"
      />
    </div>
  );
}

/**
 * ── Empty / None End Screen ──
 */
function EmptyEndScreen() {
  return (
    <div className="flex flex-col items-center justify-center text-center max-w-xs px-4 space-y-1.5 z-10">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
        No End Screen Active
      </p>
      <p className="text-white/40 text-xs leading-relaxed">
        Playback cleanly stops on the final frame without an interactive
        overlay.
      </p>
    </div>
  );
}
