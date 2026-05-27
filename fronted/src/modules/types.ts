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