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
