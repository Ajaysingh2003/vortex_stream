import axios from "axios";
import { cookies } from "next/headers";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const bandwidthRouter = createTRPCRouter({
  overview: protectedProcedure(["Admin", "User"]).query(async () => {
    try {
      const accessToken = (await cookies()).get("access_token")?.value;
      const response = await axios.get(
        `${process.env.BASE_API}/v1/bandwidth/overview`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new TRPCError({
          code: error.response?.status === 401 ? "UNAUTHORIZED" : "INTERNAL_SERVER_ERROR",
          message: error.response?.data?.message ?? "Unable to load bandwidth usage",
        });
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to load bandwidth usage",
      });
    }
  }),
});
