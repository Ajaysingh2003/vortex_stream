"use client";

import React from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface ItemRowProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export default function ItemRow({
  label,
  description,
  icon,
  checked,
  onChange,
  className,
}: ItemRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-1.5 px-1 rounded-lg transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 pr-3">
        {icon && (
          <div className="flex size-4 items-center justify-center text-zinc-400 dark:text-zinc-500 shrink-0">
            {icon}
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span className="font-subheading text-[13px] font-medium text-zinc-800 dark:text-zinc-200 tracking-tight truncate">
            {label}
          </span>
          {description && (
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
              {description}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center shrink-0">
        <Switch
          checked={checked}
          onCheckedChange={onChange}
          className="cursor-pointer data-checked:!bg-[#B3E61D] data-[state=checked]:!bg-[#B3E61D] border-transparent shadow-none"
        />
      </div>
    </div>
  );
}
