import {
  endScreenType,
  LeadForm,
  renameType,
  selectType,
  UploadItem,
  VideoAsset,
  VideoEndScreenType,
  // VideoEndScreenType,
  WorkspaceType,
} from "@/modules/types";

import { v4 as uuidv4 } from "uuid";
import { useTRPC } from "@/trpc/client";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { createContext, use, useContext, useState } from "react";
import toast from "react-hot-toast";
import { formFieldType } from "../component/FormFields";

type LayoutType = "left" | "center" | "right";

interface VideoContextType {
  select: selectType;
  setSelect: React.Dispatch<React.SetStateAction<selectType>>;
  fields: formFieldType[];
  setFields: React.Dispatch<React.SetStateAction<formFieldType[]>>;
  skipForm: boolean;
  setSkipForm: React.Dispatch<React.SetStateAction<boolean>>;
  showAt: number;
  setShowAt: React.Dispatch<React.SetStateAction<number>>;
  videoAssets: VideoAsset;
  workspaceData: WorkspaceType;
  layout: LayoutType;
  setLayout: React.Dispatch<React.SetStateAction<LayoutType>>;
  background: string;
  setBackground: React.Dispatch<React.SetStateAction<string>>;
  endScreen: endScreenType;
  setEndScreen: React.Dispatch<React.SetStateAction<endScreenType>>;

  ctaTitle: string;
  setCtaTitle: React.Dispatch<React.SetStateAction<string>>;
  ctaSubTitle: string;
  ctaBtnText: string;
  setCtaBtnText: React.Dispatch<React.SetStateAction<string>>;
  ctaBtnUrl: string;
  setCtaBtnUrl: React.Dispatch<React.SetStateAction<string>>;
  setSubCtaTitle: React.Dispatch<React.SetStateAction<string>>;

  //social media for end screen

  xUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  linkedinUrl: string;
  mail: string;

  setXUrl: React.Dispatch<React.SetStateAction<string>>;
  setLinkedinUrl: React.Dispatch<React.SetStateAction<string>>;
  setInstagramUrl: React.Dispatch<React.SetStateAction<string>>;
  setFacebookUrl: React.Dispatch<React.SetStateAction<string>>;
  setMail: React.Dispatch<React.SetStateAction<string>>;

  customImagePreview: string | null;
  setCustomImagePreview: React.Dispatch<React.SetStateAction<string | null>>;
  
  // custom message

  customTitle: string;
  setCustomTitle: React.Dispatch<React.SetStateAction<string>>;

  customDescription: string;
  setCustomDescription: React.Dispatch<React.SetStateAction<string>>;

  selectMoreVideo:VideoAsset[],
  setSelectMoreVideo:  React.Dispatch<React.SetStateAction<VideoAsset[]>>;
}

const videoContext = createContext<VideoContextType | null>(null);

export const VideoProvider = ({ children }: { children: React.ReactNode }) => {
  const params = useParams();
  const videoId = params.id;


  const trpc = useTRPC();

  
  const { data: leadForm } = useSuspenseQuery(
    trpc.video.getLeadForm.queryOptions({ videoId: videoId as string }),
  );


  const defaultFormFields: formFieldType[] = [
    {
      id: uuidv4(),
      label: "name",
      type: "text",
      position: 1,
    },
    {
      id: uuidv4(),
      label: "email",
      type: "text",
      position: 2,
    },
  ];

  const leadFormData = leadForm as LeadForm;
  const [select, setSelect] = useState<selectType>(
    leadFormData?.placement || "after_video",
  );
  const [fields, setFields] = useState<formFieldType[]>(
    leadFormData?.fields || defaultFormFields,
  );
  const [skipForm, setSkipForm] = useState(leadFormData?.allowSkip || false);
  const [showAt, setShowAt] = useState<number>(leadFormData?.showAt ?? 0);

  const [layout, setLayout] = useState<LayoutType>("center");

  const [background, setBackground] = useState("#e8eff457");

  const workspace = useSuspenseQuery(trpc.user.getWorkspace.queryOptions());
  const workspacedata = workspace.data as WorkspaceType;



  const { data: videoEnd } = useSuspenseQuery(
    trpc.video.get_end_screen.queryOptions({ videoId: videoId as string,workspaceId: workspacedata.id }),
  );


  const videoEndScreen=videoEnd as VideoEndScreenType

  

  const { data: videoData } = useSuspenseQuery(
    trpc.video.getVideoFromWorkspace.queryOptions({
      videoId: videoId as string,
      workspaceID: workspacedata.id,
    }),
  );



  const videoAssets = videoData as VideoAsset;

  const [ctaTitle, setCtaTitle] = useState<string>(videoEndScreen?.payload?.cta_title ?? "");

  const [ctaSubTitle, setSubCtaTitle] = useState<string>(videoEndScreen?.payload?.cta_sub_title ?? "");

  const [ctaBtnText, setCtaBtnText] = useState<string>(videoEndScreen?.payload?.cta_btn_title ?? "");

  const [ctaBtnUrl, setCtaBtnUrl] = useState<string>( videoEndScreen?.payload?.cta_btn_url ?? "");




  const [xUrl, setXUrl] = useState<string>(videoEndScreen?.payload?.x_url ?? "");
  const [instagramUrl, setInstagramUrl] = useState<string>( videoEndScreen?.payload?.instagram_url ?? "");
  const [facebookUrl, setFacebookUrl] = useState<string>(videoEndScreen?.payload?.facebook_url ?? "");
  const [mail, setMail] = useState<string>(videoEndScreen?.payload?.x_url ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState<string>( videoEndScreen?.payload?.Linkedin_url ?? "");

  const [customImagePreview, setCustomImagePreview] = useState<string | null>(
    videoEndScreen?.payload?.url ??
    null,
  );

  const [customTitle, setCustomTitle] = useState<string>(videoEndScreen?.payload.custom_title ??"");
  const [customDescription, setCustomDescription] = useState<string>(videoEndScreen?.payload?.custom_description ?? "");
  const [selectMoreVideo,setSelectMoreVideo]=useState<VideoAsset[]>([])
  const [endScreen, setEndScreen] = useState<endScreenType>( videoEndScreen?.type ?? "empty");

  return (
    <videoContext.Provider
      value={{
        selectMoreVideo,

        setSelectMoreVideo,
        customDescription,
        customTitle,
        setCustomDescription,
        setCustomTitle,
        customImagePreview,
        setCustomImagePreview,
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

        ctaBtnText,
        ctaBtnUrl,
        ctaSubTitle,
        ctaTitle,
        setCtaBtnText,
        setCtaBtnUrl,
        setSubCtaTitle,
        setCtaTitle,
        endScreen,
        setEndScreen,
        select,
        setSelect,
        fields,
        setFields,
        skipForm,
        setSkipForm,
        showAt,
        setShowAt,
        videoAssets,
        workspaceData: workspacedata,
        background,
        setBackground,
        layout,
        setLayout,
      }}
    >
      {children}
    </videoContext.Provider>
  );
};

export const useVideoContext = () => {
  const context = useContext(videoContext);

  return context;
};
