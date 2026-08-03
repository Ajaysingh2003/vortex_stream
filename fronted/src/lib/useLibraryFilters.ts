import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";





type contentTypeEnums= "all" | "video" | "folder"
type dateTypeEnums= "any" | "today" | "7_day" | "30_days" | "this_month"
type sortTypeEnums= "created_desc" | "created_asc" | "name_asc" | "name_desc" | "size_desc"
type VisibilityTypeEnums= "all" | "private" | "public"

const contentTypeValues: contentTypeEnums[] = ['all', 'video', 'folder']
const dateTypeValues: dateTypeEnums[] = ['any', 'today', '7_day',"30_days","this_month"]
const sortTypeValues: sortTypeEnums[] = ['created_desc', 'created_asc', 'name_asc', 'name_desc', 'size_desc']
const VisibilityTypeValues: VisibilityTypeEnums[] = ['all', 'private', 'public']


const params = {
  cursor: parseAsString
    .withDefault("")
    .withOptions({ clearOnDefault: true }),
  limit: parseAsInteger
    .withDefault(10)
    .withOptions({ clearOnDefault: true }),

  setting_scope:parseAsString.withDefault("").withOptions({clearOnDefault:true}),




  type:parseAsStringEnum<contentTypeEnums>(contentTypeValues).withDefault("all").withOptions({clearOnDefault:true}),
  date:parseAsStringEnum<dateTypeEnums>(dateTypeValues).withDefault("any").withOptions({clearOnDefault:true}),
  Visibility:parseAsStringEnum<VisibilityTypeEnums>(VisibilityTypeValues).withDefault("all").withOptions({clearOnDefault:true}),
  sort:parseAsStringEnum<sortTypeEnums>(sortTypeValues).withDefault("created_asc").withOptions({clearOnDefault:true}),
}

export const useLibraryFilters = () => {
  return useQueryStates(params);
};