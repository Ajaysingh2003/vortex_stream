// src/lib/searchParams.ts
import { parseAsString, parseAsInteger, createSearchParamsCache, createSerializer } from 'nuqs/server'

export const libraryCoordinates = {
  cursor: parseAsString.withDefault(''),
  limit: parseAsInteger.withDefault(1)
}

// 💡 Make sure these are using your new updated schema name:
export const loaderLibrary = createSearchParamsCache(libraryCoordinates)
export const serializeDashboardParams = createSerializer(libraryCoordinates)