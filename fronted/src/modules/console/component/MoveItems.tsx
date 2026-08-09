import React, { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import MoveItemsSection from './MoveItemsSection';
import { LibraryType } from '@/modules/types';

interface MoveItemsProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  item: LibraryType;
  workspaceId: string;
  onMoved?: () => void;
}

function MoveItems({ children, open, onOpenChange, item, workspaceId, onMoved }: MoveItemsProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;

  const handleOpenChange = (nextOpen: boolean) => {
    if (open === undefined) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}

      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl md:max-w-3xl p-2 bg-transparent border-none shadow-none focus:outline-none"
      >
        {/* Floating Curved Panel Container */}
        <div className="h-full w-full bg-background border border-border/40 rounded-3xl p-3 shadow-2xl flex flex-col gap-4 overflow-hidden">
          <SheetHeader className="p-0 text-left space-y-1">
            <SheetTitle className="text-xl font-bold tracking-tight">
              Move Item
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              Select a target folder to move this item.
            </SheetDescription>
          </SheetHeader>

          {/* Scrollable folder navigation area */}
          <div className="flex-1 overflow-y-auto min-h-0 pr-1">
            {isOpen && (
              <MoveItemsSection
                item={item}
                workspaceId={workspaceId}
                onMoved={onMoved}
              />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default MoveItems;
