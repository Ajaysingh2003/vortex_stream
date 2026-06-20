import { Input } from "@/components/ui/input";
import React from "react";
import { useVideoContext } from "../context/VideoContext";
import { Label } from "@/components/ui/label";

function ShareButton() {
  const {
    xUrl,
    facebookUrl,
    instagramUrl,
    mail,
    linkedinUrl,
    setFacebookUrl,
    setInstagramUrl,
    setLinkedinUrl,
    setMail,
    setXUrl,
  } = useVideoContext()!;

  return (
    <div className="text-[13px] space-y-4 w-full mt-3">
      {/* X (Twitter) URL */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="x-url" className="text-gray-600 text-sm font-medium">
          X URL
        </Label>
        <Input
          id="x-url"
          type="url"
          value={xUrl || ""}
          onChange={(e) => setXUrl(e.target.value)}
          placeholder="https://x.com/username"
          className="bg-white rounded-lg border-gray-300"
        />
      </div>

      {/* Instagram URL */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="instagram-url" className="text-gray-600 text-sm font-medium">
          Instagram URL
        </Label>
        <Input
          id="instagram-url"
          type="url"
          value={instagramUrl || ""}
          onChange={(e) => setInstagramUrl(e.target.value)}
          placeholder="https://instagram.com/username"
          className="bg-white rounded-lg border-gray-300"
        />
      </div>

      {/* LinkedIn URL */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="linkedin-url" className="text-gray-600 text-sm font-medium">
          LinkedIn URL
        </Label>
        <Input
          id="linkedin-url"
          type="url"
          value={linkedinUrl || ""}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          placeholder="https://linkedin.com/in/username"
          className="bg-white rounded-lg border-gray-300"
        />
      </div>

      {/* Facebook URL */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="facebook-url" className="text-gray-600 text-sm font-medium">
          Facebook URL
        </Label>
        <Input
          id="facebook-url"
          type="url"
          value={facebookUrl || ""}
          onChange={(e) => setFacebookUrl(e.target.value)}
          placeholder="https://facebook.com/username"
          className="bg-white rounded-lg border-gray-300"
        />
      </div>

      {/* Mail Address */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mail-address" className="text-gray-600 text-sm font-medium">
          Mail Address
        </Label>
        <Input
          id="mail-address"
          type="email"
          value={mail || ""}
          onChange={(e) => setMail(e.target.value)}
          placeholder="hello@example.com"
          className="bg-white rounded-lg border-gray-300"
        />
      </div>
    </div>
  );
}

export default ShareButton;