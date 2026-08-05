
// import { parse } from 'next/dist/build/swc/generated-native'
import { parseAsString, parseAsInteger, createSearchParamsCache ,parseAsStringEnum} from 'nuqs/server'
import { createLoader } from 'nuqs'



type contentTypeEnums= "all" | "video" | "folder"
type dateTypeEnums= "any" | "today" | "7_day" | "30_days" | "this_month"
type sortTypeEnums= "created_desc" | "created_asc" | "name_asc" | "name_desc" | "size_desc"
type VisibilityTypeEnums= "all" | "private" | "public"

const contentTypeValues: contentTypeEnums[] = ['all', 'video', 'folder']
const dateTypeValues: dateTypeEnums[] = ['any', 'today', '7_day',"30_days","this_month"]
const sortTypeValues: sortTypeEnums[] = ['created_desc', 'created_asc', 'name_asc', 'name_desc', 'size_desc']
const VisibilityTypeValues: VisibilityTypeEnums[] = ['all', 'private', 'public']

export const libraryCoordinates = {
  cursor: parseAsString.withDefault(''),
  limit: parseAsInteger.withDefault(10),
  setting_scope:parseAsString.withDefault("").withOptions({clearOnDefault:true}),

  type:parseAsStringEnum<contentTypeEnums>(contentTypeValues).withDefault("all").withOptions({clearOnDefault:true}),
  date:parseAsStringEnum<dateTypeEnums>(dateTypeValues).withDefault("any").withOptions({clearOnDefault:true}),
  visibility:parseAsStringEnum<VisibilityTypeEnums>(VisibilityTypeValues).withDefault("all").withOptions({clearOnDefault:true}),
  sort:parseAsStringEnum<sortTypeEnums>(sortTypeValues).withDefault("created_asc").withOptions({clearOnDefault:true}),
}

export const loaderLibraryFilter = createSearchParamsCache(libraryCoordinates)
