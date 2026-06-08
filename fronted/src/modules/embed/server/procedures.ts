// import { generalType } from "./../../playerSettings/component/Settings";
// import { loginSchema } from "@/schema/schema";
import { baseProcedure, createTRPCRouter, getUserProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
// import { z } from "zod";
import axios from "axios";
import { cookies } from "next/headers";
import { title } from "process";
import axiosRetry from "axios-retry";
import { z } from "zod";
import { access } from "fs";
import { Readable } from "stream";

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) =>
    axiosRetry.isNetworkError(error) || (error.response?.status ?? 0) >= 500,
});
export const playerRouter = createTRPCRouter({
  getPlayerMetaData: baseProcedure.input(z.object({
    workspaceID:z.string()
  })).query(async ({input}) => {

    try {
      const res = await axios.get(
        `${process.env.BASE_API}/v1/workspace/${input.workspaceID}/player/settings`,
      );

      return res.data.data;
    } catch (error: any) {
      console.log(error?.response?.data, "error occurred");

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        let code: TRPCError["code"] = "BAD_REQUEST";

        if (status === 401) code = "UNAUTHORIZED";
        if (status === 403) code = "FORBIDDEN";
        if (status === 404) code = "NOT_FOUND";

        throw new TRPCError({
          code: code,
          message: error.response?.data?.message || "Operation failed",
        });
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong",
      });
    }
  }),
  getPlayerMetaDataServer: baseProcedure.query(async ({}) => {

    try {

      const cookieStore = await cookies();
       const workspace_id = cookieStore.get("workspace_id")?.value;


      const access_token = cookieStore.get("access_token")?.value;

      console.log(access_token,workspace_id,"leah goti")
      
      const resWorkspace = await axios.get(`${process.env.BASE_API}/v1/users/workspaces/${workspace_id}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      

      
      const workspaceData= resWorkspace.data.data


      
      const res = await axios.get(
        `${process.env.BASE_API}/v1/workspace/${workspaceData.id}/player/settings`,
      );

      return res.data.data;
    } catch (error: any) {
      console.log(error?.response?.data, "error occurred");

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        let code: TRPCError["code"] = "BAD_REQUEST";

        if (status === 401) code = "UNAUTHORIZED";
        if (status === 403) code = "FORBIDDEN";
        if (status === 404) code = "NOT_FOUND";

        throw new TRPCError({
          code: code,
          message: error.response?.data?.message || "Operation failed",
        });
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong",
      });
    }
  }),

  createVideoPlayerSettings: baseProcedure
    .input(
      z.object({
        workspace_id: z.string(),
        general: z.object({
          ctaEnabled: z.boolean(),
          autoplay: z.boolean(),
          preload: z.boolean(),
          loop: z.boolean(),
          captions: z.boolean(),
        }),
        control: z.object({
          downloadButton: z.boolean(),
          disableSeekbar: z.boolean(),
          showControls: z.boolean(),
          skipForward: z.boolean(),
          skipBackward: z.boolean(),
          fullScreen: z.boolean(),
          volume: z.boolean(),
        }),
        branding: z.object({
          logoUrl: z.string(),
          logoPosition: z.string(),
          logoWidth: z.number(),
          primaryColor: z.string(),
          accentColor: z.string(),
          iconColor: z.string(),
          backgroundColor: z.string(),
        }),
        security: z.object({
          watermarkEnabled: z.boolean(),
          watermarkTextType: z.string(),
          watermarkImage: z.string(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const cookieStore = await cookies();
        console.log(input.security,909)
        const access_token = cookieStore.get("access_token")?.value;

        const res = await axios.patch(
          `${process.env.BASE_API}/v1/workspace/${input.workspace_id}/player/settings`,
          {
            "general_settings":input.general,
            "control_settings":input.control,
            "branding_settings":input.branding,
            "security_settings":input.security,
            // "advanced_settings":input.
          },
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          },
        );

        return res.data;
      } catch (error: any) {
        console.log(error?.response?.data.message, "error occurred");

        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          let code: TRPCError["code"] = "BAD_REQUEST";

          if (status === 401) code = "UNAUTHORIZED";
          if (status === 403) code = "FORBIDDEN";
          if (status === 404) code = "NOT_FOUND";

          throw new TRPCError({
            code: code,
            message: error.response?.data.message || "Operation failed",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        });
      }
    }),
    
});
