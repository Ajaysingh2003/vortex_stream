"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import { ArrowUpRight, Check, Copy, ListVideo, RotateCcw, Subtitles, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import type { VideoAsset, VideoEndScreenType } from "@/modules/types";
import { safeLink, subtitleVtt, timeInSeconds, type VideoExperience } from "../lib/experience";
import { joinCdnUrl } from "./temp";
import { useTracking } from "@/modules/analytics/player/usePlayerAnalytics";
import { ViewerLeadForm } from "./ViewerLeadForm";

const positions: Record<string, string> = {
  top_left: "top-4 left-4", top_right: "top-4 right-4",
  bottom_left: "bottom-28 left-4 sm:bottom-32", bottom_right: "bottom-28 right-4 sm:bottom-32",
  center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
};
const primaryButton = "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function usePlayerExperience(videoRef: RefObject<HTMLVideoElement | null>, experience: VideoExperience) {
  const form = experience.form?.fields?.length ? experience.form : null;
  const [formOpen, setFormOpen] = useState(form?.placement === "before_video");
  const [ended, setEnded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const resolved = useRef(false);
  const gate = useRef(form?.placement === "before_video");
  const resumeAt = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const sync = () => {
      setCurrentTime(video.currentTime);
      const due = form && !resolved.current && (form.placement === "before_video" || (form.placement === "during_video" && video.currentTime >= (form.showAt ?? 0)));
      if (due || gate.current) {
        if (!gate.current) resumeAt.current = video.currentTime;
        gate.current = true;
        video.pause();
        setFormOpen(true);
      }
    };
    const finish = () => {
      setEnded(true);
      if (form && !resolved.current && (form.placement === "after_video" || form.placement === "during_video")) {
        gate.current = true;
        setFormOpen(true);
      }
    };
    video.addEventListener("play", sync);
    video.addEventListener("timeupdate", sync);
    video.addEventListener("seeking", sync);
    video.addEventListener("ended", finish);
    return () => {
      video.removeEventListener("play", sync);
      video.removeEventListener("timeupdate", sync);
      video.removeEventListener("seeking", sync);
      video.removeEventListener("ended", finish);
    };
  }, [form, videoRef]);

  const complete = () => {
    resolved.current = true;
    gate.current = false;
    setFormOpen(false);
    const video = videoRef.current;
    if (video && !ended) {
      if (form?.placement === "during_video") video.currentTime = resumeAt.current;
      void video.play().catch(() => { /* The play control remains available if autoplay is denied. */ });
    }
  };
  const replay = () => {
    setEnded(false);
    const video = videoRef.current;
    if (video) { video.currentTime = 0; void video.play().catch(() => {}); }
  };
  return { formOpen, ended, currentTime, complete, replay, blocked: formOpen || ended };
}

