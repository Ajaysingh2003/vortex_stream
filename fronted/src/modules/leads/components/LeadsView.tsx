"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  Download,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import type { WorkspaceType } from "@/modules/types";
import type { Lead, LeadScope, LeadStatus } from "../types";
import { dateBoundary } from "../lib/format";
import { LeadsTable } from "./LeadsTable";
import { LeadDetails } from "./LeadDetails";
import { IntegrationsPanel } from "./IntegrationsPanel";
import { inputClass } from "./IntegrationEditor";
export default function LeadsView({ videoId }: { videoId: string }) {
  const trpc = useTRPC();
  const workspace = useQuery(trpc.user.getWorkspace.queryOptions());
  if (workspace.isPending)
    return (
      <p role="status" className="p-8 text-sm text-muted-foreground">
        Loading your workspace…
      </p>
    );
  if (workspace.error || !(workspace.data as unknown as WorkspaceType)?.id)
    return (
      <p role="alert" className="p-8 text-sm text-red-700">
        Unable to load your workspace. Please reload the page.
      </p>
    );
  return (
    <ScopedLeads
      scope={{
        videoId,
        workspaceId: (workspace.data as unknown as WorkspaceType).id,
      }}
    />
  );
}
function ScopedLeads({ scope }: { scope: LeadScope }) {
  const trpc = useTRPC();
  const client = useQueryClient();
  const [tab, setTab] = useState<"responses" | "connections">("responses");
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState<LeadStatus>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [asOf, setAsOf] = useState<string>();
  const [selected, setSelected] = useState<string[]>([]);
  const [active, setActive] = useState<Lead | null>(null);
  const [archived, setArchived] = useState(true);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setTerm(search);
      setPage(1);
      setAsOf(undefined);
      setSelected([]);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);
  const filters = {
    page,
    limit: 25,
    search: term,
    status,
    from: dateBoundary(from),
    to: dateBoundary(to, true),
    asOf,
  };
  const query = useQuery({
    ...trpc.leads.list.queryOptions({ ...scope, ...filters }),
    refetchInterval: page === 1 && !asOf ? 15000 : false,
    placeholderData: keepPreviousData,
  });
  const connections = useQuery(trpc.leads.integrations.queryOptions(scope));
  const send = useMutation(
    trpc.leads.send.mutationOptions({
      onSuccess: () => {
        setSelected([]);
        void client.invalidateQueries(trpc.leads.list.pathFilter());
        void client.invalidateQueries(trpc.leads.deliveries.queryFilter(scope));
        toast.success(
          "Selected leads queued. Previously scheduled deliveries were not duplicated.",
        );
      },
      onError: (error) => toast.error(error.message),
    }),
  );
  const resetPage = () => {
    setPage(1);
    setAsOf(undefined);
    setSelected([]);
  };
  const exportParams = new URLSearchParams({
    ...scope,
    search: term,
    status,
    ...(filters.from ? { from: filters.from } : {}),
    ...(filters.to ? { to: filters.to } : {}),
    ...(query.data?.asOf ? { asOf: query.data.asOf } : {}),
  });
  const totalPages = Math.max(1, Math.ceil((query.data?.total || 0) / 25));
  return (
    <div
      className="mx-auto w-full min-w-0 max-w-[1440px] space-y-6 pb-10"
      style={{
        fontFamily:
          "var(--font-subheading, Inter), ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <Link
        href={`/console/content-library/video/${scope.videoId}`}
        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-neutral-950"
      >
        <ArrowLeft className="size-3.5" />
        Back to video
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="size-4" />
            <span className="max-w-lg truncate">
              {query.data?.videoTitle || "Video responses"}
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
            Leads
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Every response in one place. Ready for your next conversation.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={!query.data?.total}
            onClick={() =>
              window.open(
                `/api/leads/export?${exportParams}`,
                "_blank",
                "noopener,noreferrer",
              )
            }
          >
            <Download className="size-4" />
            Export CSV
          </Button>
          <Button
            className="bg-primary text-neutral-950"
            onClick={() => setTab("connections")}
          >
            CRM connections
            <ArrowUpRight className="size-4" />
          </Button>
        </div>
      </header>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Completed leads",
            value: query.data?.summary.completed,
            hint: "Ready to follow up",
          },
          {
            label: "Skipped forms",
            value: query.data?.summary.skipped,
            hint: "No contact details collected",
          },
          {
            label: "Pending deliveries",
            value: query.data?.summary.pending,
            hint: "Queued or retrying",
          },
          {
            label: "Failed deliveries",
            value: query.data?.summary.failed,
            hint: "Review in CRM connections",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border bg-white p-4 sm:p-5"
          >
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-3 text-2xl font-semibold tabular-nums">
              {stat.value ?? "—"}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {stat.hint}
            </p>
          </div>
        ))}
      </div>
      <div
        className="flex gap-6 border-b"
        role="tablist"
        aria-label="Leads views"
      >
        {(
          [
            ["responses", "Responses"],
            ["connections", "Connections & activity"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            id={`leads-tab-${value}`}
            aria-controls={`leads-panel-${value}`}
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`border-b-2 px-1 pb-3 text-sm font-medium ${tab === value ? "border-neutral-950 text-neutral-950" : "border-transparent text-muted-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "connections" ? (
        <div
          role="tabpanel"
          id="leads-panel-connections"
          aria-labelledby="leads-tab-connections"
        >
          <IntegrationsPanel scope={scope} fields={query.data?.fields || []} />
        </div>
      ) : (
        <section
          role="tabpanel"
          id="leads-panel-responses"
          aria-labelledby="leads-tab-responses"
          className="min-w-0 space-y-4"
        >
          <div className="flex flex-wrap items-end gap-3">
            <label className="relative min-w-48 flex-1">
              <span className="mb-1.5 block text-xs text-muted-foreground">
                Search responses
              </span>
              <Search className="absolute bottom-3 left-3 size-4 text-stone-400" />
              <input
                className={`${inputClass} pl-9`}
                placeholder="Search any answer…"
                maxLength={200}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label className="space-y-1.5 text-xs text-muted-foreground">
              <span className="block">Status</span>
              <select
                className={inputClass}
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as LeadStatus);
                  resetPage();
                }}
              >
                <option value="all">All responses</option>
                <option value="completed">Completed</option>
                <option value="skipped">Skipped</option>
              </select>
            </label>
            <label className="space-y-1.5 text-xs text-muted-foreground">
              <span className="block">From</span>
              <input
                className={inputClass}
                type="date"
                value={from}
                max={to || undefined}
                onChange={(event) => {
                  setFrom(event.target.value);
                  resetPage();
                }}
              />
            </label>
            <label className="space-y-1.5 text-xs text-muted-foreground">
              <span className="block">To</span>
              <input
                className={inputClass}
                type="date"
                value={to}
                min={from || undefined}
                onChange={(event) => {
                  setTo(event.target.value);
                  resetPage();
                }}
              />
            </label>
            <Button
              variant="outline"
              aria-label="Refresh responses"
              disabled={query.isFetching}
              onClick={() => {
                resetPage();
                void query.refetch();
              }}
            >
              <RefreshCw
                className={`size-4 ${query.isFetching ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <label className="flex items-center gap-2">
              <input
                className="size-3.5 accent-neutral-900"
                type="checkbox"
                checked={archived}
                onChange={(event) => setArchived(event.target.checked)}
              />
              Show archived fields
            </label>
            <span>Original answers stay intact when your form changes.</span>
          </div>
          {selected.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-stone-50 p-3">
              <p className="text-sm">
                {selected.length} completed{" "}
                {selected.length === 1 ? "response" : "responses"} selected
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelected([])}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  className="bg-primary text-neutral-950"
                  disabled={
                    send.isPending ||
                    !connections.data?.items.some((item) => item.enabled)
                  }
                  onClick={() => send.mutate({ ...scope, ids: selected })}
                >
                  {send.isPending ? "Queuing…" : "Send to active connections"}
                </Button>
              </div>
              <p className="w-full text-xs text-muted-foreground">
                Sends only deliveries that have not already been scheduled.
                Retry failed deliveries in Connections & activity.
              </p>
            </div>
          )}
          {query.isPending ? (
            <div
              role="status"
              className="rounded-xl border p-16 text-center text-sm text-muted-foreground"
            >
              Loading responses…
            </div>
          ) : query.error ? (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
            >
              {query.error.message}
              <button
                onClick={() => void query.refetch()}
                className="ml-3 underline"
              >
                Try again
              </button>
            </div>
          ) : (
            query.data && (
              <>
                <LeadsTable
                  items={query.data.items}
                  fields={query.data.fields.filter(
                    (field) => archived || !field.archived,
                  )}
                  selected={selected}
                  onSelect={setSelected}
                  onOpen={setActive}
                />
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                  <p>
                    {query.data.total.toLocaleString()} responses
                    {page === 1 && !asOf
                      ? " · Refreshes every 15 seconds"
                      : " · Snapshot preserved while paging"}
                  </p>
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page <= 1 || query.isFetching}
                      onClick={() => {
                        setAsOf(query.data.asOf);
                        setPage(page - 1);
                        setSelected([]);
                      }}
                    >
                      Previous
                    </Button>
                    <span>
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= totalPages || query.isFetching}
                      onClick={() => {
                        setAsOf(query.data.asOf);
                        setPage(page + 1);
                        setSelected([]);
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
                {!query.data.total && (
                  <p className="text-center text-sm text-muted-foreground">
                    {term || from || to || status !== "all"
                      ? "Try adjusting your filters."
                      : "Publish a lead form on this video to start collecting responses from the watch page and embeds."}
                  </p>
                )}
              </>
            )
          )}
        </section>
      )}
      <LeadDetails
        lead={
          active &&
          (query.data?.items.find((item) => item.id === active.id) || active)
        }
        onClose={() => setActive(null)}
      />
    </div>
  );
}
