import React from "react";
import DropdownFilters from "./DropdownFilters";
import { TextAlignJustify, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateFolder from "@/modules/upload/component/CreateFolder";

type TypeViewMethod = "list" | "grid";

interface PageProps {
  parentId: string | null;
  workspaceID: string;
  onSucess: () => void;
  activeViewMethod: TypeViewMethod;
  setActiveViewMethod: React.Dispatch<React.SetStateAction<TypeViewMethod>>;
}

function Filters({
  parentId,
  workspaceID,
  onSucess,
  activeViewMethod,
  setActiveViewMethod,
}: PageProps) {
  const filterType = [
    { label: "All Contents", filter: "all" },
    { label: "Videos Only", filter: "video" },
    { label: "Folders Only", filter: "folder" },
  ];

  const dateFilters = [
    { label: "Anytime", filter: "any" },
    { label: "Today", filter: "today" },
    { label: "Last 7 Days", filter: "7_day" },
    { label: "Last 30 Days", filter: "30_days" },
    { label: "This Month", filter: "this_month" },
  ];

  const sortFilters = [
    { label: "Date Created (Newest)", filter: "created_desc" },
    { label: "Date Created (Oldest)", filter: "created_asc" },
    { label: "Name (A to Z)", filter: "name_asc" },
    { label: "Name (Z to A)", filter: "name_desc" },
    { label: "Size (Largest)", filter: "size_desc" },
  ];

  const visibilityFilters = [
    { label: "All Access Types", filter: "all" },
    { label: "Private Link Secured", filter: "private" },
    { label: "Publicly Accessible", filter: "public" },
  ];

  return (
    <div className="flex gap-3 items-center justify-between w-full">
      <div className="flex gap-3 items-center">
        <DropdownFilters scope="type" label="Type" items={filterType} />
        <DropdownFilters scope="date" label="Date Modified" items={dateFilters} />
        <DropdownFilters scope="sort" label="Sort By" items={sortFilters} />
        <DropdownFilters scope="visibility" label="Visibility" items={visibilityFilters} />
      </div>
      <div className="flex gap-4">
        <CreateFolder parentID={parentId} workspaceID={workspaceID} onSucess={onSucess} />
        <Button
          onClick={() => setActiveViewMethod("list")}
          className={`${activeViewMethod === "list" ? "bg-stone-100" : "bg-transparent"} rounded-lg px-2 py-4 cursor-pointer`}
          variant="secondary"
        >
          <TextAlignJustify />
        </Button>
        <Button
          onClick={() => setActiveViewMethod("grid")}
          className={`${activeViewMethod === "grid" ? "bg-stone-100" : "bg-transparent"} rounded-lg px-2 py-4 cursor-pointer`}
          variant="secondary"
        >
          <LayoutGrid />
        </Button>
      </div>
    </div>
  );
}

export default Filters;