import React from "react";
import { securityType, useSetting } from "./Settings";
import {
  Copyright,
  ImageUp,
  LayoutTemplate,
  Stamp,
  Sticker,
  Upload,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ItemRow from "./ItemRow";

function Security() {
  const { playerSettings, setPlayerSettings } = useSetting()!;

  const handleAdvanceChange = <K extends keyof securityType>(
    key: K,
    value: securityType[K],
  ) => {
    setPlayerSettings((prev) => ({
      ...prev,
      security: {
        ...prev.security,
        [key]: value,
      },
    }));
  };

  return (
    <div className="w-full h-full ">
      <div className="flex flex-col gap-2 md:gap-2 px-3 pt-2 pb-1">
        <div className="heading">
          <h3 className="font-heading font-semibold text-md lg:text-md tracking-wide">
            Security Setting
          </h3>
        </div>

        <div className="w-full flex flex-col gap-2 md:gap-3">
          <section className="w-full border-b-[0.5px] border-stone-200">
            <ItemRow
              icon={<Stamp />}
              checked={playerSettings.security.watermarkEnabled}
              label={"enable watermark"}
              description="Enable watermark on your video"
              onChange={(checked) =>
                handleAdvanceChange("watermarkEnabled", checked)
              }
            />
          </section>

          <section className="w-full border-b-[0.5px] border-stone-200">
            <div className="w-full grid grid-cols-[40px_1fr_auto] pb-3 gap-3">
              <div className="flex items-center justify-center">
                <div className="bg-stone-100  rounded-md px-2 py-2">
                  <ImageUp />
                </div>
              </div>
              <div className=" flex items-scenter justify-center  flex-col space-y-0.5 ">
                <h3 className="text-[14px] font-medium text-stone-800 capitalize leading-none">
                  watermark image
                </h3>
                <p className=" capitalize text-stone-500 text-[13px] leading-relaxed">
                  water mark for the video
                </p>
              </div>
              <div className=" flex items-center justify-center  ">
                <label htmlFor="watermark-image">
                  <div
                    // role="button"
                    className="bg-mutedz text-sm text-accent border-black/30 border-[0.5px] text-center rounded-md px-3 h-8 bg-stone-40 gap-2 flex items-center justify-center font-medium animate cursor-pointer"
                  >
                    <Upload className="size-4" />
                    Upload
                  </div>
                </label>
                <Input
                  id="watermark-image"
                  type="file"
                  hidden
                  className="w-36 placeholder:text-black h-8 rounded-md shadow-none"
                  placeholder="logo url"
                />
              </div>
            </div>
          </section>
          <section className="w-full border-b-[0.5px] border-stone-200">
            <div className="w-full grid grid-cols-[40px_1fr_auto] pb-3 gap-3">
              <div className="flex items-center justify-center">
                <div className="bg-stone-100  rounded-md px-2 py-2">
                  <LayoutTemplate />
                </div>
              </div>
              <div className=" flex items-scenter justify-center  flex-col space-y-0.5 ">
                <h3 className="text-[14px] font-medium text-stone-800 capitalize leading-none">
                  Watermark Text Type
                </h3>
                <p className=" capitalize text-stone-500 text-[13px] leading-relaxed">
                  watermark text on the video
                </p>
              </div>
              <div className=" flex items-center justify-center  ">
                <Select
                  value={playerSettings.security.watermarkTextType}
                  onValueChange={(e:"viewer_email" | "viewer_ip" | "none") => {
                    handleAdvanceChange("watermarkTextType",e)
                  }}
                >
                  <SelectTrigger className="w-[150px] rounded-md max-h-8">
                    <SelectValue  />
                  </SelectTrigger>
                  <SelectContent
                    side="top"
                    sideOffset={64}
                    className="rounded-md  shadow-none"
                  >
                    <SelectGroup className="rounded-md">
                      <SelectItem
                        className="py-1 rounded-md hover:bg-stone-100"
                        value="none"
                      >
                        None
                      </SelectItem>
                      <SelectItem
                        className="py-1 rounded-md hover:bg-stone-100"
                        value="viewer_email"
                      >
                        Viewer Email
                      </SelectItem>
                      <SelectItem
                        className="py-1 rounded-md hover:bg-stone-100"
                        value="viewer_ip"
                      >
                        Viewer Ip
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Security;
