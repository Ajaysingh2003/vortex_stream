import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import VideoDurationInput from "./VideoDurationInput";
import { useTRPC } from "@/trpc/client";
import { useParams } from "next/navigation";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { VideoAsset, WorkspaceType } from "@/modules/types";
import FormFields, { formFieldType } from "./FormFields";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
type selectType = "before_video" | "during_video" | "after_video";

function CaptureLeads() {
  const [select, setSelect] = useState<selectType>("after_video");
  const [fields, setFields] = useState<formFieldType[]>([
    {
      id: uuidv4(),
      label: "email",
      type: "text",
      position: 2,
      // get scope() {
      //   return this.label.trim().toLowerCase().replace(/\s+/g, "_");
      // },
    },
    {
      id: uuidv4(),
      label: "first name",
      type: "text",
      position: 2,
      // get scope() {
      //   return this.label.trim().toLowerCase().replace(/\s+/g, "_");
      // },
    },
  ]);

  const trpc = useTRPC();
  const params = useParams();
  const videoId = params.id;
  const workspace = useSuspenseQuery(trpc.user.getWorkspace.queryOptions());
  const workspacedata = workspace.data as WorkspaceType;

  const { data: videoData } = useSuspenseQuery(
    trpc.video.getVideoFromWorkspace.queryOptions({
      videoId: videoId as string,
      workspaceID: workspacedata.id,
    }),
  );

  const videoAssets = videoData as VideoAsset;

  const videoUpsertMutate = useMutation(
    trpc.video.createLeadForm.mutationOptions({
      onSuccess:()=>{
        toast.success("form updated Successfully")
      },
      onError:(err)=>{
        toast.error(err.message || "Something went wrong")
      }
    }),
  );
  const [skipForm, setSkipForm] = useState(false);
  const [showAt, setShowAt] = useState<number>(0);
  
  const handleupsertForm = async () => {
    const formattedFields = fields.map((field) => ({
      id: field.id,
      label: field.label,
      type: field.type,
      position: field.position,
      // Fix: Force a fallback to an empty array if options is undefined
      options:
        field.options?.map((opt) => ({ id: opt.id, label: opt.label })) || null,
    }));

    // Now pass 'formattedFields' instead of your raw 'fields' array!
    await videoUpsertMutate.mutateAsync({
      videoId: videoAssets.id,
      workspaceId: workspacedata.id,
      show_at: showAt,
      allow_skip: skipForm,
      placement: select,
      fields: formattedFields,
    });
  };
  return (
    <div className="w-full h-full">
      <div className="flex flex-col gap-4 pt-3 px-2">
        {/* Header */}
        <div className="space-y-1 pb-3">
          <h4 className=" text-[13px] md:text-[16px] font-semibold text-neutral-800 tracking-wide capitalize">
            Capture Leads
          </h4>
          <p className="text-[11.5px] text-neutral-400 leading-relaxed">
            Capture audience data with custom lead generation forms over your
            stream.
          </p>
        </div>
      </div>
      {/* Placement */}
      <div className="space-y-1.5">
        <Label className="text-[13px] font-semibold text-neutral-700 capitalize tracking-wider mb-2">
          Placement
        </Label>
        <Select
          value={select}
          onValueChange={(e) => setSelect(e as selectType)}
        >
          <SelectTrigger className="w-full h-9 rounded-lg border border-black/8 bg-white text-[13px] text-neutral-700 shadow-none focus:ring-1 focus:ring-neutral-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-lg border border-black/8 shadow-md">
            <SelectGroup>
              {[
                { value: "before_video", label: "Before video" },
                { value: "during_video", label: "During video" },
                { value: "after_video", label: "After video" },
              ].map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-[13px] text-neutral-700 rounded-md py-1.5 px-2.5 cursor-pointer focus:bg-neutral-50"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Duration input — only when during_video */}
      {select === "during_video" && (
        <div className="rounded-lg border border-black/6 bg-neutral-50 p-3">
          <VideoDurationInput
            videoDurationInSeconds={videoAssets.duration}
            onChange={setShowAt}
          />
        </div>
      )}
      <div>
        <div className="flex items-center gap-2.5 py-2.5  rounded-lg border border-black/6 bg-transparent border-none">
          <input
            type="checkbox"
            id="skip-form"
            checked={skipForm}
            onChange={(e) => setSkipForm(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-neutral-300 accent-neutral-800 cursor-pointer"
          />
          <label
            htmlFor="skip-form"
            className="text-[12.5px] text-neutral-600 cursor-pointer select-none"
          >
            Allow people to skip the form
          </label>
        </div>
        {/* Tabs */}
        <Tabs defaultValue="fields" className="w-full">
          <TabsList className="w-full h-8 bg-black/4 rounded-lg p-0.5 gap-0.5">
            <TabsTrigger
              value="fields"
              className="flex-1 h-7 text-[12px] rounded-md data-[state=active]:bg-white data-[state=active]:text-neutral-800 data-[state=active]:shadow-sm text-neutral-400"
            >
              Form
            </TabsTrigger>
            <TabsTrigger
              value="style"
              className="flex-1 h-7 text-[12px] rounded-md data-[state=active]:bg-white data-[state=active]:text-neutral-800 data-[state=active]:shadow-sm text-neutral-400"
            >
              Style
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fields" className="mt-3">
            <FormFields fields={fields} setFields={setFields} />
          </TabsContent>

          <TabsContent value="style" className="mt-3">
            <div className="flex flex-col items-center justify-center gap-2 py-8 rounded-lg border border-dashed border-black/10">
              <span className="text-[11.5px] text-neutral-300 font-medium">
                Style options coming soon
              </span>
            </div>
          </TabsContent>
        </Tabs>
        <div className="gap-4 px-3 justify-end grida w-full grid-cols-2 border-t-[0.5px] border-[#86868661]  py-2">
          <div className="flex justify-end flex-row gap-2 w-full">
            <Button
              //  onClick={handleCancel}
              variant={"outline"}
              className="bg-main-btn h-8 px-4 text-sm bg-white font-semibold bga-white rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleupsertForm}
               disabled={videoUpsertMutate.isPending}
              className="tracking-wider h-8  bg-main-btn  capitalize px-4  font-semibold cursor-pointer border rounded-full text-xs md:text-sm transition-all duration-200"
            >
              save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaptureLeads;
