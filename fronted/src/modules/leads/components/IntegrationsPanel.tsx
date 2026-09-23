"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Cable, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import type { Integration, LeadField, LeadScope } from "../types";
import { IntegrationEditor } from "./IntegrationEditor";
import { DeliveryLog } from "./DeliveryLog";
export function IntegrationsPanel({
  scope,
  fields,
}: {
  scope: LeadScope;
  fields: LeadField[];
}) {
  const trpc = useTRPC();
  const client = useQueryClient();
  const connections = useQuery(trpc.leads.integrations.queryOptions(scope));
  const [editing, setEditing] = useState<Integration | "new" | null>(null);
  const refresh = () => {
    void client.invalidateQueries(trpc.leads.integrations.queryFilter(scope));
    void client.invalidateQueries(trpc.leads.deliveries.queryFilter(scope));
  };
  const test = useMutation(
    trpc.leads.testIntegration.mutationOptions({
      onSuccess: () => {
        toast.success("Connection check queued. Watch the delivery log below.");
        refresh();
      },
      onError: (error) => toast.error(error.message),
    }),
  );
  const toggle = useMutation(
    trpc.leads.saveIntegration.mutationOptions({
      onSuccess: () => {
        refresh();
        toast.success("Connection updated.");
      },
      onError: (error) => {
        toast.error(error.message);
        refresh();
      },
    }),
  );
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">CRM connections</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Turn completed responses into contacts. Connect HubSpot directly
              or send signed events to your CRM.
            </p>
          </div>
          <Button
            className="bg-primary text-neutral-950"
            disabled={
              !connections.data?.encryptionReady ||
              (connections.data?.items.length ?? 0) >= 5
            }
            onClick={() => setEditing("new")}
          >
            <Plus className="size-4" />
            Add connection
          </Button>
        </div>
        {connections.isPending && (
          <p className="mt-6 text-sm" role="status">
            Loading connections…
          </p>
        )}
        {connections.error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {connections.error.message}{" "}
            <button
              className="underline"
              onClick={() => void connections.refetch()}
            >
              Try again
            </button>
          </p>
        )}
        {connections.data && !connections.data.encryptionReady && (
          <div
            role="status"
            className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          >
            CRM setup needs a server encryption key. Ask your administrator to
            configure LEAD_INTEGRATION_KEY using the deployment guide. Lead
            collection and exports remain available.
          </div>
        )}
        {connections.data?.items.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed p-8 text-center">
            <Cable className="mx-auto size-7 text-stone-400" />
            <p className="mt-3 text-sm font-medium">Your leads, connected</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a connection to automatically deliver future completed
              responses.
            </p>
          </div>
        )}
        <div className="mt-5 space-y-3">
          {connections.data?.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{item.name}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] ${item.enabled ? "bg-emerald-50 text-emerald-800" : "bg-stone-100 text-stone-600"}`}
                  >
                    {item.enabled ? "Active" : "Paused"}
                  </span>
                </div>
                <p className="mt-1 break-all text-xs text-muted-foreground">
                  {item.kind === "hubspot"
                    ? "HubSpot · Contacts"
                    : item.endpoint}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!item.enabled || test.isPending}
                  onClick={() =>
                    test.mutate({ ...scope, integrationId: item.id })
                  }
                >
                  Test connection
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(item)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={toggle.isPending}
                  onClick={() =>
                    toggle.mutate({
                      ...scope,
                      id: item.id,
                      name: item.name,
                      kind: item.kind,
                      endpoint: item.endpoint,
                      mapping: item.mapping,
                      secret: "",
                      version: item.version,
                      enabled: !item.enabled,
                    })
                  }
                >
                  {item.enabled ? "Pause" : "Resume"}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Tests use a synthetic webhook event or a read-only HubSpot permission
          check. HubSpot write access is verified when delivering a lead. Paused
          connections do not receive new leads.
        </p>
      </section>
      <DeliveryLog scope={scope} integrations={connections.data?.items || []} />
      {editing && (
        <IntegrationEditor
          scope={scope}
          fields={fields}
          integration={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
