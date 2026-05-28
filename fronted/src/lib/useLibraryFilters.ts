import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";

const params = {
  cursor: parseAsString
    .withDefault("")
    .withOptions({ clearOnDefault: true }),
  limit: parseAsInteger
    .withDefault(10)
    .withOptions({ clearOnDefault: true }),

}

export const useLibraryFilters = () => {
  return useQueryStates(params);
};