import React from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import MoveItemsSection from './MoveItemsSection';

interface MoveItemsProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function MoveItems({ children, open, onOpenChange }: MoveItemsProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}

      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl md:max-w-3xl p-3 bg-transparent border-none shadow-none focus:outline-none"
      >
        {/* Floating Curved Panel Container */}
        <div className="h-full w-full bg-background border border-border/40 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 overflow-hidden">
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
            <MoveItemsSection />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default MoveItems;