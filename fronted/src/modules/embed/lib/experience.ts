import type { LeadForm, VideoChapter, VideoCta, VideoEndScreenType, VideoSubtitle } from "@/modules/types";

export interface VideoExperience {
  form: LeadForm | null;
  chapters: VideoChapter[];
  ctas: VideoCta[];
  subtitles: VideoSubtitle[];
  endScreen: VideoEndScreenType | null;
}

export function timeInSeconds(value: string | number): number {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : Infinity;
  const parts = value.trim().split(":");
  if (!value.trim() || parts.length > 3 || parts.some(part => !/^\d+(\.\d+)?$/.test(part))) return Infinity;
  return parts.reduce((total, part) => total * 60 + Number(part), 0);
}

export function safeLink(value: unknown, allowMail = false): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const text = value.trim();
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(text) ? text : `https://${text}`);
    if (["https:", "http:", ...(allowMail ? ["mailto:"] : [])].includes(url.protocol)) return url.href;
  } catch { /* Invalid saved links must never become executable URLs. */ }
  return undefined;
}

export function subtitleVtt(text: string): string {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();
  if (normalized.startsWith("WEBVTT")) return normalized;
  if (!/\d{2}:\d{2}:\d{2}[,.]\d{3}\s+-->/.test(normalized)) throw new Error("Unsupported subtitle format. Upload a VTT or SRT file.");
  return `WEBVTT\n\n${normalized.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2")}\n`;
}
