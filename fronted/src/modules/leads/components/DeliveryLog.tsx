"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { formatDate } from "../lib/format";
import type { Integration, LeadScope } from "../types";
function Attempts({
  scope,
  deliveryId,
}: {
  scope: LeadScope;
  deliveryId: string;
}) {
  const trpc = useTRPC();
  const query = useQuery({
    ...trpc.leads.attempts.queryOptions({ ...scope, deliveryId }),
    refetchInterval: 5000,
  });
  return (
    <div className="mt-3 border-t pt-3 text-xs">
      {query.isPending
        ? "Loading attempts…"
        : query.error
          ? query.error.message
          : !query.data?.length
            ? "Waiting for the first attempt."
            : query.data.map((attempt) => (
                <p key={attempt.id} className="py-1">
                  #{attempt.attempt} · {formatDate(attempt.createdAt)} ·{" "}
                  {attempt.httpStatus
                    ? `HTTP ${attempt.httpStatus}`
                    : "No HTTP response"}{" "}
                  · {attempt.durationMs} ms
                  {attempt.error && (
                    <span className="block text-red-700">{attempt.error}</span>
                  )}
                </p>
              ))}
    </div>
  );
}
export function DeliveryLog({
  scope,
  integrations,
}: {
  scope: LeadScope;
  integrations: Integration[];
}) {
  const trpc = useTRPC();
  const client = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const query = useQuery({
    ...trpc.leads.deliveries.queryOptions(scope),
    refetchInterval: 5000,
  });
  const retry = useMutation(
    trpc.leads.retry.mutationOptions({
      onSuccess: () => {
        void client.invalidateQueries(trpc.leads.deliveries.queryFilter(scope));
        void client.invalidateQueries(trpc.leads.list.pathFilter());
        toast.success("Delivery queued for retry.");
      },
      onError: (error) => toast.error(error.message),
    }),
  );
  return (
    <section className="rounded-2xl border bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Delivery activity</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Latest 100 deliveries · updates every 5 seconds. Temporary failures
        retry automatically, up to 8 attempts.
      </p>
      {query.isPending && (
        <p role="status" className="mt-5 text-sm">
          Loading deliveries…
        </p>
      )}
      {query.error && (
        <p role="alert" className="mt-5 text-sm text-red-700">
          {query.error.message}
        </p>
      )}
      {query.data?.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Delivery history will appear after a connection test or lead
          submission.
        </p>
      )}
      <div className="mt-4 divide-y">
        {query.data?.map((job) => (
          <div key={job.id} className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {integrations.find((item) => item.id === job.integrationId)
                    ?.name || "Connection"}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {job.isTest
                      ? "Connection test"
                      : `Lead ${job.submissionId?.slice(0, 8)}`}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(job.createdAt)} · {job.attempts} attempts
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs capitalize ${job.status === "delivered" ? "bg-emerald-50 text-emerald-800" : job.status === "failed" ? "bg-red-50 text-red-700" : "bg-stone-100 text-stone-700"}`}
                >
                  {job.status}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setExpanded(expanded === job.id ? null : job.id)
                  }
                  aria-expanded={expanded === job.id}
                >
                  Details
                </Button>
                {job.status === "failed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      retry.isPending ||
                      !integrations.find(
                        (item) => item.id === job.integrationId,
                      )?.enabled
                    }
                    onClick={() =>
                      retry.mutate({ ...scope, deliveryId: job.id })
                    }
                  >
                    Retry
                  </Button>
                )}
              </div>
            </div>
            {job.lastError && (
              <p className="mt-2 text-xs text-red-700">{job.lastError}</p>
            )}
            {job.status === "retrying" && (
              <p className="mt-1 text-xs text-muted-foreground">
                Next attempt: {formatDate(job.nextAttemptAt)}
              </p>
            )}
            {expanded === job.id && (
              <>
                <p className="mt-3 break-all font-mono text-[10px] text-muted-foreground">
                  Delivery ID: {job.id}
                </p>
                <Attempts scope={scope} deliveryId={job.id} />
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
