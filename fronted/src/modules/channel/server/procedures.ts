import axios from "axios";
import { cookies } from "next/headers";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, createTRPCRouter } from "@/trpc/init";

const channelId = z.object({ channelId: z.string().uuid() });
const channelCreate = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().trim().min(1).max(255),
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
      message: error.response?.data?.message ?? "Channel operation failed",
      cause: error.response?.data,
    });
  }
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Channel operation failed",
  });
}
export const channelRouter = createTRPCRouter({
  list: protectedProcedure(["Admin", "User"]).query(async () => {
    try {
      return (
        await axios.get(`${process.env.BASE_API}/v1/channels`, await config())
      ).data;
    } catch (error) {
      return fail(error);
    }
  }),
  get: protectedProcedure(["Admin", "User"])
    .input(channelId)
    .query(async ({ input }) => {
      try {
        return (
          await axios.get(
            `${process.env.BASE_API}/v1/channels/${input.channelId}`,
            await config(),
          )
        ).data;
      } catch (error) {
        return fail(error);
      }
    }),
  create: protectedProcedure(["Admin", "User"])
    .input(channelCreate)
    .mutation(async ({ input }) => {
      try {
        return (
          await axios.post(
            `${process.env.BASE_API}/v1/channels`,
            input,
            await config(),
          )
        ).data;
      } catch (error) {
        return fail(error);
      }
    }),
  update: protectedProcedure(["Admin", "User"])
    .input(channelId.extend({ name: z.string().trim().min(1).max(255) }))
    .mutation(async ({ input }) => {
      try {
        return (
          await axios.patch(
            `${process.env.BASE_API}/v1/channels/${input.channelId}`,
            { name: input.name },
            await config(),
          )
        ).data;
      } catch (error) {
        return fail(error);
      }
    }),
  remove: protectedProcedure(["Admin", "User"])
    .input(channelId)
    .mutation(async ({ input }) => {
      try {
        return (
          await axios.delete(
            `${process.env.BASE_API}/v1/channels/${input.channelId}`,
            await config(),
          )
        ).data;
      } catch (error) {
        return fail(error);
      }
    }),
  listVideos: protectedProcedure(["Admin", "User"])
    .input(channelId)
    .query(async ({ input }) => {
      try { return (await axios.get(`${process.env.BASE_API}/v1/channels/${input.channelId}/videos`, await config())).data; }
      catch (error) { return fail(error); }
    }),
  addVideo: protectedProcedure(["Admin", "User"])
    .input(channelId.extend({ videoId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      try { return (await axios.post(`${process.env.BASE_API}/v1/channels/${input.channelId}/videos/${input.videoId}`, {}, await config())).data; }
      catch (error) { return fail(error); }
    }),
  removeVideo: protectedProcedure(["Admin", "User"])
    .input(channelId.extend({ videoId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      try { return (await axios.delete(`${process.env.BASE_API}/v1/channels/${input.channelId}/videos/${input.videoId}`, await config())).data; }
      catch (error) { return fail(error); }
    }),
});
