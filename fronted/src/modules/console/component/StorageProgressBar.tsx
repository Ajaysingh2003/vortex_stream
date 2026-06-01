import React from "react";

function StorageProgressBar({
  progress,
  used,
  limit,
}: {
  progress: number;
  used: string;
  limit: string;
}) {
  return (
    <div className="flex gap-3  flex-col">
      <h3 className="text-accent text-stone-500 font-medium text-[13px] tracking-wide uppercase ">
        {used}/{limit}
      </h3>

      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 bg-progress-gradient`}
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
    </div>
  );
}

export default StorageProgressBar;
