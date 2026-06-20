import {
  endScreenType,
  LeadForm,
  renameType,
  selectType,
  UploadItem,
  VideoAsset,
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

  // custom image

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
  const [endScreen, setEndScreen] = useState<endScreenType>("empty");

  const [layout, setLayout] = useState<LayoutType>("center");

  const [background, setBackground] = useState("#e8eff457");

  const workspace = useSuspenseQuery(trpc.user.getWorkspace.queryOptions());
  const workspacedata = workspace.data as WorkspaceType;

  const { data: videoData } = useSuspenseQuery(
    trpc.video.getVideoFromWorkspace.queryOptions({
      videoId: videoId as string,
      workspaceID: workspacedata.id,
    }),
  );

  const videoAssets = videoData as VideoAsset;

  const [ctaTitle, setCtaTitle] = useState<string>("");
  const [ctaSubTitle, setSubCtaTitle] = useState<string>("");

  const [ctaBtnText, setCtaBtnText] = useState<string>("");
  const [ctaBtnUrl, setCtaBtnUrl] = useState<string>("");

  const [xUrl, setXUrl] = useState<string>("");
  const [instagramUrl, setInstagramUrl] = useState<string>("");
  const [facebookUrl, setFacebookUrl] = useState<string>("");
  const [mail, setMail] = useState<string>("");
  const [linkedinUrl, setLinkedinUrl] = useState<string>("");

  const [customImagePreview, setCustomImagePreview] = useState<string | null>(
    null,
  );

  const [customTitle, setCustomTitle] = useState<string>("");
  const [customDescription, setCustomDescription] = useState<string>("");
  const [selectMoreVideo,setSelectMoreVideo]=useState<VideoAsset[]>([])
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
