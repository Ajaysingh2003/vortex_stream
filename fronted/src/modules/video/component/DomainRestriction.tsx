"use client";

import { Button } from "@/components/ui/button";
import { VideoAsset, WorkspaceType } from "@/modules/types";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Globe, Plus, X } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface AllowedDomain {
  id: string;
  domain: string;
}

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `domain-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function sanitizeDomain(raw: string): string {
  let cleaned = raw.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//i, "");
  cleaned = cleaned.replace(/\/.*$/, "");
  return cleaned;
}

function isValidDomain(domain: string): boolean {
  if (!domain) return false;
  if (domain === "localhost") return true;
  // Allows optional wildcard prefix (*.example.com) and standard domains/IPs
  const pattern = /^(\*\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$|^localhost(:\d+)?$/;
  return pattern.test(domain);
}

const MAX_FREE_DOMAINS = 5;

function DomainRestriction({ isPremium }: { isPremium?: boolean }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: workspace } = useSuspenseQuery(
    trpc.user.getWorkspace.queryOptions(),
  );
  const workspaceData = workspace as WorkspaceType;

  const params = useParams();
  const videoId = params.id;

  const { data: videoData } = useSuspenseQuery(
    trpc.video.getVideoFromWorkspace.queryOptions({
      videoId: videoId as string,
      workspaceID: workspaceData.id,
    }),
  );

  const videoDataType = videoData as VideoAsset;

  const { data: domainRestrictionsData } = useSuspenseQuery(
    trpc.video.getVideoDomainRestrictions.queryOptions({
      videoId: videoDataType.id,
      workspaceID: workspaceData.id,
    }),
  );

  const rawDomains = (domainRestrictionsData ?? []) as Array<{
    id: string;
    domain: string;
  }>;

  const [domains, setDomains] = useState<AllowedDomain[]>(() =>
    rawDomains.length === 0
      ? [{ id: makeId(), domain: "" }]
      : rawDomains.map((d) => ({ id: d.id, domain: d.domain })),
  );

  const [domainErrors, setDomainErrors] = useState<Record<string, string>>({});

  const mutateDomainRestrictions = useMutation(
    trpc.video.saveVideoDomainRestrictions.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(
          trpc.video.getVideoDomainRestrictions.queryOptions({
            videoId: videoDataType.id,
            workspaceID: workspaceData.id,
          }),
        );
        toast.success("Domain restrictions saved successfully");
      },
      onError: (err) => {
        toast.error(err.message ?? "Something went wrong");
      },
    }),
  );

  const handleDomainChange = (id: string, value: string) => {
    setDomains((prev) =>
      prev.map((d) => (d.id === id ? { ...d, domain: value } : d)),
    );

    if (domainErrors[id]) {
      setDomainErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const validateAndFormatDomain = (id: string) => {
    const target = domains.find((d) => d.id === id);
    if (!target) return;

    const cleaned = sanitizeDomain(target.domain);

    if (!cleaned) {
      setDomainErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }

    if (!isValidDomain(cleaned)) {
      setDomainErrors((prev) => ({
        ...prev,
        [id]: "Enter a valid domain (e.g. example.com or *.example.com)",
      }));
      return;
    }

    // Check duplicate
    const isDuplicate = domains.some(
      (d) => d.id !== id && sanitizeDomain(d.domain) === cleaned,
    );
    if (isDuplicate) {
      setDomainErrors((prev) => ({
        ...prev,
        [id]: "This domain is already added",
      }));
      return;
    }

    setDomains((prev) =>
      prev.map((d) => (d.id === id ? { ...d, domain: cleaned } : d)),
    );
    setDomainErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const canAdd = isPremium || domains.length < MAX_FREE_DOMAINS;

  const addDomain = () => {
    if (!canAdd) return;
    setDomains((prev) => [...prev, { id: makeId(), domain: "" }]);
  };

  const removeDomain = async (id: string) => {
    if (domains.length <= 1) {
      setDomains([{ id: makeId(), domain: "" }]);
      setDomainErrors({});
      return;
    }

    setDomains((prev) => prev.filter((d) => d.id !== id));
    setDomainErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

  };

  const handleSubmit = async () => {
    const validDomains = domains
      .map((d) => ({ ...d, domain: sanitizeDomain(d.domain) }))
      .filter((d) => d.domain.length > 0);

    const errors: Record<string, string> = {};
    const seen = new Set<string>();
    for (const item of validDomains) {
      if (!isValidDomain(item.domain)) {
        errors[item.id] = "Enter a valid domain (e.g. example.com or *.example.com)";
      } else if (seen.has(item.domain)) {
        errors[item.id] = "This domain is already added";
      }
      seen.add(item.domain);
    }
    if (Object.keys(errors).length > 0) {
      setDomainErrors(errors);
      return;
    }

    const savedDomains = await mutateDomainRestrictions.mutateAsync({
      video_id: videoDataType.id,
      workspaceID: workspaceData.id,
      domains: validDomains.map((d) => d.domain),
    });
    setDomains(
      savedDomains.length === 0
        ? [{ id: makeId(), domain: "" }]
        : savedDomains.map((domain: AllowedDomain) => ({ id: domain.id, domain: domain.domain })),
    );
  };

  const hasErrors = Object.keys(domainErrors).length > 0;
  const atFreeLimit = !isPremium && domains.length >= MAX_FREE_DOMAINS;

  return (
    <div className="w-full rounded-2xl bordezr border-neutral-200 bg-transparent px-3 pt-5 ">
      <div className="flex flex-col border-[1px] border-stone-200 rounded-2xl p-3">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-heading font-semibold text-neutral-900">
              Domain Restrictions
            </h3>
            <p className="mt-0.5 text-sm text-neutral-500">
              Restrict playback so this video can only be embedded on specific domains.
            </p>
          </div>
          {!isPremium && (
            <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-500">
              {domains.length}/{MAX_FREE_DOMAINS} domains
            </span>
          )}
        </div>

        {domains.length > 0 && (
          <div className="mb-2 hidden grid-cols-1 gap-3 px-0.5 text-xs font-medium text-neutral-400 md:grid">
            <span>Allowed Domains</span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {domains.map((item, index) => (
            <div
              key={item.id}
              className="grid grid-cols-1 gap-2 rounded-xl border border-neutral-100 bg-neutral-50/60 p-3 md:grid-cols-1 md:items-start md:gap-3 md:border-none md:bg-transparent md:p-0"
            >
              <div>
                <div
                  className={`relative flex w-full items-center rounded-lg border bg-white transition-colors ${
                    domainErrors[item.id]
                      ? "border-rose-400"
                      : "border-neutral-200 focus-within:border-stone-400"
                  }`}
                >
                  <div className="pl-3 text-neutral-400">
                    <Globe className="h-4 w-4" />
                  </div>
                  <input
                    value={item.domain}
                    onChange={(e) => handleDomainChange(item.id, e.target.value)}
                    onBlur={() => validateAndFormatDomain(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      }
                    }}
                    placeholder="example.com or *.example.com"
                    aria-label={`Allowed domain ${index + 1}`}
                    className="w-full flex-1 bg-transparent py-2 pl-2.5 pr-10 text-sm text-neutral-800 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => removeDomain(item.id)}
                    aria-label="Remove domain"
                    className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-neutral-400 transition-colors hover:text-rose-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {domainErrors[item.id] && (
                  <p className="mt-1 text-[11px] text-rose-500">
                    {domainErrors[item.id]}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addDomain}
          disabled={!canAdd}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-500 transition-all duration-200 hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-neutral-300 disabled:hover:bg-transparent disabled:hover:text-neutral-500"
        >
          <Plus className="h-4 w-4 stroke-[2]" />
          {atFreeLimit
            ? `Limit of ${MAX_FREE_DOMAINS} domains reached`
            : "Add Domain"}
        </button>

        {hasErrors && (
          <p className="mt-3 text-xs text-rose-500">
            Fix the highlighted domain errors before saving.
          </p>
        )}
      </div>

      <div className="border-t-[1px]z py-2 px-2 mt-2 border-black/5">
        <div className="flex justify-end flex-row gap-2 w-full">
          <Button
            disabled={hasErrors || mutateDomainRestrictions.isPending}
            onClick={handleSubmit}
            className="tracking-wider h-8 bg-main-btn capitalize px-3 text-xs font-semibold cursor-pointer border rounded-full md:text-sm transition-all duration-200"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DomainRestriction;
