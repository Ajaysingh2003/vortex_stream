import EmbedView from "@/modules/embed/view/EmbedView";
import { VideoAsset } from "@/modules/types";
import axios from "axios";
import { headers } from "next/headers";

export default async function Page({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;
  let video: VideoAsset | null = null;
  let forbidden = false;

  try {
    const requestHeaders = await headers();
    const referer = requestHeaders.get("referer");
    const response = await axios.get(
      `${process.env.BASE_API}/v1/video/${videoId}`,
      {
        headers: referer ? { Referer: referer } : undefined,
      },
    );
    video = response.data.data as VideoAsset;
  } catch (error) {
    forbidden = axios.isAxiosError(error) && error.response?.status === 403;
  }

  if (!video) {
    return (
      <main className="flex h-screen w-full items-center justify-center bg-black/90 p-6 text-center text-white">
        <div>
          <h1 className="text-lg font-semibold">
            {forbidden ? "This video cannot be embedded here" : "Video unavailable"}
          </h1>
          <p className="mt-2 text-sm text-white/60">
            {forbidden
              ? "The video owner has limited playback to specific domains."
              : "This video could not be loaded."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-transparent">
      <EmbedView asset={video} />
    </div>
  );
}
