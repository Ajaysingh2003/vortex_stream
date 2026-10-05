/**
 * Date range helpers for Rowley Analytics
 * Strict UTC calendar boundary calculations per analytics_design.md
 */

export interface DateRangeState {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

export type RangePreset = "today" | "yesterday" | "7d" | "30d" | "custom";
export type IntervalChoice = "hour" | "day" | "week";

function toUTCDateString(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayUTC(): string {
  return toUTCDateString(new Date());
}

export function getPresetRange(preset: RangePreset): DateRangeState {
  const now = new Date();
  const todayStr = toUTCDateString(now);

  switch (preset) {
    case "today":
      return { from: todayStr, to: todayStr };
    case "yesterday": {
      const y = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
      const yStr = toUTCDateString(y);
      return { from: yStr, to: yStr };
    }
    case "7d": {
      const past = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6));
      return { from: toUTCDateString(past), to: todayStr };
    }
    case "30d": {
      const past = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29));
      return { from: toUTCDateString(past), to: todayStr };
    }
    case "custom":
    default:
      return getPresetRange("7d");
  }
}

export function validateRange(from: string, to: string): { valid: boolean; error?: string } {
  if (!from || !to) {
    return { valid: false, error: "Please enter both From and To dates." };
  }

  const fromDate = new Date(`${from}T00:00:00Z`);
  const toDate = new Date(`${to}T00:00:00Z`);

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return { valid: false, error: "Invalid date format. Expected YYYY-MM-DD." };
  }

  if (fromDate > toDate) {
    return { valid: false, error: "'From' date must be on or before 'To' date." };
  }

  const today = new Date(`${getTodayUTC()}T00:00:00Z`);
  if (toDate > today) {
    return { valid: false, error: "Historical dates cannot be in the future (UTC)." };
  }

  const diffDays = Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (diffDays > 366) {
    return { valid: false, error: "Date range cannot exceed 366 days." };
  }

  return { valid: true };
}

export function getDaysCount(from: string, to: string): number {
  const fromDate = new Date(`${from}T00:00:00Z`);
  const toDate = new Date(`${to}T00:00:00Z`);
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return 0;
  return Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

export function isHourlyAllowed(from: string, to: string): boolean {
  return getDaysCount(from, to) <= 31;
}
