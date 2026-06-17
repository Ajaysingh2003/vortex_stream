"use client";
import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { v4 as uuidv4 } from "uuid";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Delete, GripVertical, PlusCircle, RemoveFormattingIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";

type fieldType = "dropdown" | "checkbox" | "text";

type optionType = { id: string; label: string; scope: string };
export interface formFieldType {
  id: string;
  label: string;
  scope: string;
  type: fieldType;
  position: string;
  options?: optionType[];
}

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function FormFields({fields,setFields}:{fields:formFieldType[],setFields:React.Dispatch<React.SetStateAction<formFieldType[]>>}) {

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;

  if (over && active.id !== over.id) {
    setFields((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      
      // 1. Move the items in the array structure first
      const rearrangedItems = arrayMove(items, oldIndex, newIndex);
      
      // 2. Re-map the position property to match its new sorted index position
      return rearrangedItems.map((item, index) => ({
        ...item,
        position: `${index + 1}` // Keeps positions sequentially locked (1, 2, 3...)
      }));
    });
  }
};

  const newFields = (labels: string, type: fieldType) => {
    const newPayload: formFieldType = {
      id: uuidv4(),
      label: labels,
      type: type,
      position: `${fields.length + 1}`,
      get scope() {
        return this.label.trim().toLowerCase().replace(/\s+/g, "_");
      },
    };

    if (type !== "text") {
      const optionPayload: optionType[] = [
        {
          id: uuidv4(),
          label: `option 1`,
          get scope() {
            return this.label.trim().toLowerCase().replace(/\s+/g, "_");
          },
        },
        {
          id: uuidv4(),
          label: `option 2`,
          get scope() {
            return this.label.trim().toLowerCase().replace(/\s+/g, "_");
          },
        },
      ];
      newPayload.options = optionPayload;
    }

    setFields((item) => [...item, newPayload]);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="text-[13px] font-semibold text-neutral-700 capitalize tracking-wider mb-2">
        <h3>Form fields</h3>
      </div>

      <SortableContext
        items={fields.map((f) => f.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 mb-4">
          {fields.map((field) => (
            <SortableFieldRow
              key={field.id}
              field={field}
              fieldData={fields}
              setField={setFields}
            />
          ))}
        </div>

        <div className="flex items-center w-full justify-center">
          <NewFields onClick={newFields} />
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableFieldRow({
  field,
  setField,
  fieldData,
}: {
  field: formFieldType;
  setField: React.Dispatch<React.SetStateAction<formFieldType[]>>;
  fieldData: formFieldType[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
  };


  
  const isFieldDuplicate = (currentLabel: string): boolean => {
    if (!currentLabel.trim()) return false;
    return fieldData.filter((f) => f.label.trim().toLowerCase() === currentLabel.trim().toLowerCase()).length > 1;
  };

  const isOptionDuplicate = (optionLabel: string): boolean => {
    if (!optionLabel.trim() || !field.options) return false;
    return field.options.filter((o) => o.label.trim().toLowerCase() === optionLabel.trim().toLowerCase()).length > 1;
  };

  const handleInputChange = (id: string, newValue: string) => {
    setField((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, label: newValue } : item,
      ),
    );
  };

  const handleChange = (id: string, newValue: string) => {
    setField((prevItems) =>
      prevItems.map((item) => {
        const hasOption = item.options?.some((e) => e.id === id);
        if (!hasOption) return item;
        
        return {
          ...item,
          options: item.options?.map((opt) =>
            opt.id === id ? { ...opt, label: newValue } : opt,
          ),
        };
      }),
    );
  };

  const newOption = (labelId: string) => {
    const targetingField = fieldData.find((f) => f.id === labelId);
    const nextOptionNumber = (targetingField?.options?.length || 0) + 1;
    const labels = `Option ${nextOptionNumber}`;

    const newOptPayload: optionType = {
      id: uuidv4(),
      label: labels,
      get scope() {
        return this.label.trim().toLowerCase().replace(/\s+/g, "_");
      },
    };

    setField((prevFields) =>
      prevFields.map((field) => {
        if (field.id === labelId) {
          return {
            ...field,
            options: [...(field.options || []), newOptPayload],
          };
        }
        return field;
      }),
    );
  };

  // Pre-calculate boundary checks for conditional styles
  const fieldHasError = isFieldDuplicate(field.label);


  const handleFieldRemove = (fieldId: string) => {
  setField((prevItems) =>
    prevItems
      .filter((item) => item.id !== fieldId) // 1. Remove the clicked field
      .map((item, index) => ({
        ...item,
        position: `${index + 1}`, // 2. Reset positions sequentially (1, 2, 3...)
      }))
  );
};


const handleOptionRemove = (fieldId: string, optionId: string) => {
  setField((prevFields) =>
    prevFields.map((field) => {
      if (field.id === fieldId && field.options) {
        return {
          ...field,
          options: field.options.filter((opt) => opt.id !== optionId),
        };
      }
      return field; 
    })
  );
};
  return (
    <div ref={setNodeRef} style={style}>
      {/* 1. TEXT FIELD TYPE */}
      {field.type === "text" && (
        <div className="flex flex-col px-2 py-1 bg-neutral-100 border-[0.5px] border-neutral-400 rounded-lg">
          <div className="flex items-center gap-3">
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="cursor-grab p-1 text-neutral-500 hover:text-neutral-800"
            >
              <GripVertical size={16} />
            </button>

            <div className="flex-1">
              <Input
                value={field.label}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                className={`bg-transparent text-accent text-sm md:text-md border outline-none shadow-none focus-visible:ring-0 rounded-sm h-7 transition-colors ${
                  fieldHasError 
                    ? "border-red-500 focus-visible:border-red-500" 
                    : "border-transparent focus-visible:border-none"
                }`}
              />
            </div>
            <div className="text-neutral-400 cursor-pointer p-1">
              <button className="cursor-pointer" onClick={(()=>handleFieldRemove(field.id))}>
                <X className="size-4"/>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. DROPDOWN FIELD TYPE */}
      {field.type === "dropdown" && (
        <div className="flex flex-col px-2 py-1 bg-neutral-100 border-[0.5px] border-neutral-400 rounded-lg">
          <div className="flex items-center gap-3">
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="cursor-grab p-1 text-neutral-500 hover:text-neutral-800"
            >
              <GripVertical size={16} />
            </button>
            
            <div className="flex-1">
              <Input
                value={field.label}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                className={`bg-transparent text-accent text-sm md:text-md border outline-none shadow-none focus-visible:ring-0 rounded-sm h-7 transition-colors ${
                  fieldHasError 
                    ? "border-red-500 focus-visible:border-red-500" 
                    : "border-transparent focus-visible:border-none"
                }`}
              />
            </div>
            <div className="text-neutral-400 cursor-pointer p-1">
               <button className="cursor-pointer" onClick={(()=>handleFieldRemove(field.id))}>
                <X className="size-4"/>
              </button>
            </div>
          </div>

          <div className="option w-full py-1 md:py-1.5">
            <h6 className="text-[13px] pl-1 font-semibold text-neutral-700 capitalize tracking-wider">
              Dropdown options
            </h6>
            <div className="flex flex-col gap-2 mt-2">
              {field.options?.map((opt) => {
                const optionHasError = isOptionDuplicate(opt.label);
                return (
                  <div className="w-full flex items-center gap-4  ">
                  
                   <div className="w-full flex-1">
                    <Input
                    key={opt.id}
                    value={opt.label}
                    onChange={(e) => handleChange(opt.id, e.target.value)}
                    className={`bg-transparent flex-1 w-full border text-accent text-sm md:text-md focus-visible:ring-0 focus-within:outline:none py-0 max-h-8 rounded-lg transition-colors ${
                      optionHasError 
                        ? "border-red-500 focus-visible:border-red-500" 
                        : "border-neutral-500"
                    }`}
                  />
                   </div>

                  <button className="cursor-pointer text-neutral-400 pr-1" onClick={(()=>handleOptionRemove(field.id,opt.id))}>
                <X className="size-4"/>
              </button>
                 </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <Button
              onClick={() => newOption(field.id)}
              className="w-fit bg-transparent flex items-center justify-center gap-2 outline-none border-none hover:bg-transparent focus-visible:border-none shadow-none text-xs cursor-pointer rounded-sm focus-visible:ring-0"
              variant="outline"
            >
              <PlusCircle className="h-4 w-4 text-muted-foreground" />
              New option
            </Button>
          </div>
        </div>
      )}

      {/* 3. CHECKBOX FIELD TYPE */}
      {field.type === "checkbox" && (
        <div className="flex flex-col px-2 py-1 bg-neutral-100 border-[0.5px] border-neutral-400 rounded-lg">
          <div className="flex items-center gap-3">
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="cursor-grab p-1 text-neutral-500 hover:text-neutral-800"
            >
              <GripVertical size={16} />
            </button>

            <div className="flex-1">
              <Input
                value={field.label}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                className={`bg-transparent text-accent text-sm md:text-md border outline-none shadow-none focus-visible:ring-0 rounded-sm h-7 transition-colors 
                  ${
                  fieldHasError 
                    ? "border-red-500 focus-visible:border-red-500" 
                    : "border-transparent focus-visible:border-none"
                }`}

              />
            </div>
            <div className="text-neutral-400 cursor-pointer p-1">
               <button className="cursor-pointer" onClick={(()=>handleFieldRemove(field.id))}>
                <X className="size-4"/>
              </button>
            </div>
          </div>

          <div className="option w-full py-1 md:py-1.5">
            <h6 className="text-[13px] pl-1 font-semibold text-neutral-700 capitalize tracking-wider">
              checkbox options
            </h6>
            <div className="flex flex-col gap-2 mt-2">
              {field.options?.map((opt) => {
                const optionHasError = isOptionDuplicate(opt.label);
                return (
                 <div className="w-full flex items-center gap-4  ">
                  
                   <div className="w-full flex-1">
                    <Input
                    key={opt.id}
                    value={opt.label}
                    onChange={(e) => handleChange(opt.id, e.target.value)}
                    className={`bg-transparent flex-1 w-full border text-accent text-sm md:text-md focus-visible:ring-0 focus-within:outline:none py-0 max-h-8 rounded-lg transition-colors ${
                      optionHasError 
                        ? "border-red-500 focus-visible:border-red-500" 
                        : "border-neutral-500"
                    }`}
                  />
                   </div>

                  <button className="cursor-pointer text-neutral-400 pr-1" onClick={(()=>handleOptionRemove(field.id,opt.id))}>
                <X className="size-4"/>
              </button>
                 </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <Button
              onClick={() => newOption(field.id)}
              className="w-fit bg-transparent flex items-center justify-center gap-2 outline-none border-none hover:bg-transparent focus-visible:border-none shadow-none text-xs cursor-pointer rounded-sm focus-visible:ring-0"
              variant="outline"
            >
              <PlusCircle className="h-4 w-4 text-muted-foreground" />
              New option
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function NewFields({
  onClick,
}: {
  onClick: (label: string, types: fieldType) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="w-full bg-transparent flex items-center justify-center gap-2 outline-none border-none hover:bg-transparent focus-visible:border-none shadow-none text-xs cursor-pointer rounded-sm focus-visible:ring-0"
          variant="outline"
        >
          <PlusCircle className="h-4 w-4 text-muted-foreground" />
          New Field
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] shadow-md rounded-md p-1"
        align="start"
      >
        <DropdownMenuGroup className="w-full flex flex-col gap-0.5">
          <DropdownMenuItem
            className="w-full py-1.5 px-2 rounded-sm cursor-pointer hover:bg-black/5"
            onClick={() => onClick("new field", "text")}
          >
            Text Input
          </DropdownMenuItem>
          <DropdownMenuItem
            className="w-full py-1.5 px-2 rounded-sm cursor-pointer hover:bg-black/5"
            onClick={() => onClick("new field", "dropdown")}
          >
            Dropdown
          </DropdownMenuItem>
          <DropdownMenuItem
            className="w-full py-1.5 px-2 rounded-sm cursor-pointer hover:bg-black/5"
            onClick={() => onClick("new field", "checkbox")}
          >
            Checkbox
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}