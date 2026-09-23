"use client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { Lead } from "../types";
import { answerText, formatDate } from "../lib/format";
export function LeadDetails({
  lead,
  onClose,
}: {
  lead: Lead | null;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={!!lead}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        className="w-full! sm:max-w-lg! overflow-y-auto"
        style={{ fontFamily: "var(--font-subheading, Inter), sans-serif" }}
      >
        <SheetHeader>
          <SheetTitle>Response details</SheetTitle>
          <SheetDescription>
            Original answers, exactly as captured by this form version.
          </SheetDescription>
        </SheetHeader>
        {lead && (
          <div className="space-y-6 px-6 pb-8">
            <div className="rounded-xl border bg-stone-50 p-4 text-sm">
              <p className="font-medium">
                {lead.skipped ? "Form skipped" : "Completed response"}
              </p>
              <p className="mt-1 text-muted-foreground">
                {formatDate(lead.createdAt)} · Form v{lead.formVersion}
              </p>
              <p className="mt-1 capitalize text-muted-foreground">
                {lead.placement || "Unknown"} placement
              </p>
              <p className="mt-3 break-all font-mono text-xs text-muted-foreground">
                {lead.id}
              </p>
            </div>
            <dl className="space-y-5">
              {lead.answers.map((answer) => (
                <div key={answer.id} className="border-b pb-4">
                  <dt className="text-xs font-medium text-muted-foreground">
                    {answer.label}
                  </dt>
                  <dd className="mt-1.5 whitespace-pre-wrap break-words text-sm text-neutral-900">
                    {answerText(answer)}
                  </dd>
                </div>
              ))}
            </dl>
            {!lead.answers.length && (
              <p className="text-sm text-muted-foreground">
                No answers were submitted.
              </p>
            )}
            <div>
              <h3 className="text-sm font-semibold">CRM deliveries</h3>
              {lead.deliveries.length ? (
                lead.deliveries.map((job) => (
                  <div
                    key={job.id}
                    className="mt-3 rounded-lg border p-3 text-xs"
                  >
                    <span className="font-medium capitalize">{job.status}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {job.attempts} attempts
                    </span>
                    {job.lastError && (
                      <p className="mt-1 text-red-700">{job.lastError}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  No delivery has been scheduled for this response.
                </p>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
