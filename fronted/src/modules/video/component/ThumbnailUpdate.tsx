import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VideoAsset, WorkspaceType } from "@/modules/types";
import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import axios from "axios";
import { ExternalLink, Link, Upload } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import React, { useRef, useState } from "react";
import toast from "react-hot-toast";

function ThumbnailUpdate() {
  const trpc = useTRPC();
  const params = useParams();
  const videoId = params.id;
  const workspace = useSuspenseQuery(trpc.user.getWorkspace.queryOptions());

  const queryClient = useQueryClient();
  const workspacedata = workspace.data as WorkspaceType;

  const { data: videoData } = useSuspenseQuery(
    trpc.video.getVideoFromWorkspace.queryOptions({
      videoId: videoId as string,
      workspaceID: workspacedata.id,
    }),
  );

  const videoAssets = videoData as VideoAsset;

  const thumbnail =
    "https://pub-576a14c59513475e922c49a33696cd1f.r2.dev/" +
    videoAssets.thumbnail;

  const [previewUrl, setPreviewUrl] = useState<string | null>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // const thumbnailRef = useRef<HTMLImageElement | null>(null);

  const getSignedUrl = useMutation(trpc.upload.getSignedUrl.mutationOptions());
  const updateVideoMetaData = useMutation(
    trpc.video.UpdateVideo.mutationOptions({
      onSuccess: async () => {
        toast.success("Thumbnail Updated SuccessFully.");

        await queryClient.invalidateQueries(
          trpc.video.getVideoFromWorkspace.queryOptions({
            videoId: videoAssets.id as string,
            workspaceID: workspacedata.id,
          }),
        );
      },
      onError: (error) => {
        toast.error(error.message || "Something went wrong.");
      },
    }),
  );

  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = () => {
    setIsLoading(false);
    setPreviewUrl(null);
    setSelectedFile(null);
  };
  const handleApply = async () => {
    try {
      setIsLoading(true);
      if (!selectedFile) return;

      const dataObject = {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
      };

      const payloadData = [dataObject];

      console.log("before log");
      const signedUrl = await getSignedUrl.mutateAsync(payloadData);
      // let uploadUrl;

      const signedUrlData = signedUrl.files[0];
      if (signedUrl.success) {
        // uploadUrl = signedUrl.files[0].UploadUrl;

        const uploadRes = await axios.put(
          signedUrlData.UploadUrl,
          selectedFile,
          {
            headers: {
              "Content-Type": selectedFile.type,
            },
          },
        );

        console.log(uploadRes, "filling in the image");

        await updateVideoMetaData.mutateAsync({
          videoId: videoId as string,
          workspaceID: workspacedata.id,
          thumbnail: signedUrlData.Key,
        });

        console.log(signedUrl, "askask");

        setIsLoading(false);
      }
    } catch (error) {
      // console.log(error)
    } finally {
      setIsLoading(false);
    }
  };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileMetaData = e.target?.files?.[0];

    console.log(fileMetaData, "xuv23");
    if (fileMetaData) {
      const localUrl = URL.createObjectURL(fileMetaData);
      setPreviewUrl(localUrl);
      setSelectedFile(fileMetaData);
      // thumbnailRef.current.
    }
  };

  return (
    <div className="h-full">
      <div className="flex px-2 py-3  flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h4 className="font-subheading text-sm md:text-md lg:text-lg  font-medium">
            Upload Thumbnail
          </h4>

          <p className="text-xs font-content font-content  text-stone-500">
            Set a thumbnail for your video
          </p>
        </div>
        <div className="rounded-md">
          <div className=" relative w-full  h-56">
            <Image
              // ref={previewUrl}
              unoptimized
              src={previewUrl || thumbnail}
              className="w-full h-full rounded-lg object-contain object-center bg-white/90"
              height={100}
              width={100}
              alt="thumbnail"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div>
            <label htmlFor="upload_from_device">
              <Button
                asChild
                variant="outline"
                className={`rounded-lg w-full capitalize font-semibold cursor-pointer border px-3 py-1.5 md:py-2 text-xs md:text-sm transition-alls duration-50 ${
                  false
                    ? "bg-white/90  text-black shadow-2xs hover:bg-white/90 hover:border-zinc-200 hover:text-zinc-800"
                    : "bg-white/90 bg-main-btn text-accent shadow-2xs hover:bg-white/60 hover:border-zinc-200 hover:text-accent"
                } relative`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Upload size={16} /> Upload from device
                </span>
              </Button>
            </label>

            <Input
              type="file"
              id="upload_from_device"
              className="hidden"
              onChange={(e) => handleImageChange(e)}
            />
          </div>

          <Button
            variant={"outline"}
            className={`rounded-lg w-full flex items-center justify-center capitalize font-semibold  cursor-pointer border px-3 py-1.5 md:py-2 text-xs md:text-sm transition-all duration-200 ${
              true
                ? "bg-white/90 text-black  shadow-2xs  hover:bg-white/90  hover:border-zinc-200 hover:text-zinc-800"
                : "bg-white/90z bg-main-btn text-accent  shadow-2xs  hover:bg-white/60  hover:border-zinc-200 hover:text-accent"
            }
                       relative
                      `}
          >
            <ExternalLink /> Paste link
          </Button>
        </div>
            
      </div>

      <div className="gap-4 px-3 justify-end grida w-full grid-cols-2 border-t-[0.5px] border-[#86868661]  py-3">
        <div className="flex justify-end flex-row gap-2 w-full">
          <Button
            onClick={handleCancel}
            variant={"outline"}
            className="bg-main-btn px-4 text-sm bg-white font-semibold bga-white rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={isLoading || !selectedFile}
            className="tracking-wider  bg-main-btn  capitalize px-4  font-semibold cursor-pointer border rounded-full py-0 md:py-0 text-xs md:text-sm transition-all duration-200"
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ThumbnailUpdate;
