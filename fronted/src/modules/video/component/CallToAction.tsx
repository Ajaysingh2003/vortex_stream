import { Input } from "@/components/ui/input";
import React from "react";
import { useVideoContext } from "../context/VideoContext";
import { Label } from "@/components/ui/label";

function CallToAction() {
  const {
    ctaBtnText,
    ctaBtnUrl,
    setCtaBtnText,
    setCtaBtnUrl,
    ctaTitle,
    setCtaTitle,
    ctaSubTitle,
    setSubCtaTitle,
  } = useVideoContext()!;

  return (
    <div className="text-[13px] space-y-4 w-full mt-3">
      {/* Title Field */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title" className="text-gray-600 text-sm font-medium">
          Title
        </Label>
        <Input
          id="title"
          value={ctaTitle || ""}
          onChange={(e) => setCtaTitle(e.target.value)}
          placeholder="Enter title..."
          className="bg-white rounded-lg border-gray-300"
        />
      </div>

      {/* Sub Title Field */}
      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="sub-title"
          className="text-gray-600 text-sm font-medium"
        >
          Sub Title
        </Label>
        <Input
          id="sub-title"
          value={ctaSubTitle || ""}
          onChange={(e) => setSubCtaTitle(e.target.value)}
          placeholder="Enter sub title..."
          className="bg-white rounded-lg border-gray-300"
        />
      </div>

      {/* CTA Button Text Field */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="btn-text" className="text-gray-600 font-medium text-sm">
          CTA Button Text
        </Label>
        <Input
          id="btn-text"
          value={ctaBtnText || ""}
          onChange={(e) => setCtaBtnText(e.target.value)}
          placeholder="Enter button text (e.g., Learn More)"
          className="bg-white rounded-lg border-gray-300"
        />
      </div>

      {/* CTA Target URL Field */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="url" className="text-gray-600 text-sm font-medium">
          CTA Redirect URL
        </Label>
        <Input
          id="url"
          type="url"
          value={ctaBtnUrl || ""}
          onChange={(e) => setCtaBtnUrl(e.target.value)}
          placeholder="https://example.com"
          className="bg-white rounded-lg border-gray-300"
        />
      </div>
    </div>
  );
}

export default CallToAction;
