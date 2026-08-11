import axios from "axios";
import { cookies } from "next/headers";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, createTRPCRouter } from "@/trpc/init";

const input = z.object({ videoId: z.string().uuid() });
const listInput = z.object({
  workspaceID: z.string().uuid(),
  limit: z.number().default(10),
  cursor: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  visibility: z.string().nullable().optional(),
  sort: z.string().nullable().optional(),
});
async function config() {
  const token = (await cookies()).get("access_token")?.value;
  return {
    withCredentials: true,
    headers: { Authorization: `Bearer ${token}` },
  };
}
function fail(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const code: TRPCError["code"] =
      status === 401
        ? "UNAUTHORIZED"
        : status === 403
          ? "FORBIDDEN"
          : status === 404
            ? "NOT_FOUND"
            : "BAD_REQUEST";
    throw new TRPCError({
      code,
      message: error.response?.data?.message ?? "Favorite operation failed",
      cause: error.response?.data,
    });
  }
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Favorite operation failed",
  });
}
export const favoriteRouter = createTRPCRouter({
  list: protectedProcedure(["Admin", "User"]).input(listInput).query(async ({ input }) => {
    try {
      const params = new URLSearchParams({
        workspaceID: input.workspaceID,
        limit: String(input.limit),
        ...(input.cursor ? { cursor: input.cursor } : {}),
        ...(input.type ? { type: input.type } : {}),
        ...(input.date ? { date: input.date } : {}),
        ...(input.visibility ? { visibility: input.visibility } : {}),
        ...(input.sort ? { sort: input.sort } : {}),
      });
      return (
        await axios.get(
          `${process.env.BASE_API}/v1/favorites/videos?${params.toString()}`,
          await config(),
        )
      ).data.data;
    } catch (error) {
      return fail(error);
    }
  }),
  status: protectedProcedure(["Admin", "User"])
    .input(input)
    .query(async ({ input }) => {
      try {
        return (
          await axios.get(
            `${process.env.BASE_API}/v1/favorites/videos/${input.videoId}/status`,
            await config(),
          )
        ).data;
      } catch (error) {
        return fail(error);
      }
    }),
  add: protectedProcedure(["Admin", "User"])
    .input(input)
    .mutation(async ({ input }) => {
      try {
        return (
          await axios.post(
            `${process.env.BASE_API}/v1/favorites/videos/${input.videoId}`,
            {},
            await config(),
          )
        ).data;
      } catch (error) {
        return fail(error);
      }
    }),
  remove: protectedProcedure(["Admin", "User"])
    .input(input)
    .mutation(async ({ input }) => {
      try {
        return (
          await axios.delete(
            `${process.env.BASE_API}/v1/favorites/videos/${input.videoId}`,
            await config(),
          )
        ).data;
      } catch (error) {
        return fail(error);
      }
    }),
});
