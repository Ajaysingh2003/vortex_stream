import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Or use a standard textarea styled with tailwind
import React from "react";
import { useVideoContext } from "../context/VideoContext";

function CustomMessage() {
  const {
    customTitle,
    customDescription,
    setCustomTitle,
    setCustomDescription,
  } = useVideoContext()!;

  return (
    <div className="text-[13px] space-y-4 w-full mt-3">
      {/* Title Field */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="custom-title" className="text-gray-600  text-sm font-medium">
          Header Title
        </Label>
        <Input
          id="custom-title"
          type="text"
          value={customTitle || ""}
          onChange={(e) => setCustomTitle(e.target.value)}
          placeholder="Enter header title..."
          className="bg-white rounded-lg border-gray-300"
        />
      </div>

      {/* Description Field */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="custom-description" className="text-gray-600 text-sm font-medium">
          Description Message
        </Label>
        <Textarea
          id="custom-description"
          value={customDescription || ""}
          onChange={(e) => setCustomDescription(e.target.value)}
          placeholder="Enter message description..."
          className="bg-white rounded-lg border-gray-300 min-h-[100px] focus-visible:ring-0 resize-none"
        />
      </div>
    </div>
  );
}

export default CustomMessage;