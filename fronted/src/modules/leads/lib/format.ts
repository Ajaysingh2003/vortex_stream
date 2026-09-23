import type { LeadAnswer, Lead } from "../types";
export function answerText(answer?: LeadAnswer): string {
  if (!answer) return "—";
  if (answer.type === "checkbox") {
    try {
      const values: unknown = JSON.parse(answer.value);
      if (Array.isArray(values))
        return values.filter((value) => typeof value === "string").join(", ");
    } catch {
      /* Legacy answers remain visible even if they were not JSON. */
    }
  }
  return answer.value || "—";
}
export function leadLabel(lead: Lead): string {
  if (lead.skipped) return "Skipped form";
  const email = lead.answers.find((answer) => /e-?mail/i.test(answer.label));
  const name = lead.answers.find((answer) => /name/i.test(answer.label));
  return email?.value || name?.value || `Response ${lead.id.slice(0, 8)}`;
}
export function formatDate(date: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}
export function dateBoundary(
  value: string,
  nextDay = false,
): string | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  if (nextDay) date.setDate(date.getDate() + 1);
  return Number.isNaN(date.valueOf()) ? undefined : date.toISOString();
}
