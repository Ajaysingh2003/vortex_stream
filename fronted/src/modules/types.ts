import { IconSvgElement } from "@hugeicons/react"
import { UPLOADPROVIDER } from "./constant"

export interface WorkspaceType {
    id : string
    name:string
    userId:string
    isDefault:boolean
    createdAt:string
    updatedAt:string
}

export interface RootFolderDataType{
  id:string
  name:string
  workspaceID:string
  parentId:null
  position:number
  createdAt:string
  updatedAt:string
}

export interface FolderDataType{
  id:string
  name:string
  workspaceID:string
  parentId:null | string
  position:number
  createdAt:string
  updatedAt:string
}

export type ProviderType = "wistia" | "vimeo" | "dropbox" | "onedrive" | "google_drive";

export type GooglePickerFile = {
    id: string
    name: string
    mimeType: string
    url: string
    sizeBytes: number
}

type UploadStatus =
  | "queued"
  | "uploading"
  | "paused"
  | "done"
  | "error"
  | "cancelled"
  | "TRANSCODING"


export interface UploadItem {
  id: string;
  file: File & {duration?:number};
  status: UploadStatus;
  progress: number;
  uploadedBytes: number;
  speed: number;
  eta: number;
  errorMessage?: string;
  key?: string;
  startedAt?: number;
  xhr?: XMLHttpRequest;
  chunkOffset: number;
  uploadType: UPLOADPROVIDER,
  googleToken?:string
}


export interface UserType{
  id : string
  avatar:string
  name:string
  email:string
  createdAt:string
  updatedAt:string
  role:string
  isActive:boolean
}


export interface LibraryType{
  id:string
  thumbnailUrl?:string
  name:string
  type:"video" | "folder"
  duration?:number
  childCount?:number
  parentId?:string
  createdAt:string
  position?:number
}

export interface LibraryContentType {
  items:LibraryType[]
  metadata:{
    hasNextPage:boolean
    total:number
    nextCursor:string
  }
}


export interface FolderType{
  id:string
  name:string
  workspaceId:string
  parentId:string | null
  position:number
  createdAt:string
  updatedAt:string
}


export type renameType={
    id:string
    assetType:"video" | "folder"
    oldName:string
    newName:string | undefined
}



export type BillingCycleType = 'monthly' | 'quarterly' | 'annually';
export type PlanTierType = 'free' | 'starter' | 'pro' | 'business';
// export type HLSQualityType = '360p' | '480p' | '720p' | '1080p';

export interface PlanBillingDetails {
  price_id: string; // Will be an empty string for the free tier
  amount: number;   // Base price unit (e.g., in dollars or local base denomination)
}

// export interface PlanLimits {
//   Name: string;
//   MaxStorageBytes: number;
//   MaxBandwidthBytes: number;
//   MaxPlaybackMinutes: number;
//   MaxWorkspaces: number;
//   AllowCustomBranding: boolean;
//   AllowSubtitles: boolean;
//   Analytics: boolean;
//   HLSQualities: HLSQualityType[];
// }

export interface PlanConfig {
  name: string;
  description: string;
  // Use Partial because the 'free' tier configuration only contains a 'monthly' key
  billing_cycles: Record<BillingCycleType, PlanBillingDetails>;
  // Limits: PlanLimits;
}

// This represents the entire structural map returned by your Go backend
export type BillingConfigResponse = Record<PlanTierType, PlanConfig>;



export interface FeatureItem {
  label: string;       
  icon: IconSvgElement;     
  // unit?: 'workspace' | 'mb' | 'gb' | 'hours';
  // icon: 'WorkIcon' | 'DatabaseIcon' | 'PlayIcon' | 'TransferIcon';
}


export type VideoResolutionType={

  id:string;
  video_id:string;
  resolution:string;
  playlist_path:string;
  size:null;
  created_at:string

}


export interface VideoAsset {
  id: string;
  title: string;
  videoKey: string;
  size: number;
  duration: number;
  isPrivate: boolean;
  status: string;
  thumbnail: string;
  masterKey: string;
  resolutions: VideoResolutionType[]; 
  folderId: string | null;
  WorkspaceId: string;
  createdAt: string;
  updatedAt: string; 
  
}



export interface VideoPlayerMetaData{
  id:string,
  workspaceId:string,
  general_settings:generalType,
  control_settings:controlsType,
  branding_settings:brandingType,
  security_settings:securityType,
  advanced_settings:any
}





















export type generalType = {
  ctaEnabled: boolean;
  autoplay: boolean;
  preload: boolean;
  loop: boolean;
  captions: boolean;
};

export type controlsType = {
  downloadButton: boolean;
  disableSeekbar: boolean;
  showControls: boolean;
  skipForward: boolean;
  skipBackward: boolean;
  fullScreen: boolean;
  volume: boolean;
  playbackRate: boolean;
  pipButton: boolean;
  muteButton: boolean;
};

export type brandingType = {
  logoUrl: string;
  logoPosition: string;
  logoWidth: number;
  primaryColor: string;
  accentColor: string;
  iconColor: string;
  backgroundColor: string;
};

export type securityType = {
  watermarkEnabled: boolean;
  watermarkTextType: "viewer_email" | "viewer_ip" | "none";
  watermarkImage: string;
};

export type ctaType = {
  ctaEnabled: boolean;
  timeTrigger: number;
  heading: string;
  buttonText: string;
  redirectUrl: string;
};

export type VideoPlayerSettings = {
  general: generalType;
  controls: controlsType;
  branding: brandingType;
  security: securityType;
  cta?: ctaType;
};

// {
//     cta?: ctaType;
//     captions?: CaptionTrack[];
//     viewerEmail?: string;
//     viewerIp?: string;
//     signedDownloadUrl?: string;
//   } | null;

export interface VideoPlayerMetaData {
  id: string;
  workspaceId: string;
  general_settings: generalType;
  control_settings: controlsType;
  branding_settings: brandingType;
  security_settings: securityType;
  advanced_settings: any
}

type CaptionTrack = {
  src: string;
  label: string;
  srcLang: string;
  default?: boolean;
};

export type PlayerSource = {
  label: string;
  src: string;
  type?: "video/mp4" | "application/x-mpegURL";
};

export type ProductionVideoPlayerProps = {
  asset: VideoAsset;
  player: VideoPlayerMetaData;
  cdnBaseUrl: string;
  className?: string;
  onProgress?: (payload: { videoId: string; currentTime: number }) => void;
  onEnded?: (payload: { videoId: string }) => void;
};

