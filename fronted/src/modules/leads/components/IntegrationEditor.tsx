"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Integration, LeadField, LeadScope } from "../types";
export const inputClass =
  "h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:opacity-50";
export function IntegrationEditor({
  scope,
  integration,
  fields,
  onClose,
  onSaved,
}: {
  scope: LeadScope;
  integration?: Integration;
  fields: LeadField[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const trpc = useTRPC();
  const [kind, setKind] = useState<"hubspot" | "webhook">(
    integration?.kind || "hubspot",
  );
  const [name, setName] = useState(integration?.name || "");
  const [endpoint, setEndpoint] = useState(integration?.endpoint || "");
  const [secret, setSecret] = useState("");
  const [mapping, setMapping] = useState<Record<string, string>>(
    integration?.mapping || {},
  );
  const [enabled, setEnabled] = useState(integration?.enabled ?? true);
  const save = useMutation(
    trpc.leads.saveIntegration.mutationOptions({
      onSuccess: () => {
        toast.success(
          "Connection saved. New leads will follow these settings.",
        );
        onSaved();
        onClose();
      },
      onError: (error) => toast.error(error.message),
    }),
  );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !save.isPending) onClose();
      }}
    >
      <DialogContent
        className="max-h-[90dvh] overflow-y-auto rounded-2xl! sm:max-w-xl!"
        style={{ fontFamily: "var(--font-subheading, Inter), sans-serif" }}
      >
        <DialogHeader>
          <DialogTitle>
            {integration ? "Edit connection" : "Connect your CRM"}
          </DialogTitle>
          <DialogDescription>
            Send new completed responses automatically. Existing leads are only
            sent when you select them.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate({
              ...scope,
              id: integration?.id,
              name,
              kind,
              endpoint:
                kind === "hubspot" ? "https://api.hubapi.com" : endpoint,
              secret,
              mapping:
                kind === "hubspot"
                  ? Object.fromEntries(
                      Object.entries(mapping)
                        .filter(([, value]) => value.trim())
                        .map(([key, value]) => [key, value.trim()]),
                    )
                  : {},
              enabled,
              version: integration?.version || 0,
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span>Provider</span>
              <select
                className={inputClass}
                disabled={!!integration}
                value={kind}
                onChange={(event) => setKind(event.target.value as typeof kind)}
              >
                <option value="hubspot">HubSpot</option>
                <option value="webhook">Signed webhook</option>
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span>Connection name</span>
              <input
                className={inputClass}
                required
                maxLength={100}
                value={name}
                placeholder="Sales pipeline"
                onChange={(event) => setName(event.target.value)}
              />
            </label>
          </div>
          {kind === "webhook" && (
            <label className="block space-y-2 text-sm">
              <span>Endpoint URL</span>
              <input
                className={inputClass}
                type="url"
                required
                value={endpoint}
                placeholder="https://your-crm.com/webhooks/leads"
                onChange={(event) => setEndpoint(event.target.value)}
              />
              <span className="block text-xs text-muted-foreground">
                Public HTTPS endpoints on port 443. Redirects and private
                networks are blocked.
              </span>
            </label>
          )}
          <label className="block space-y-2 text-sm">
            <span>
              {kind === "hubspot"
                ? "Private app access token"
                : "Webhook signing secret"}
            </span>
            <input
              className={inputClass}
              type="password"
              autoComplete="new-password"
              required={!integration?.secretConfigured}
              minLength={16}
              maxLength={4096}
              value={secret}
              placeholder={
                integration?.secretConfigured
                  ? "Leave blank to keep the saved credential"
                  : "Enter a secure credential"
              }
              onChange={(event) => setSecret(event.target.value)}
            />
            <span className="block text-xs text-muted-foreground">
              Encrypted on the server. Saved credentials are never displayed.
            </span>
          </label>
          {kind === "hubspot" ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-stone-50 p-3 text-xs leading-relaxed text-muted-foreground">
                Your HubSpot private app needs{" "}
                <strong>crm.objects.contacts.read</strong> and{" "}
                <strong>crm.objects.contacts.write</strong>. Map an email field
                to <strong>email</strong> to create or update contacts. Existing
                contacts keep their unmapped properties.
              </div>
              <h3 className="text-sm font-semibold">Field mapping</h3>
              <p className="text-xs text-muted-foreground">
                Use HubSpot internal property names. Leave a field empty to
                exclude it. New fields are never mapped automatically.
              </p>
              <datalist id="hubspot-properties">
                {[
                  "email",
                  "firstname",
                  "lastname",
                  "phone",
                  "company",
                  "website",
                  "jobtitle",
                  "city",
                ].map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
              {fields.map((field) => (
                <label
                  key={field.id}
                  className="grid grid-cols-2 items-center gap-3 text-sm"
                >
                  <span className="min-w-0 break-words">
                    {field.label}
                    <span className="block text-[10px] text-muted-foreground">
                      {field.archived ? "Archived · " : ""}
                      {field.id.slice(0, 8)}
                    </span>
                  </span>
                  <input
                    className={inputClass}
                    list="hubspot-properties"
                    aria-label={`HubSpot property for ${field.label} ${field.id.slice(0, 8)}`}
                    placeholder="Do not sync"
                    value={mapping[field.id] || ""}
                    onChange={(event) =>
                      setMapping({ ...mapping, [field.id]: event.target.value })
                    }
                  />
                </label>
              ))}
              {!fields.length && (
                <p className="text-sm text-amber-800">
                  Add a lead form with an email field before connecting HubSpot.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                For choice fields, option values must match HubSpot’s internal
                option values; otherwise map to a text property.
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-stone-50 p-3 text-xs leading-relaxed text-muted-foreground">
              Every event includes original field IDs, labels, values and the
              form version. Verify the HMAC signature and deduplicate using the
              delivery ID. Use your CRM endpoint or an automation service that
              supports signed webhooks.
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
              className="size-4 accent-neutral-900"
            />
            Automatically deliver new leads
          </label>
          {integration && (
            <p className="text-xs text-amber-800">
              Saving changes stops queued deliveries from using outdated
              settings. Retry affected deliveries after reviewing the new
              configuration.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={save.isPending}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary text-neutral-950"
              disabled={
                save.isPending || (kind === "hubspot" && !fields.length)
              }
            >
              {save.isPending ? "Saving…" : "Save connection"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
