"use client";
import {
  // nDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";
// import router
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LibraryType } from "@/modules/types";


// import Router from "next/router";
type withID<T> = T & { id?: string };
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: withID<TData>[];
 onRowClick: (row: { id: string; type: "video" | "folder" }) => void;
  onClick ?: (open: boolean) => void;
  name: string;
  count?:number;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  onClick,
  name,
  count,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  // console.log(table, 44);
  

  return (
    <div className={`  rounded-md border-[0.1px] w-full border-[#eee] bg-background overflow-hidden`}>
      <Table className="bg-[#FFFFFF] ">
        <TableHeader className="px-3">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="h-10 px-3">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    className="tracking-widest space-x-6 font-subheading font-semibold  text-[11px] uppercase text-[##4B5563]"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="min-w-full flezx flex-col gap-5">
           
                
            {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                    <TableRow
                    key={row.id}
                    className="cursor-pointer h-14 hover:bg-stone-50 "
                    data-state={row.getIsSelected() && "selected"}
                    
                     onClick={() => {
                  const asset = row.original as LibraryType;
                  if (asset && asset.id && asset.type) {
                    onRowClick({ id: asset.id, type: asset.type });
                  }
                }}
                    
                    >
                    {row.getVisibleCells().map((cell, i) => (
                        <TableCell
                        key={cell.id}
                        className={`text-sm h-8 text-muted-foreground ${
                            i == 0 ? "p-0" : "p-2"
                        }  `}
                        >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                    ))}
                </TableRow>
                ))
            )

           : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <PlusIcon/>
                      </EmptyMedia>
                      <EmptyTitle>No {name}</EmptyTitle>
                      <EmptyDescription>No {name} found</EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                                  {/* <Button
                      className="sidebar-link sidebar-link-active"
                      onClick={() => onClick(true)}
                    >
                      <PlusIcon />
                      New {name}
                    </Button> */}
                    </EmptyContent>
                  </Empty>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}