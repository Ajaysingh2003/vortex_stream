
import { createLoader } from 'nuqs'
import { parseAsString, parseAsInteger, createSearchParamsCache } from 'nuqs/server'

export const libraryCoordinates = {
  cursor: parseAsString.withDefault(''),
  limit: parseAsInteger.withDefault(10),

  setting_scope:parseAsString.withDefault("").withOptions({clearOnDefault:true})
}

export const loaderLibraryFilter = createSearchParamsCache(libraryCoordinates)