export type Properties = Record<string, string | number | boolean>;
export interface PlayerEvent {
  playback_token?: string;
  event_id: string;
  event_name: string;
  event_version: number;
  occurred_at: string;
  anonymous_id: string;
  session_id: string;
  playback_session_id: string;
  video_id: string;
  page_url: string;
  referrer: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  device_type: string;
  browser: string;
  os: string;
  position_ms: number;
  duration_ms: number;
  properties: Properties;
}
const uuid = () => crypto.randomUUID();
function storedID(storage: Storage, key: string) {
  const old = storage.getItem(key);
  if (old && /^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(old)) return old;
  const value = uuid();
  storage.setItem(key, value);
  return value;
}
export function safeOrigin(raw: string) {
  try {
    const url = new URL(raw);
    return /^https?:$/.test(url.protocol) ? url.origin : "";
  } catch {
    return "";
  }
}
export function watchDelta(
  elapsed: number,
  positionDelta: number,
  playing: boolean,
) {
  return playing && positionDelta > 0
    ? Math.max(0, Math.min(15000, elapsed))
    : 0;
}
export class PlayerCollector {
  readonly playbackID = uuid();
  private anonymousID = uuid();
  private sessionID = uuid();
  private queue: PlayerEvent[] = [];
  private busy = false;
  private retryAt = 0;
  private failures = 0;
  private readonly context;
  readonly onceKeys = new Set<string>();
  constructor(private videoID: string, private token?: string) {
    try {
      this.anonymousID = storedID(localStorage, "rowley.analytics.browser.v1");
      this.sessionID = storedID(sessionStorage, "rowley.analytics.visit.v1");
    } catch {
      /* Memory identity when storage is blocked. */
    }
    const url = new URL(location.href);
    const ua = navigator.userAgent;
    this.context = {
      page_url: safeOrigin(location.href),
      referrer: safeOrigin(document.referrer),
      utm_source: (url.searchParams.get("utm_source") || "").slice(0, 200),
      utm_medium: (url.searchParams.get("utm_medium") || "").slice(0, 200),
      utm_campaign: (url.searchParams.get("utm_campaign") || "").slice(0, 200),
      device_type: /iPad|Tablet/i.test(ua)
        ? "tablet"
        : /Mobi|Android/i.test(ua)
          ? "mobile"
          : "desktop",
      browser: /Edg\//.test(ua)
        ? "Edge"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Chrome\//.test(ua)
            ? "Chrome"
            : /Safari\//.test(ua)
              ? "Safari"
              : "Other",
      os: /iPhone|iPad/.test(ua)
        ? "iOS"
        : /Android/.test(ua)
          ? "Android"
          : /Windows/.test(ua)
            ? "Windows"
            : /Mac/.test(ua)
              ? "macOS"
              : /Linux/.test(ua)
                ? "Linux"
                : "Other",
    };
  }
  event(
    name: string,
    video: HTMLVideoElement | null,
    properties: Properties = {},
    once?: string,
  ) {
    if (once && this.onceKeys.has(once)) return;
    if (once) this.onceKeys.add(once);
    const active =
      !!video &&
      !video.paused &&
      !video.ended &&
      !video.seeking &&
      video.readyState >= 3 &&
      document.visibilityState === "visible";
    const event: PlayerEvent = {
      ...this.context,
      event_id: uuid(),
      playback_token: this.token,
      event_version: 1,
      event_name: name,
      occurred_at: new Date().toISOString(),
      anonymous_id: this.anonymousID,
      session_id: this.sessionID,
      playback_session_id: this.playbackID,
      video_id: this.videoID,
      position_ms: Math.max(0, Math.round((video?.currentTime || 0) * 1000)),
      duration_ms: Number.isFinite(video?.duration)
        ? Math.max(0, Math.round(video!.duration * 1000))
        : 0,
      properties: {
        surface: window.top === window ? "video_page" : "embed",
        active,
        ...properties,
      },
    };
    this.queue.push(event);
    if (this.queue.length > 100) this.queue.shift();
    if (this.queue.length >= 20) void this.flush();
  }
  async flush(unload = false) {
    if (
      this.busy ||
      !this.queue.length ||
      (!unload && Date.now() < this.retryAt)
    )
      return;
    const events = this.queue.splice(0, 20);
    const body = JSON.stringify({ events });
    const endpoint =
      process.env.NEXT_PUBLIC_ANALYTICS_API_URL || "/api/analytics/events";
    if (
      unload &&
      navigator.sendBeacon?.(
        endpoint,
        new Blob([body], { type: "application/json" }),
      )
    )
      return;
    this.busy = true;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        keepalive: true,
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok && (response.status === 429 || response.status >= 500))
        throw new Error("retry");
      this.failures = 0;
    } catch {
      this.failures++;
      this.retryAt = Date.now() + Math.min(60000, 1000 * 2 ** this.failures);
      this.queue = [...events, ...this.queue].slice(-100);
    } finally {
      this.busy = false;
    }
  }
}
