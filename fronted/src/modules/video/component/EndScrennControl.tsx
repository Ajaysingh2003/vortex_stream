import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  endScreenType,
  VideoEndScreenType,
  WorkspaceType,
} from "@/modules/types";
import { useVideoContext } from "../context/VideoContext";
import EndScreenOption from "./EndScreenOption";
import { Button } from "@/components/ui/button";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";

function EndScreenControl() {
  const trpc = useTRPC();
  const {
    selectMoreVideo,
    ctaTitle,
    ctaBtnText,
    ctaBtnUrl,
    ctaSubTitle,
    endScreen,
    customTitle,
    customDescription,
    instagramUrl,
    xUrl,
    linkedinUrl,
    facebookUrl,
    mail,
    customImagePreview,
    setEndScreen,
    setCtaBtnText,
    setCtaBtnUrl,
    setSubCtaTitle,
    setCtaTitle,
    setFacebookUrl,
    setInstagramUrl,
    setLinkedinUrl,
    setMail,
    setXUrl,
    setCustomImagePreview,
    setCustomDescription,
    setCustomTitle,
    setSelectMoreVideo,
  } = useVideoContext()!;

  const params = useParams();

  const videoId = params.id as string;

  const { data: workspace } = useSuspenseQuery(
    trpc.user.getWorkspace.queryOptions(),
  );
  const workspaceData = workspace as WorkspaceType;

  const endScreenLabels: Record<endScreenType, string> = {
    more_video: "More Videos",
    cta_action: "Call To Action",
    custom_image: "Custom Image",
    share_button: "Share Button",
    custom_message: "Custom Message",
    empty: "None (Empty)",
  };

  const { data: videoEnd } = useSuspenseQuery(
    trpc.video.get_end_screen.queryOptions({ workspaceId: workspaceData.id ,videoId:videoId}),
  );

  const videoEndScreen = videoEnd as VideoEndScreenType;

  const valueChange = (value: endScreenType) => {
    setSelectMoreVideo([]);

    setCtaTitle(videoEndScreen?.payload?.cta_title ?? "");
    setSubCtaTitle(videoEndScreen?.payload?.cta_sub_title ?? "");
    setCtaBtnText(videoEndScreen?.payload?.cta_btn_title ?? "");
    setCtaBtnUrl(videoEndScreen?.payload?.cta_btn_url ?? "");

    setCustomImagePreview(videoEndScreen?.payload?.url ?? "");

    setXUrl(videoEndScreen?.payload?.x_url ?? "");
    setFacebookUrl(videoEndScreen?.payload?.facebook_url ?? "");
    setInstagramUrl(videoEndScreen?.payload?.instagram_url ?? "");
    setLinkedinUrl(videoEndScreen?.payload?.Linkedin_url ?? "");
    setMail(videoEndScreen?.payload?.mail_url ?? "");

    setCustomTitle(videoEndScreen?.payload?.custom_title ?? "");
    setCustomDescription(videoEndScreen?.payload?.custom_description ?? "");

    setEndScreen(value as endScreenType);
  };

  const queryClient = useQueryClient();
  const mutate = useMutation(
    trpc.video.end_screen.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          await trpc.video.get_end_screen.queryOptions({
            workspaceId: workspaceData.id,
            videoId: videoId,
          }),
        );
        toast.success("End Screen Setting Saved.");
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),

  );

  const moreVideo = selectMoreVideo.map((e) => e.id);

  const deleteMutate=useMutation(trpc.video.delete_screen.mutationOptions({
    onSuccess:()=>{
      toast.success("End Screen removed")
    },
    onError:(err)=>{
      toast.error(err.message || "Something went wrong.")
    }
  }))
  


  const handleSubmit = async () => {
    if (endScreen == "empty") {
      await deleteMutate.mutateAsync({workspaceId:workspaceData.id,videoId})
      setSelectMoreVideo([])
      return;
    }

    if (endScreen ==="custom_image") {

      // const res = await getSignedUrl?.files(files:{});

      
      // return 
    }

    const validationRules: Record<
      string,
      { isValid: boolean; message: string }
    > = {
      call_to_action: {
        isValid: !!(ctaTitle && ctaSubTitle && ctaBtnUrl),
        message:
          "Please fill out all Call-to-Action fields (Title, Subtitle, and Button URL).",
      },
      custom_message: {
        isValid: !!(customTitle && customDescription),
        message:
          "Please enter both a Title and a Description for your custom message.",
      },
      custom_image: {
        isValid: !!customImagePreview,
        message: "Please upload or select an image before saving.",
      },
      share_button: {
        isValid: !!(instagramUrl || xUrl || linkedinUrl || mail || facebookUrl),
        message: "Please provide at least one social media configuration link.",
      },
      more_video: {
        isValid: !!(moreVideo && moreVideo.length > 0),
        message: "Please select at least one video asset to display.",
      },
    };

    const rule = validationRules[endScreen];
    if (rule && !rule.isValid) {
      toast.error(rule.message);
      return;
    }
    await mutate.mutateAsync({
      type: endScreen,
      videoId: videoId,
      workspaceId: workspaceData.id,
      ...(endScreen == "cta_action" && {
        cta_action: {
          cta_title: ctaTitle,
          cta_btn_title: ctaBtnText,
          cta_btn_url: ctaBtnUrl,
          cta_sub_title: ctaSubTitle,
        },
      }),
      ...(endScreen == "custom_message" && {
        custom_message: {
          custom_title: customTitle,
          custom_description: customDescription,
        },
      }),
      ...(endScreen == "share_button" && {
        share_button: {
          instagram_url: instagramUrl,
          x_url: xUrl,
          Linkedin_url: linkedinUrl,
          mail_url: mail,
          facebook_url: facebookUrl,
        },
      }),
      ...(endScreen == "custom_image" && {
        custom_image: customImagePreview ?? "",
      }),

      ...(endScreen == "more_video" && { more_videos: moreVideo }),
    });
  };

  return (
    <div className="w-full h-full">
      <div className="px-4 pt-3 pb-2">
        <h3 className="text-black/80 text-sm font-heading tracking-wide">
          Select End Screen Type
        </h3>
      </div>

      <div className="px-2 py-2">
        <Select
          value={endScreen}
          onValueChange={(value) => valueChange(value as endScreenType)}
        >
          <SelectTrigger className="w-full bg-transparent focus-visible:ring-0  rounded-lg h-10 border border-gray-200 shadow-2xs px-3">
            <SelectValue placeholder="Select end screen type..." />
          </SelectTrigger>
          <SelectContent
            align="center"
            position="popper"
            className="rounded-lg bg-white  shadow-md"
          >
            <SelectGroup>
              {Object.entries(endScreenLabels).map(([key, label]) => (
                <SelectItem
                  key={key}
                  value={key}
                  className="capitalize text-accent py-1.5 focus-within:bg-black/5  rounded-lg hover:bg-black/5 text-[13px] focus-visible:bg-black/5"
                >
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <div className="w-full mt-2">
          <EndScreenOption />
        </div>
      </div>
      <div className="border-t-[1px] py-2 px-2 mt-2 border-black/5">
        <div className="flex justify-end flex-row gap-2 w-full">
          <Button
            onClick={handleSubmit}
            disabled={mutate.isPending}
            className="tracking-wider h-8  bg-main-btn  capitalize px-3 text-xs  font-semibold cursor-pointer border rounded-full md:text-sm transition-all duration-200"
          >
            save
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EndScreenControl;
