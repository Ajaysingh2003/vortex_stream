import React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface TypeProps {
  label: string;
  items: {
    label: string;
    filter: string;
  }[];
}

function DropdownFilters({ label, items }: TypeProps) {
  const handleApply = (filter: string) => {
    console.log(filter, label);
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        
        <Button
          className="bg-transparent cursor-pointer text-[13px] font-semibold font-subheading px-2 lg:px-4 shadow-none border rounded-sm"
          variant="outline"
        >
          {label} <ChevronDown />
        </Button>

      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="rounded-md shadow-lg min-w-fit pr-8"
        align="end"
      >
        <DropdownMenuGroup>
          {items.map((e) => (
            <DropdownMenuLabel key={e.label} asChild>
              <Button
                variant={"secondary"}
                className="w-full font-mediums font-semibold flex items-center justify-start bg-transparent capitalize text-sm text-accent leading-relaxed tracking-wide rounded-lg md:text-[13px] text-left"
                onClick={() => handleApply(e.filter)}
              >
                {e.label}
              </Button>
            </DropdownMenuLabel>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default DropdownFilters;
