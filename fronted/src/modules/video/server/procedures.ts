import {
  baseProcedure,
  createTRPCRouter,
  getUserProcedure,
  protectedProcedure,
} from "@/trpc/init";
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
        const res = await axios.get(
          `${process.env.BASE_API}/v1/video/${input.videoId}`,
        );

        console.log(res.data, "res");

        return res.data.data;
      } catch (error: any) {
        // return error?.response?.data

        // console.log(error?.response?.data, "error");

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

  profile: protectedProcedure(["Admin,User"]).query(async ({ ctx }) => {
    try {
      console.log(ctx.user);
      return ctx.user;
    } catch (error: any) {
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
  updateName: getUserProcedure
    .input(
      z.object({
        folderID: z.string().optional(),
        name: z.string(),
        workspaceID: z.string(),
        videoID: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const cookieStore = await cookies();

        const access_token = cookieStore.get("access_token")?.value;

        const res = await axios.patch(
          `${process.env.BASE_API}/v1/video/${input.videoID}/update/name`,
          {
            title: input.name,
            workspaceId: input.workspaceID,
            folderId: input.folderID,
          },
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          },
        );

        console.log(res.data);

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
    }),

  getVideoFromWorkspace: baseProcedure
    .input(
      z.object({
        videoId: z.string(),
        workspaceID: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        console.log(input, "check data");
        const cookieStore = await cookies();
        const id = input.videoId;
        const access_token = cookieStore.get("access_token")?.value;

        const res = await axios.get(
          `${process.env.BASE_API}/v1/workspace/${input.workspaceID}/video/${input.videoId}`,
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          },
        );

        // console.log(res.data, "res");

        return res.data.data;
      } catch (error: any) {
        // return error?.response?.data

        // console.log(error?.response?.data, "error");

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

  UpdateVideo: baseProcedure
    .input(
      z.object({
        videoId: z.string(),
        thumbnail: z.string().optional(),
        folderID: z.string().nullable().optional(),
        title: z.string().optional(),
        workspaceID: z.string(),
      }),
    )

    .mutation(async ({ ctx, input }) => {
      try {
        console.log(input, "458458");
        const cookieStore = await cookies();

        const access_token = cookieStore.get("access_token")?.value;

        const res = await axios.patch(
          `${process.env.BASE_API}/v1/workspace/${input.workspaceID}/video/${input.videoId}/update`,
          { ...input },
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          },
        );

        return res.data.data;
      } catch (error: any) {
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

  createLeadForm: getUserProcedure
    .input(
      z.object({
        // id: z.string(),
        videoId: z.string(),
        workspaceId: z.string(),
        placement: z.string(),
        show_at: z.number(),
        allow_skip: z.boolean(),
        fields: z.array(
          z.object({
            id: z.string(),
            label: z.string(),
            type: z.string(),
            position: z.number(),
            options: z
              .array(
                z.object({
                  id: z.string(),
                  label: z.string(),
                }),
              )
              .optional()
              .nullable(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        console.log(input, "458458");
        const cookieStore = await cookies();

        const access_token = cookieStore.get("access_token")?.value;
        const id = input.videoId;

        const res = await axios.post(
          `${process.env.BASE_API}/v1/workspace/${input.workspaceId}/video/${id}/form`,
          {
            // 🚀 FIXED: Cleaned up the formatting entirely
            placement: input.placement,
            show_at: input.show_at,
            allow_skip: input.allow_skip,
            fields: input.fields,
          },
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
              "Content-Type": "application/json",
            },
          },
        );

        return res.data.data;
      } catch (error: any) {
        console.log(error, "lollol");
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
  getLeadForm: baseProcedure
    .input(
      z.object({
        videoId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        console.log(input, "458458");
        // const cookieStore = await cookies();

        // const access_token = cookieStore.get("access_token")?.value;

        const res = await axios.get(
          `${process.env.BASE_API}/v1/video/${input.videoId}/form`,

          {
            // headers: {
            //   Authorization: `Bearer ${access_token}`,
            // },
          },
        );

        return res.data.data;
      } catch (error: any) {
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

  getVideoList: getUserProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        limit: z.number().default(10),
        cursor: z.string().nullable().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const cookieStore = await cookies();
        const access_token = cookieStore.get("access_token")?.value;
        const res = await axios(
          `${process.env.BASE_API}/v1/workspace/${input.workspaceId}/video/video-list/?limit=${input.limit}&cursor=${input.cursor}`,
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          },
        );

        return res.data.data;
      } catch (error) {
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
  end_screen: getUserProcedure
    .input(
      z.object({
        type: z.string(),
        workspaceId: z.string(),
        videoId: z.string(),
        more_videos: z.array(z.string()).nullable().optional(),
        cta_action: z
          .object({
            cta_title: z.string(),
            cta_sub_title: z.string(),
            cta_btn_title: z.string(),
            cta_btn_url: z.string(),
          })
          .nullable()
          .optional(),
        custom_image: z.string().optional(),
        share_button: z
          .object({
            instagram_url: z.string(),
            facebook_url: z.string(),
            mail_url: z.string(),
            x_url: z.string(),
            Linkedin_url: z.string(),
          })
          .optional(),
        custom_message: z
          .object({
            custom_title: z.string(),
            custom_description: z.string(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        console.log(input, "lololsdjflsjd");
        const cookieStore = await cookies();
        const access_token = cookieStore.get("access_token")?.value;

        // 🚀 1. Update the mapping table to match what your frontend button is actually passing
        const typeMapping: Record<string, string> = {
          call_action: "cta_action",
          cta_action: "cta_action",
          ctaAction: "cta_action",
          custom_image: "custom_image",
          share_button: "share_button",
          custom_message: "custom_message",
          more_video: "more_video",
        };

        const backendType = typeMapping[input.type] || input.type;

        // 2. Safely extract the data mapping block
        let backendPayload: any = null;
        switch (backendType) {
          case "cta_action":
            backendPayload = input.cta_action;
            break;

          case "custom_image":
            backendPayload =
              typeof input.custom_image === "string"
                ? { url: input.custom_image }
                : input.custom_image;
            break;

          case "share_button":
            backendPayload = input.share_button;
            break;

          case "custom_message":
            backendPayload = input.custom_message;
            break;

          case "more_video":
            backendPayload = { video_ids: input.more_videos };
            break;
        }
        const id = input.videoId;

        console.log(backendPayload, "lollolqwe");
        const res = await axios.post(
          `${process.env.BASE_API}/v1/workspace/${input.workspaceId}/video/${id}/end-screen`,
          {
            type: backendType,
            payload: backendPayload,
          },
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
              "Content-Type": "application/json",
            },
          },
        );

        // console.log(res.request,"iouo")

        return res.data.data;
      } catch (error) {
        console.log(error, "a error occuried");
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

  get_end_screen: baseProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        videoId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const cookieStore = await cookies();
        // const access_token = cookieStore.get("access_token")?.value;

        const id = input.videoId;

        const res = await axios.get(
          `${process.env.BASE_API}/v1/workspace/${input.workspaceId}/video/${id}/end-screen`,
          {
            // headers: {
            //   Authorization: `Bearer ${access_token}`,
            //   "Content-Type": "application/json",
            // },
          },
        );

        console.log(res.data.data, "iouo");

        return res.data.data;
      } catch (error) {
        console.log(error, "a error occuried");
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

  delete_screen: baseProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        videoId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const cookieStore = await cookies();
        const access_token = cookieStore.get("access_token")?.value;

        const id = input.videoId;

        const res = await axios.delete(
          `${process.env.BASE_API}/v1/workspace/${input.workspaceId}/video/${id}/end-screen`,
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
              // "Content-Type": "application/json",
            },
          },
        );

        console.log(res.data.data, "iouo");

        return res.data.data;
      } catch (error) {
        console.log(error, "a error occuried");
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

  VideoSubtitle: baseProcedure
    .input(
      z.object({
        video_id: z
          .string()
          .uuid({ message: "Invalid video selection ID format" }),
        workspaceID: z
          .string()
          .uuid({ message: "Invalid workspace context ID format" }),

        items: z
          .array(
            z.object({
              code: z
                .string()
                .min(2, {
                  message: "Language code must be at least 2 characters",
                })
                .trim(),
              label: z
                .string()
                .min(1, { message: "Language label is required" })
                .trim(),

              subtitle_url: z
                .string(),

              file_name: z
                .string()
                .min(1, { message: "File name identifier is required" })
                .trim(),
            }),
          ).optional()
      }),
    )

    .mutation(async ({ ctx, input }) => {
      try {

        const cookieStore = await cookies();
        console.log(input,"singh is king")
        const access_token = cookieStore.get("access_token")?.value;
        const id = input.video_id;
        const res = await axios.post(
          `${process.env.BASE_API}/v1/workspace/${input.workspaceID}/video/${id}/subtitle`,
          { ...input },
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          },
        );

        return res.data.data;
      } catch (error: any) {
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
  
    
  getSubtitle: baseProcedure
    .input(
      z.object({
        video_id: z
          .string()
          .uuid({ message: "Invalid video selection ID format" }),
        workspaceID: z
          .string()
          .uuid({ message: "Invalid workspace context ID format" }),

        items: z
          .array(
            z.object({
              code: z
                .string()
                .min(2, {
                  message: "Language code must be at least 2 characters",
                })
                .trim(),
              label: z
                .string()
                .min(1, { message: "Language label is required" })
                .trim(),

              subtitle_url: z
                .string(),

              file_name: z
                .string()
                .min(1, { message: "File name identifier is required" })
                .trim(),
            }),
          ).optional()
      }),
    )

    .query(async ({ ctx, input }) => {
      try {

        const cookieStore = await cookies();
        console.log(input,"singh is king")
        const access_token = cookieStore.get("access_token")?.value;
        const id = input.video_id;
        const res = await axios.get(
          `${process.env.BASE_API}/v1/workspace/${input.workspaceID}/video/${id}/subtitle`,
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          },
        );

        return res.data.data;
      } catch (error: any) {
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
  
    
});
