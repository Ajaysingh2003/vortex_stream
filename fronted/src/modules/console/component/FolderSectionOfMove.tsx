import { FolderDataType, WorkspaceType } from "@/modules/types";
import CreateFolder from "@/modules/upload/component/CreateFolder";
import { useTRPC } from "@/trpc/client";
import { Plus } from "lucide-react";

interface FolderSectionOfMoveProps {
  selectedFolderChildren: FolderDataType[];
  onOpenFolder: (id: string) => void;
  onCreateFolder?: () => void;
}

const gradients = [
  "from-blue-500 via-indigo-400 to-white",
  "from-pink-500 via-fuchsia-300 to-white",
  "from-green-500 via-emerald-300 to-white",
  "from-violet-500 via-indigo-300 to-white",
  "from-orange-500 via-yellow-300 to-white",
];

export default function FolderSectionOfMove({
  selectedFolderChildren,
  onOpenFolder,
  onCreateFolder,
}: FolderSectionOfMoveProps) {


  return (
    <div className="space-y-2">
      {/* Create Folder */}


      {/* <CreateFolder parentID={folder} /> */}



      {
        selectedFolderChildren.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 p-6 text-center">
            <div className="text-gray-500">No folders found.</div>
            {/* <CreateFolder
              parentID={currentFolderId}
              workspaceID={"workspaceId"}
              onSucess={()=>{}}
            >
              <button className="flex items-center gap-2 rounded-full bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                <Plus size={16} />
                Create Folder
              </button>
            </CreateFolder> */}
          </div>
        )
      }
     

      { selectedFolderChildren.length>0 && selectedFolderChildren.map((folder, index) => (
        <button
          key={folder.id}
          onClick={() => onOpenFolder(folder.id)}
          className="flex w-full items-center gap-4 rounded-2xl p-2 text-left transition hover:bg-zinc-100"
        >
          {/* Thumbnail */}
          <div
            className={`relative h-16 w-24 overflow-hidden rounded-lg bg-gradient-to-br ${
              gradients[index % gradients.length]
            }`}
          >
            {/* Blur blob */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,.8),transparent_40%)]" />

            <div className="absolute -bottom-4 -left-3 h-14 w-14 rounded-full bg-white/25 blur-xl" />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wide text-green-600">
              Folder
            </div>

            <div className="truncate text-[17px] font-medium text-zinc-900">
              {folder.name}
            </div>

            <div className="mt-1 text-[13px] text-zinc-500">
              Updated{" "}
              {new Date(folder.updatedAt).toLocaleDateString("en-US")}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}