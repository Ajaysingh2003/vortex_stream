import React, { useEffect, useState } from "react";
import { useVideoContext } from "../context/VideoContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { optionType } from "@/modules/types";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

function PreviewForm() {
  const { layout, fields } = useVideoContext()!;

  const formHeader = "Unlock this content";
  const formDescription = "Fill out the form below to continue watching.";

  const MAX_SHOW = 3;

  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(MAX_SHOW);

  const showContinue = end < fields?.length;
  const totalPages = Math.max(1, Math.ceil(fields?.length / MAX_SHOW));
  const currentPage = Math.floor(start / MAX_SHOW);

  // re-clamp if fields list changes (added/removed) while mid-pagination
  useEffect(() => {
    if (end > fields?.length) {
      setEnd(Math.min(start + MAX_SHOW, fields?.length));
    }
  }, [fields?.length]);

  const handleContinue = () => {
    if (end >= fields?.length) return;
    const newStart = end;
    const newEnd = Math.min(end + MAX_SHOW, fields?.length);
    setStart(newStart);
    setEnd(newEnd);
  };

  const handleBack = () => {
    if (start === 0) return;
    const newStart = Math.max(start - MAX_SHOW, 0);
    setStart(newStart);
    setEnd(newStart + MAX_SHOW);
  };

  if (fields?.length == 0 || !fields) return

  return (
    <div
      className={`h-full flex w-full items-center ${
        layout == "left" ? "justify-start" : layout == "center" ? "justify-center" : "justify-end"
      }`}
    >
      <div className="max-w-84 w-full">
        <div className="flex flex-col gap-3 md:gap-5 py-2">

          {/* ── header + description ── */}
          <div className="flex flex-col items-center text-center gap-1.5 px-2">
            <h3 className="font-heading font-bold text-white text-xl md:text-2xl lg:text-3xl leading-tight tracking-tight drop-shadow-sm">
              {formHeader}
            </h3>
            <p className="text-[13px] md:text-sm leading-relaxed text-white/70 max-w-[280px]">
              {formDescription}
            </p>
          </div>

          {/* ── progress dots ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-200 ${
                    idx === currentPage ? "w-6 bg-white" : "w-1.5 bg-white/30"
                  }`}
                />
              ))}
            </div>
          )}

          {/* ── fields ── */}
          <div className="flex flex-col gap-3.5 items-center w-full px-3 md:px-4">
            { fields?.length >0 && [...fields].slice(start, end).map((field) =>
              field.type == "text" ? (
                <TextInput key={field.id ?? field.label} label={field.label} />
              ) : field.type == "dropdown" ? (
                <DropDownInput key={field.id ?? field.label} label={field.label} options={field.options} />
              ) : (
                <CheckboxInput key={field.id ?? field.label} label={field.label} options={field.options} />
              ),
            )}

            <div className="w-full space-y-2">
              {showContinue ? (
                <Button
                    
                  onClick={handleContinue}
                  className="w-full bg-white hover:bg-white/90 bg-main-btn text-slate-950 rounded-lg font-semibold h-10 transition"
                >
                  Continue
                </Button>
              ) : (
                <Button className="w-full bg-white hover:bg-white/90 text-slate-950 bg-main-btn rounded-lg font-semibold h-10 transition">
                  Submit
                </Button>
              )}

              {start > 0 && (
                <button
                  onClick={handleBack}
                  className="w-full text-center text-white/50 hover:text-white/80 text-xs font-medium transition cursor-pointer"
                >
                  ← Back
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default PreviewForm;

function TextInput({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <Label htmlFor={label} className="capitalize text-white/90 text-[13px] font-medium">
        {label}
      </Label>
      <Input
        placeholder={`Enter ${label}`}
        className="bg-white rounded-lg h-10 border-none shadow-none focus-visible:ring-2 focus-visible:ring-white/40"
        id={label}
      />
    </div>
  );
}

function DropDownInput({
  label,
  options,
}: {
  label: string;
  options?: optionType[];
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <Label htmlFor={label} className="capitalize text-white/90 text-[13px] font-medium">
        {label}
      </Label>
      <Select>
        <SelectTrigger className="w-full bg-white rounded-lg h-10 border-none shadow-none">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent className="rounded-lg">
          <SelectGroup>
            {options?.map((opt) => (
              <SelectItem
                key={opt.id ?? opt.label}
                className="hover:bg-black/5 rounded-md capitalize cursor-pointer"
                value={opt.label}
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

function CheckboxInput({
  label,
  options,
}: {
  label: string;
  options?: optionType[];
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const toggleSelect = (optId: string) => {
    setSelected((prev) => ({
      ...prev,
      [optId]: !prev[optId]
    }));
  };

  return (
    <div className="flex flex-col gap-2 w-full text-left">
      <Label className="capitalize text-slate-200 text-[11px] font-bold tracking-wide mb-0.5">
        {label}
      </Label>
      
      <div className="flex flex-wrap gap-2">
        {options && options.length > 0 ? (
          options.map((opt) => {
            const isChecked = !!selected[opt.id];
            const elementId = opt.id || opt.label;
            
            return (
              <label
                key={elementId}
                htmlFor={`${label}-${elementId}`}
                onClick={() => toggleSelect(opt.id)}
                className={`flex items-center gap-2 px-3.5 h-9 rounded-xl border cursor-pointer select-none transition-all duration-200 ${
                  isChecked
                    ? "bg-white text-slate-950 border-white shadow-md font-semibold scale-[1.02]"
                    : "bg-black/70 hover:bg-black/55 text-slate-100 border-white/10 hover:border-white/10"
                }`}
              >
                {/* Custom Checkbox Indicator inside the pill option */}
                <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                  isChecked 
                    ? "bg-slate-950 border-slate-950 text-white" 
                    : "border-white/20 bg-black/10"
                }`}>
                  {isChecked && <Check className="size-2.5" strokeWidth={3.5} />}
                </div>
                <span className="text-[12px] tracking-wide capitalize">
                  {opt.label}
                </span>
              </label>
            );
          })
        ) : (
          <span className="text-xs text-slate-500 italic">No options configured.</span>
        )}
      </div>
    </div>
  );
}