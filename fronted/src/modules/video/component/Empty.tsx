import React from "react";
import { EyeOff } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex min-h-[200px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
      {/* Visual Indicator */}
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-xs border border-gray-100 text-gray-400">
        <EyeOff size={18} className="stroke-[1.75]" />
      </div>

      {/* Message */}
      <div className="mt-3 space-y-1">
        <h3 className="text-sm font-medium text-gray-700 tracking-tight">
          No end screen will show
        </h3>
        <p className="text-[12px] text-gray-400 max-w-[240px]">
          The video will stop immediately without displaying additional cards or call-to-actions.
        </p>
      </div>
    </div>
  );
}