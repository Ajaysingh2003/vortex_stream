"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type RefObject,
} from "react";
import { PlayerCollector, watchDelta, type Properties } from "./collector";
export interface Tracking {
  track: (name: string, props?: Properties, once?: string) => void;
  playbackID: () => string | undefined;
}
const empty: Tracking = { track: () => {}, playbackID: () => undefined };
export const PlayerAnalyticsContext = createContext<Tracking>(empty);
export const useTracking = () => useContext(PlayerAnalyticsContext);
export function usePlayerAnalytics(
  videoRef: RefObject<HTMLVideoElement | null>,
  videoID: string,
  token?: string,
): Tracking {
  const collector = useRef<PlayerCollector | null>(null);
  const pending = useRef<
    Array<[string, Properties | undefined, string | undefined]>
  >([]);
  const track = useCallback(
    (name: string, props?: Properties, once?: string) => {
      if (collector.current)
        collector.current.event(name, videoRef.current, props, once);
      else if (pending.current.length < 50)
        pending.current.push([name, props, once]);
    },
    [videoRef],
  );
  const playbackID = useCallback(() => collector.current?.playbackID, []);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // Reuse the collector across StrictMode's setup/cleanup cycle.
    collector.current ??= new PlayerCollector(videoID, token);
    const c = collector.current;
    for (const [name, props, once] of pending.current.splice(0))
      c.event(name, video, props, once);
    let last = performance.now(),
      previousPosition = video.currentTime,
      playing = false,
      bufferAt = 0,
      startedAt = 0,
      everPlayed = c.onceKeys.has("start"),
      ended = false,
      beforeSeek = video.currentTime,
      watched = 0;
    const emit = (name: string, props: Properties = {}, once?: string) =>
      c.event(name, video, props, once);
    const sample = () => {
      const now = performance.now();
      watched += watchDelta(
        now - last,
        video.currentTime - previousPosition,
        playing && !video.seeking,
      );
      last = now;
      previousPosition = video.currentTime;
    };
    const heartbeat = (active?: boolean) => {
      sample();
      emit("playback_heartbeat", {
        watch_ms: Math.round(Math.min(15000, watched)),
        active:
          active ??
          (playing && !video.paused && document.visibilityState === "visible"),
      });
      watched = 0;
      void c.flush();
    };
    const bufferEnd = () => {
      if (bufferAt) {
        emit("buffer_ended", {
          buffer_ms: Math.round(
            Math.min(86400000, performance.now() - bufferAt),
          ),
        });
        bufferAt = 0;
      }
    };
    const handlers: Record<string, EventListener> = {
      play: () => {
        if (!startedAt) startedAt = performance.now();
      },
      playing: () => {
        sample();
        bufferEnd();
        playing = true;
        if (!everPlayed) {
          everPlayed = true;
          emit("play_started", {}, "start");
          emit(
            "first_frame_rendered",
            {
              startup_ms: Math.round(
                startedAt ? performance.now() - startedAt : 0,
              ),
            },
            "first-frame",
          );
        } else if (ended) {
          ended = false;
          emit("video_replayed");
        } else emit("play_resumed");
        heartbeat();
      },
      pause: () => {
        sample();
        playing = false;
        bufferEnd();
        emit("play_paused");
        heartbeat(false);
      },
      waiting: () => {
        sample();
        playing = false;
        if (everPlayed && !video.paused && !bufferAt) {
          bufferAt = performance.now();
          emit("buffer_started");
        }
        heartbeat(false);
      },
      seeking: () => {
        beforeSeek = previousPosition;
        sample();
        playing = false;
      },
      seeked: () => {
        emit(
          video.currentTime >= beforeSeek ? "seek_forward" : "seek_backward",
          { from_ms: Math.max(0, Math.round(beforeSeek * 1000)) },
        );
        previousPosition = video.currentTime;
        last = performance.now();
        playing = !video.paused && video.readyState >= 3;
      },
      ended: () => {
        sample();
        playing = false;
        ended = true;
        bufferEnd();
        emit("video_completed", {}, "complete");
        heartbeat(false);
      },
      error: () => {
        sample();
        playing = false;
        emit("video_error", { error_code: String(video.error?.code || 0) });
        heartbeat(false);
      },
      loadedmetadata: () => emit("video_load_completed", {}, "loaded"),
      loadstart: () => emit("video_load_started", {}, "loadstart"),
      ratechange: () => {
        sample();
        emit("playback_speed_changed", { rate: video.playbackRate });
      },
      volumechange: () => emit(video.muted ? "mute_enabled" : "mute_disabled"),
      enterpictureinpicture: () => emit("pip_entered"),
      leavepictureinpicture: () => emit("pip_exited"),
      resize: () =>
        emit("quality_changed", {
          width: video.videoWidth,
          height: video.videoHeight,
        }),
      timeupdate: () => {
        sample();
        if (video.duration > 0 && everPlayed)
          for (const percent of [25, 50, 75, 90])
            if ((video.currentTime / video.duration) * 100 >= percent)
              emit(`video_${percent}_percent`, {}, `milestone-${percent}`);
      },
    };
    Object.entries(handlers).forEach(([name, fn]) =>
      video.addEventListener(name, fn),
    );
    let intersects = false;
    const visible = () => {
      if (intersects && document.visibilityState === "visible")
        emit("player_loaded", {}, "impression");
    };
    const observer = new IntersectionObserver(
      (entries) => {
        intersects = entries.some(
          (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5,
        );
        visible();
      },
      { threshold: 0.5 },
    );
    observer.observe(video);
    const visibility = () => {
      if (document.visibilityState === "hidden") {
        heartbeat(false);
        void c.flush(true);
      } else {
        visible();
        last = performance.now();
        previousPosition = video.currentTime;
        heartbeat();
      }
    };
    const fullscreen = () => {
      if (
        document.fullscreenElement?.contains(video) ||
        !document.fullscreenElement
      )
        emit(
          document.fullscreenElement
            ? "fullscreen_entered"
            : "fullscreen_exited",
        );
    };
    const leave = () => {
      sample();
      playing = false;
      emit("video_abandoned", { active: false });
      heartbeat(false);
      void c.flush(true);
    };
    document.addEventListener("visibilitychange", visibility);
    document.addEventListener("fullscreenchange", fullscreen);
    window.addEventListener("pagehide", leave);
    const interval = setInterval(() => {
      heartbeat();
      if (everPlayed) emit("video_progress");
    }, 10000);
    const flushTimer = setInterval(() => void c.flush(), 3000);
    if (!video.paused && video.readyState >= 3)
      handlers.playing(new Event("playing"));
    return () => {
      sample();
      playing = false;
      if (everPlayed) heartbeat(false);
      observer.disconnect();
      Object.entries(handlers).forEach(([name, fn]) =>
        video.removeEventListener(name, fn),
      );
      document.removeEventListener("visibilitychange", visibility);
      document.removeEventListener("fullscreenchange", fullscreen);
      window.removeEventListener("pagehide", leave);
      clearInterval(interval);
      clearInterval(flushTimer);
      void c.flush(true);
    };
  }, [videoID, videoRef, token]);
  return { track, playbackID };
}
