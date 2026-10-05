/**
 * Formatting utilities for Rowley Analytics
 * Follows exact contracts defined in analytics_design.md
 */

export function formatNumber(n?: number | null): string {
  if (n === undefined || n === null || isNaN(n)) return "0";
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatCompactNumber(n?: number | null): string {
  if (n === undefined || n === null || isNaN(n)) return "0";
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(n);
}

/**
 * Format milliseconds into human readable duration without wrapping after 24 hours.
 * Examples: 186h 24m, 42m 10s, 15s, 0s
 */
export function formatDuration(ms?: number | null): string {
  if (ms === undefined || ms === null || isNaN(ms) || ms <= 0) return "0s";

  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Format rate to 1 decimal place (e.g. 42.6%).
 * If denominator is 0 or rate is undefined/null, returns "—"
 */
export function formatPercent(rate?: number | null, denominator?: number): string {
  if (denominator !== undefined && denominator <= 0) {
    return "—";
  }
  if (rate === undefined || rate === null || isNaN(rate)) {
    return "—";
  }
  return `${rate.toFixed(1)}%`;
}

export interface DeltaResult {
  text: string;
  isPositive: boolean;
  isNeutral: boolean;
  isNegative: boolean;
}

/**
 * Honest comparison calculator
 * - 0 to 0: "No change"
 * - 0 to >0: "New"
 * - rates: +X.X pp
 * - counts/durations: +X.X% or -X.X%
 */
export function formatDelta(
  current?: number | null,
  previous?: number | null,
  isRate = false,
  inverse = false, // true for error rate, startup ms, buffer ms where lower is better
): DeltaResult {
  const curr = current ?? 0;
  const prev = previous ?? 0;

  if (curr === 0 && prev === 0) {
    return { text: "No change", isPositive: false, isNeutral: true, isNegative: false };
  }
  if (prev === 0 && curr > 0) {
    return {
      text: "New",
      isPositive: !inverse,
      isNeutral: false,
      isNegative: inverse,
    };
  }

  if (isRate) {
    const ppDiff = curr - prev;
    if (Math.abs(ppDiff) < 0.05) {
      return { text: "No change", isPositive: false, isNeutral: true, isNegative: false };
    }
    const prefix = ppDiff > 0 ? "+" : "";
    const text = `${prefix}${ppDiff.toFixed(1)} pp`;
    const positive = inverse ? ppDiff < 0 : ppDiff > 0;
    return {
      text,
      isPositive: positive,
      isNeutral: false,
      isNegative: !positive,
    };
  }

  const pctDiff = ((curr - prev) / prev) * 100;
  if (Math.abs(pctDiff) < 0.1) {
    return { text: "No change", isPositive: false, isNeutral: true, isNegative: false };
  }

  const prefix = pctDiff > 0 ? "+" : "";
  const text = `${prefix}${pctDiff.toFixed(1)}%`;
  const positive = inverse ? pctDiff < 0 : pctDiff > 0;

  return {
    text,
    isPositive: positive,
    isNeutral: false,
    isNegative: !positive,
  };
}