export function ExperienceOverlay({ experience, state, videoId, cdnBaseUrl }: {
  experience: VideoExperience; state: ReturnType<typeof usePlayerExperience>; videoId: string; cdnBaseUrl: string;
}) {
  const analytics = useTracking();
  useEffect(() => {
    if (state.ended && !state.formOpen) analytics.track("end_screen_displayed", {}, "end-screen");
    if (!state.blocked) for (const cta of experience.ctas) {
      if (safeLink(cta.url) && state.currentTime >= timeInSeconds(cta.start_time) && state.currentTime < timeInSeconds(cta.end_time)) analytics.track("cta_displayed", {cta_id:cta.id}, `cta-${cta.id}`);
    }
  }, [analytics, experience.ctas, state.ended, state.formOpen, state.blocked, state.currentTime]);
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!state.blocked || !dialog.current) return;
    const container = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    container.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const elements = Array.from(container.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex="0"]'));
      const first = elements[0]; const last = elements[elements.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === container)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === container)) { event.preventDefault(); first.focus(); }
    };
    container.addEventListener("keydown", trap);
    return () => { container.removeEventListener("keydown", trap); previous?.focus(); };
  }, [state.blocked, state.formOpen]);

  if (state.blocked) return <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label={state.formOpen ? "Share your details" : "Video finished"} className="pointer-events-auto absolute inset-0 z-[500] overflow-y-auto overscroll-contain bg-black/75 outline-none backdrop-blur-md" onKeyDown={event => event.stopPropagation()}>
    {state.formOpen && experience.form ? <ViewerLeadForm form={experience.form} videoId={videoId} onComplete={state.complete} /> : <ViewerEndScreen endScreen={experience.endScreen} onReplay={state.replay} cdnBaseUrl={cdnBaseUrl} />}
  </div>;
  return <div className="pointer-events-none absolute inset-0 z-40">
    {experience.ctas.filter(cta => state.currentTime >= timeInSeconds(cta.start_time) && state.currentTime < timeInSeconds(cta.end_time)).map(cta => {
      const href = safeLink(cta.url);
      return href ? <a key={cta.id} onClick={() => analytics.track("cta_clicked", {cta_id:cta.id})} href={href} target={cta.open_in === "_self" || cta.open_in === "same_tab" ? "_self" : "_blank"} rel="noopener noreferrer" className={`pointer-events-auto absolute max-w-[calc(100%-2rem)] break-words shadow-lg ${primaryButton} ${positions[cta.position] || positions.top_right}`} style={{ backgroundColor: /^#[\da-f]{6}$/i.test(cta.background_color) ? cta.background_color : undefined, color: /^#[\da-f]{6}$/i.test(cta.font_color) ? cta.font_color : undefined }}>
        <span>{cta.title}</span><ArrowUpRight className="size-4 shrink-0" />
      </a> : null;
    })}
  </div>;
}

function Recommendation({ id, cdnBaseUrl }: { id: string; cdnBaseUrl: string }) {
  const trpc = useTRPC();
  const query = useQuery(trpc.video.getVideo.queryOptions({ videoId: id }, { retry: false }));
  const video = query.data as VideoAsset | undefined;
  if (query.isError) return null;
  return <a href={`/embed/${encodeURIComponent(id)}`} className="overflow-hidden rounded-xl border border-white/15 bg-white/5 text-left transition hover:border-primary/60 hover:bg-white/10">
    <div className="relative aspect-video bg-white/5">{video?.thumbnail && <Image src={joinCdnUrl(cdnBaseUrl, video.thumbnail)} alt="" fill unoptimized sizes="240px" className="object-cover" />}</div>
    <p className="truncate px-3 py-2.5 text-xs font-medium text-white">{video?.title || "Loading video…"}</p>
  </a>;
}

function ViewerEndScreen({ endScreen, onReplay, cdnBaseUrl }: { endScreen: VideoEndScreenType | null; onReplay: () => void; cdnBaseUrl: string }) {
  const analytics = useTracking();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const payload = (endScreen?.payload || {}) as Record<string, unknown>;
  const text = (key: string) => typeof payload[key] === "string" ? payload[key] as string : "";
  const ctaHref = safeLink(payload.cta_btn_url);
  const recommendations = Array.isArray(payload.video_ids) ? payload.video_ids.filter((id): id is string => typeof id === "string" && /^[\da-f-]{36}$/i.test(id)).slice(0, 6) : [];
  const moreVideos = endScreen?.type === "more_video" || endScreen?.type === "more_videos";
  const image = text("url") ? joinCdnUrl(cdnBaseUrl, text("url")) : "";
  return <div onClick={event => { const target = (event.target as HTMLElement).closest("a,button"); if (target) analytics.track("end_screen_clicked", {action: target.tagName === "A" ? "link" : "button"}); }} className="flex min-h-full flex-col items-center justify-center gap-5 p-5 text-center text-white sm:p-8">
    <div className="w-full max-w-2xl space-y-4">
      {endScreen?.type === "cta_action" ? <><h2 className="text-xl font-semibold tracking-tight sm:text-3xl">{text("cta_title")}</h2><p className="mx-auto max-w-lg text-sm leading-relaxed text-white/70">{text("cta_sub_title")}</p>{ctaHref && <a href={ctaHref} target="_blank" rel="noopener noreferrer" className={primaryButton}>{text("cta_btn_title") || "Learn more"}<ArrowUpRight className="size-4" /></a>}</> :
      endScreen?.type === "custom_message" ? <><h2 className="text-xl font-semibold tracking-tight sm:text-3xl">{text("custom_title")}</h2><p className="whitespace-pre-wrap text-sm leading-relaxed text-white/70">{text("custom_description")}</p></> :
      endScreen?.type === "custom_image" && image ? <div className="relative mx-auto h-[55vh] max-h-80 w-full"><Image src={image} alt="Video end screen" fill unoptimized className="object-contain" /></div> :
      moreVideos && recommendations.length ? <><h2 className="text-lg font-semibold">Keep watching</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{recommendations.map(id => <Recommendation key={id} id={id} cdnBaseUrl={cdnBaseUrl} />)}</div></> :
      endScreen?.type === "share_button" ? <><h2 className="text-xl font-semibold sm:text-3xl">Keep the conversation going</h2><div className="flex flex-wrap justify-center gap-2">{[["LinkedIn", "Linkedin_url"], ["Facebook", "facebook_url"], ["Instagram", "instagram_url"], ["X", "x_url"], ["Email", "mail_url"]].map(([label, key]) => {
        const href = safeLink(payload[key] || (key === "Linkedin_url" ? payload.linkedin_url : undefined), key === "mail_url");
        return href ? <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10">{label}</a> : null;
      })}</div><button className={primaryButton} onClick={async () => { try { analytics.track("share_clicked", {action:"copy_link"}); await navigator.clipboard.writeText(window.location.href); setCopied(true); setCopyError(false); } catch { setCopyError(true); } }}>{copied ? <Check className="size-4" /> : <Copy className="size-4" />}{copied ? "Link copied" : "Copy video link"}</button>{copyError && <p role="alert" className="text-xs text-white/70">Copy the video URL from your browser to share it.</p>}</> : <h2 className="text-xl font-semibold">Thanks for watching</h2>}
    </div>
    <button onClick={onReplay} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs text-white/80 hover:bg-white/10 hover:text-white"><RotateCcw className="size-3.5" />Watch again</button>
  </div>;
}

export function PlayerNavigation({ experience, videoRef, currentTime, disableSeek, cdnBaseUrl, defaultCaptions }: {
  experience: VideoExperience; videoRef: RefObject<HTMLVideoElement | null>; currentTime: number; disableSeek: boolean; cdnBaseUrl: string; defaultCaptions: boolean;
}) {
  const analytics = useTracking();
  const [menu, setMenu] = useState<"chapters" | "subtitles" | null>(null);
  const [language, setLanguage] = useState("");
  const [captionError, setCaptionError] = useState("");
  const [loading, setLoading] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const chapters = experience.chapters.map(chapter => ({ ...chapter, seconds: timeInSeconds(chapter.time) })).filter(chapter => Number.isFinite(chapter.seconds)).sort((a, b) => a.seconds - b.seconds);
  const active = chapters.filter(chapter => chapter.seconds <= currentTime).at(-1)?.id;
  const selectedLanguage = language || (defaultCaptions ? experience.subtitles[0]?.code : "off") || "off";
  const subtitle = experience.subtitles.find(track => track.code === selectedLanguage);

  useEffect(() => {
    if (!menu) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setMenu(null); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [menu]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const abort = new AbortController();
    let track: HTMLTrackElement | undefined;
    let objectUrl: string | undefined;
    async function load() {
      setCaptionError("");
      if (!subtitle || !video) { setLoading(false); return; }
      setLoading(true);
      try {
        const response = await fetch(joinCdnUrl(cdnBaseUrl, subtitle.subtitle_url), { signal: abort.signal });
        if (!response.ok) throw new Error("Unable to load these subtitles.");
        const vtt = subtitleVtt(await response.text());
        if (abort.signal.aborted) return;
        objectUrl = URL.createObjectURL(new Blob([vtt], { type: "text/vtt" }));
        track = document.createElement("track");
        track.kind = "subtitles"; track.label = subtitle.label; track.srclang = subtitle.code; track.src = objectUrl; track.default = true;
        track.addEventListener("load", () => {
          if (!track || abort.signal.aborted) return;
          for (const cue of Array.from(track.track.cues || [])) {
            if (cue instanceof VTTCue && cue.line === "auto") cue.line = -4;
          }
          track.track.mode = "showing";
          setLoading(false);
        });
        track.addEventListener("error", () => { if (!abort.signal.aborted) { setCaptionError("Unable to display these subtitles. Choose another language."); setLoading(false); } });
        video.appendChild(track);
        track.track.mode = "showing";
      } catch (error) {
        if (!abort.signal.aborted) { setCaptionError(error instanceof Error ? error.message : "Unable to load subtitles."); setLoading(false); }
      }
    }
    void load();
    return () => { abort.abort(); if (track) { track.track.mode = "disabled"; track.remove(); } if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [subtitle, videoRef, cdnBaseUrl]);

  if (!chapters.length && !experience.subtitles.length) return null;
  return <div ref={root} className="absolute inset-x-3 bottom-[4.5rem] z-[350] flex justify-end gap-2 sm:inset-x-4 sm:bottom-20" onKeyDown={event => { event.stopPropagation(); if (event.key === "Escape") { setMenu(null); root.current?.querySelector<HTMLButtonElement>(`button[data-trigger="${menu}"]`)?.focus(); } }}>
    {menu && <section aria-label={menu === "chapters" ? "Video chapters" : "Subtitle languages"} className="absolute bottom-11 right-0 w-72 max-w-full overflow-hidden rounded-xl border border-white/15 bg-neutral-950/95 text-white shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5"><h2 className="text-xs font-semibold">{menu === "chapters" ? "Chapters" : "Subtitles"}</h2><button aria-label="Close menu" onClick={() => setMenu(null)} className="rounded p-1 hover:bg-white/10"><X className="size-4" /></button></div>
      <div className="max-h-[min(16rem,max(3rem,calc(100cqh-10rem)))] overflow-y-auto p-1.5">
        {menu === "chapters" ? chapters.map((chapter, index) => <button key={chapter.id} disabled={disableSeek} aria-current={active === chapter.id ? "true" : undefined} onClick={() => { analytics.track("chapter_clicked", {chapter_id:chapter.id}); const video = videoRef.current; if (video) video.currentTime = Math.min(chapter.seconds, Number.isFinite(video.duration) ? video.duration : chapter.seconds); setMenu(null); }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition disabled:cursor-not-allowed disabled:opacity-50 ${active === chapter.id ? "bg-primary/15 text-primary" : "text-white/80 hover:bg-white/10"}`}><span className="text-[10px] tabular-nums text-white/40">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1 break-words">{chapter.label}</span><span className="shrink-0 tabular-nums text-white/50">{chapter.time}</span></button>) : [{ code: "off", label: "Off" }, ...experience.subtitles].map(track => <button key={track.code} aria-pressed={selectedLanguage === track.code} onClick={() => { setLanguage(track.code); analytics.track(track.code === "off" ? "captions_disabled" : "captions_enabled", {language:track.code}); }} className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs hover:bg-white/10"><span>{track.label}</span>{selectedLanguage === track.code && <Check className="size-4 text-primary" />}</button>)}
      </div>
      {menu === "subtitles" && (loading || captionError) && <p role={captionError ? "alert" : "status"} className="border-t border-white/10 px-4 py-2 text-xs text-white/70">{captionError || "Loading subtitles…"}</p>}
      {menu === "chapters" && disableSeek && <p className="px-4 pb-3 text-xs text-white/50">Seeking is disabled for this video.</p>}
    </section>}
    {chapters.length > 0 && <button data-trigger="chapters" aria-expanded={menu === "chapters"} onClick={() => setMenu(menu === "chapters" ? null : "chapters")} className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/65 px-2.5 py-2 text-[11px] font-medium text-white backdrop-blur-md hover:bg-black/85"><ListVideo className="size-3.5" /><span>Chapters</span></button>}
    {experience.subtitles.length > 0 && <button data-trigger="subtitles" aria-expanded={menu === "subtitles"} onClick={() => setMenu(menu === "subtitles" ? null : "subtitles")} className={`flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/65 px-2.5 py-2 text-[11px] font-medium backdrop-blur-md hover:bg-black/85 ${selectedLanguage !== "off" ? "text-primary" : "text-white"}`}><Subtitles className="size-3.5" /><span>Subtitles</span></button>}
  </div>;
}
