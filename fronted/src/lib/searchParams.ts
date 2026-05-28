
import { createLoader } from 'nuqs'
import { parseAsString, parseAsInteger, createSearchParamsCache } from 'nuqs/server'

export const libraryCoordinates = {
  cursor: parseAsString.withDefault(''),
  limit: parseAsInteger.withDefault(10)
}

export const loaderLibraryFilter = createSearchParamsCache(libraryCoordinates)