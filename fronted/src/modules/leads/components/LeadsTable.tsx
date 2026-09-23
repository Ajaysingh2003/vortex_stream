"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { VideoDataTable } from "@/modules/console/component/VideoDataTable";
import type { Lead, LeadField } from "../types";
import { answerText, formatDate } from "../lib/format";

export function LeadsTable({
  items,
  fields,
  selected,
  onSelect,
  onOpen,
}: {
  items: Lead[];
  fields: LeadField[];
  selected: string[];
  onSelect: (ids: string[]) => void;
  onOpen: (lead: Lead) => void;
}) {
  const selectable = items
    .filter((item) => !item.skipped)
    .map((item) => item.id);
  const columns: ColumnDef<Lead>[] = [
    {
      id: "select",
      header: () => (
        <input
          className="m-3 size-4 accent-neutral-900"
          type="checkbox"
          aria-label="Select all completed responses on this page"
          disabled={!selectable.length}
          checked={
            !!selectable.length &&
            selectable.every((id) => selected.includes(id))
          }
          onChange={(event) => onSelect(event.target.checked ? selectable : [])}
        />
      ),
      cell: ({ row }) => (
        <input
          className="m-3 size-4 accent-neutral-900"
          type="checkbox"
          aria-label={`Select response ${row.original.id.slice(0, 8)}`}
          disabled={row.original.skipped}
          checked={selected.includes(row.original.id)}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) =>
            onSelect(
              event.target.checked
                ? [...selected, row.original.id]
                : selected.filter((id) => id !== row.original.id),
            )
          }
        />
      ),
    },
    {
      id: "received",
      header: "Received",
      cell: ({ row }) => (
        <button
          className="min-w-40 text-left text-neutral-900 hover:underline"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(row.original);
          }}
        >
          <span className="block text-xs font-medium">
            {formatDate(row.original.createdAt)}
          </span>
          <span className="text-xs text-muted-foreground">
            Form v{row.original.formVersion} · {row.original.id.slice(0, 8)}
          </span>
        </button>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${row.original.skipped ? "bg-stone-100 text-stone-600" : "bg-emerald-50 text-emerald-800"}`}
        >
          {row.original.skipped ? "Skipped" : "Completed"}
        </span>
      ),
    },
    ...fields.map((field): ColumnDef<Lead> => ({
      id: field.id,
      header: () => (
        <span
          className="block max-w-56 truncate"
          title={`${field.label} · ${field.id}`}
        >
          {field.label}
          {field.archived && (
            <span className="block text-[9px] font-normal">Archived field</span>
          )}
        </span>
      ),
      cell: ({ row }) => {
        const answer = row.original.answers.find(
          (answer) => answer.fieldId === field.id,
        );
        return (
          <span
            className="block min-w-32 max-w-64 truncate"
            title={
              answer
                ? `${answer.label}: ${answerText(answer)}`
                : "This field was not answered in this response"
            }
          >
            {answerText(answer)}
          </span>
        );
      },
    })),
    {
      id: "delivery",
      header: "CRM delivery",
      cell: ({ row }) => {
        const jobs = row.original.deliveries;
        return (
          <span className="whitespace-nowrap text-xs">
            {!jobs.length
              ? "—"
              : jobs.some((job) => job.status === "failed")
                ? "Needs attention"
                : jobs.every((job) => job.status === "delivered")
                  ? "Delivered"
                  : "Pending"}
          </span>
        );
      },
    },
  ];
  return (
    <VideoDataTable
      columns={columns}
      data={items}
      name="responses"
      onRowClick={({ id }) => {
        const lead = items.find((item) => item.id === id);
        if (lead) onOpen(lead);
      }}
    />
  );
}
