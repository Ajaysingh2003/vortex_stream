import { baseProcedure, createTRPCRouter, getUserProcedure, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import axios from "axios";
import { cookies } from "next/headers";

import { z } from "zod";

export const videoRouter = createTRPCRouter({
  getVideo: baseProcedure
    .input(
      z.object({
        videoId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        // console.log(`${process.env.BASE_API}/v1/video/`);
        const res = await axios.post(
          `${process.env.BASE_API}/v1/video/${input.videoId}`,
          {
            ...input,
          },
          {
            withCredentials: true,
          },
        );

        console.log(res.data, "res");
        return res.data;
        
      } catch (error: any) {
        console.log(error.response)
        console.log(error?.response?.data, "error occurred");

  if (axios.isAxiosError(error)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.response?.data?.message || "Login failed",
      cause: error.response?.data,
    });
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Something went wrong",
  });
      }
    }),
  
  profile:protectedProcedure(["Admin,User"]).query(async({ctx})=>{
    try {
      console.log(ctx.user)
      return ctx.user
    } 
    catch (error:any) {
        console.log(error?.response?.data, "error occurred");

  if (axios.isAxiosError(error)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.response?.data?.message || "Login failed",
      cause: error.response?.data,
    });
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Something went wrong",
  });
    }

  }),
  updateName:getUserProcedure.input(z.object({
    folderID:z.string().optional(),
    name:z.string(),
    workspaceID:z.string(),
    videoID:z.string()
  })).mutation((async({ctx,input})=>{
    try {
        const cookieStore = await cookies();

        const access_token = cookieStore.get("access_token")?.value;
        
        const res = await axios.patch(
          `${process.env.BASE_API}/v1/video/${input.videoID}/update/name`,
          {
            "title":input.name,
            "workspaceId":input.workspaceID,
            "folderId":input.folderID
          },
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          },
        );

        console.log(res.data)

        return res.data;
        } catch (error: any) {
        console.log(error?.response?.data, "error");

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
  }))

});
