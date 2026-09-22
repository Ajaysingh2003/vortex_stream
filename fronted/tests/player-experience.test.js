import { describe, expect, test } from "bun:test";
import { safeLink, subtitleVtt, timeInSeconds } from "../src/modules/embed/lib/experience";

describe("saved video interactions", () => {
  test("compares chapter and CTA timestamps numerically", () => {
    expect(timeInSeconds("01:02:03")).toBe(3723);
    expect(timeInSeconds("02:30")).toBe(150);
    expect(timeInSeconds("7.5")).toBe(7.5);
    expect(timeInSeconds(0)).toBe(0);
    for (const value of ["", "bad", "1:-2", "-1", "1:2:3:4"]) expect(timeInSeconds(value)).toBe(Infinity);
  });
  test("only publishes safe CTA and share URLs", () => {
    expect(safeLink("example.com/offer")).toBe("https://example.com/offer");
    expect(safeLink("javascript:alert(1)")).toBeUndefined();
    expect(safeLink("data:text/html,test")).toBeUndefined();
    expect(safeLink("mailto:hello@example.com")).toBeUndefined();
    expect(safeLink("mailto:hello@example.com", true)).toBe("mailto:hello@example.com");
  });
  test("loads VTT and converts SRT timestamps for native text tracks", () => {
    expect(subtitleVtt("\uFEFFWEBVTT\r\n\r\n00:00:01.000 --> 00:00:02.000\r\nHello")).toStartWith("WEBVTT\n\n");
    expect(subtitleVtt("1\r\n00:00:01,000 --> 00:00:02,500\r\nHello")).toContain("00:00:01.000 --> 00:00:02.500");
    expect(() => subtitleVtt("unsupported file contents")).toThrow();
  });
});
