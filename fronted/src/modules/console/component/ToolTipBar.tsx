import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import React from "react";
interface Type {
  icon: IconSvgElement;
  tooltip: string;
  onClick: () => void;
}
function ToolTipBar({ icon, tooltip, onClick }: Type) {
  return (
    <Tooltip>
      <TooltipTrigger className="cursor-pointer" asChild>
        <button onClick={onClick}>
          <HugeiconsIcon icon={icon} className="size-4.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="rounded-lg text-white text-xs capitalize py-2 tracking-wide">
        <p className="">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default ToolTipBar;
