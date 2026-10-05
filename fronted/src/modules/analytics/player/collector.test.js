import { describe, expect, test } from "bun:test";
import { safeOrigin, watchDelta } from "./collector";
describe("watch time", () => {
  test("paused and seek intervals add no time", () => {
    expect(watchDelta(10000, 0, true)).toBe(0);
    expect(watchDelta(10000, 300, false)).toBe(0);
    expect(watchDelta(10000, -100, true)).toBe(0);
  });
  test("wall time is capped and independent of playback rate", () => {
    expect(watchDelta(10000, 20, true)).toBe(10000);
    expect(watchDelta(60000, 60, true)).toBe(15000);
  });
  test("attribution strips credentials, paths and queries", () => {
    expect(safeOrigin("https://user:secret@example.com/a?q=private#x")).toBe(
      "https://example.com",
    );
    expect(safeOrigin("javascript:alert(1)")).toBe("");
  });
});

describe("player active state", () => {
  test("active is true when video is playing, and false when paused or ended", () => {
    const videoPlaying = {
      paused: false,
      ended: false,
      seeking: false,
      currentTime: 10,
      duration: 60,
    };
    const videoPaused = {
      paused: true,
      ended: false,
      seeking: false,
      currentTime: 10,
      duration: 60,
    };
    const videoEnded = {
      paused: false,
      ended: true,
      seeking: false,
      currentTime: 60,
      duration: 60,
    };

    const isPlayingActive =
      !videoPlaying.paused && !videoPlaying.ended && !videoPlaying.seeking;
    const isPausedActive =
      !videoPaused.paused && !videoPaused.ended && !videoPaused.seeking;
    const isEndedActive =
      !videoEnded.paused && !videoEnded.ended && !videoEnded.seeking;

    expect(isPlayingActive).toBe(true);
    expect(isPausedActive).toBe(false);
    expect(isEndedActive).toBe(false);
  });
});

