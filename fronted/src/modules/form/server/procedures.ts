import axios from "axios";
import { cookies } from "next/headers";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, getUserProcedure } from "@/trpc/init";

export const formRouter = createTRPCRouter({
  getOverview: getUserProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const accessToken = (await cookies()).get("access_token")?.value;
        const response = await axios.get(
          `${process.env.BASE_API}/v1/workspace/${input.workspaceId}/forms/overview`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        return response.data.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          let code: TRPCError["code"] = "BAD_REQUEST";

          if (status === 401) code = "UNAUTHORIZED";
          if (status === 403) code = "FORBIDDEN";
          if (status === 404) code = "NOT_FOUND";

          throw new TRPCError({
            code,
            message: error.response?.data?.message || "Unable to load form overview",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to load form overview",
        });
      }
    }),
});
