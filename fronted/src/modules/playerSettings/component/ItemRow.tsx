import { Switch } from "@/components/ui/switch";
import { Play } from "lucide-react";
import React from "react";
import {  controlsType, generalType, useSetting } from "./Settings";

interface RowType {
  label: string;
  description: string;
  onChange: (checked: boolean) => void;
  icon: React.ReactNode;
  checked: boolean;
}
function ItemRow({ label, description, onChange, icon, checked }: RowType) {
    
  return (
    <section className="w-full border-b-[0.5px] border-stone-200">
      <div className="w-full grid grid-cols-[40px_1fr_20px] pb-3 gap-3">
        <div className="flex items-center justify-center">
          <div className="bg-stone-100  rounded-md px-2 py-2">{icon}</div>
        </div>
        <div className=" flex items-scenter justify-center  flex-col space-y-0.5 ">
          <h3 className="text-[14px] font-medium text-stone-800 capitalize leading-none">
            {label}
          </h3>
          <p className=" capitalize text-stone-500 text-[13px] leading-relaxed">
            {description}
          </p>
        </div>
        <div className=" flex items-center justify-center  pr-4">
          <Switch
            onCheckedChange={onChange}
            checked={checked}
            className="data-[state=checked]:bg-indigo-600"
            value={"yes"}
          />
        </div>
      </div>
    </section>
  );
}

export default ItemRow;
