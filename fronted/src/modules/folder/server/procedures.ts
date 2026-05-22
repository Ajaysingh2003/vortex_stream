// import { loginSchema } from "@/schema/schema";
import { baseProcedure, createTRPCRouter, getUserProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
// import { z } from "zod";
import axios from "axios";
import { cookies } from "next/headers";
import { title } from "process";
import axiosRetry from 'axios-retry';
import { z } from "zod";

axiosRetry(axios, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) =>
        axiosRetry.isNetworkError(error) || 
        (error.response?.status ?? 0) >= 500,
});
export const folderRouter = createTRPCRouter({
  getRootFolder: getUserProcedure
    .input(
      z.object({
        workspaceID:z.string()
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // console.log(input, "input");
        const cookieStore = await cookies();

        const access_token = cookieStore.get("access_token")?.value;

        const res = await axios.get(
          `${process.env.BASE_API}/v1/workspaces/${input.workspaceID}/folders`,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          },
        );

        console.log(res.data, "leah jaye");
        return res.data.data;
      } catch (error: any) {
        console.log(error?.response as any, "a error occuried");

        if (axios.isAxiosError(error)) {
          if (error.response?.status === 400) {
            console.log("Bad request:", error.response.data);
            return;
          }
        }

        throw error;
      }
    }),
  
  getChildrenFolder:getUserProcedure.input(z.object({
    workspaceID:z.string(),
    folderID :z.string().nullable()
  })).query(async({ctx ,input})=>{

    try {
        // console.log(input, "input");

          if (!input.folderID || input.folderID === "" || input.folderID === "undefined") {
          console.log("Folder ID is empty. Short-circuiting request.");
          return [];
      }
      
        const cookieStore = await cookies();

        const access_token = cookieStore.get("access_token")?.value;

        const res = await axios.get(
          `${process.env.BASE_API}/v1/workspaces/${input.workspaceID}/folder/${input.folderID}/children`,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          },
        );

        console.log(res.data.data ,"leah jaye");

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
  CurrentFolder:getUserProcedure.input(z.object({
    workspaceID:z.string(),
    folderID :z.string().nullable()
  })).query(async({ctx ,input})=>{

    try {
        // console.log(input, "input");

          if (!input.folderID || input.folderID === "" || input.folderID === "undefined") {
          console.log("Folder ID is empty. Short-circuiting request.");
          return [];
      }
      
        const cookieStore = await cookies();

        const access_token = cookieStore.get("access_token")?.value;

        const res = await axios.get(
          `${process.env.BASE_API}/v1/workspaces/${input.workspaceID}/folder/${input.folderID}`,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          },
        );

        console.log(res.data.data ,"leah jaye");

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
  getFolderBreadCumb:getUserProcedure.input(z.object({
    workspaceID:z.string(),
    folderID :z.string().nullable()
  })).query(async({ctx ,input})=>{

      try {
        // console.log(input, "input");
        const cookieStore = await cookies();

        const access_token = cookieStore.get("access_token")?.value;
        console.log(input,"valantine")
        if (!input.folderID || input.folderID === "" || input.folderID === "undefined") {
          console.log("Folder ID is empty. Short-circuiting request.");
          return [];
      }

        const res = await axios.get(
          `${process.env.BASE_API}/v1/workspaces/${input.workspaceID}/folder/${input.folderID}/breadcumb`,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          },
        );

        console.log(res.data.data ,"leah jaye");

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
  createFolder:getUserProcedure.input(z.object({
    workspaceID:z.string(),
    name:z.string(),
    parentID :z.string().nullable()

  })).mutation(async({ctx ,input})=>{

      try {
        // console.log(input, "input");
        const cookieStore = await cookies();

        const access_token = cookieStore.get("access_token")?.value;
        
        const body={
           "name":input.name,
           ...(input.parentID !==null && input.parentID.trim() !=="" && {parentId:input.parentID})
        }

       
console.log(body,"lol")
        const res = await axios.post(
          `${process.env.BASE_API}/v1/workspaces/${input.workspaceID}/folder/create`,
          {
           ...body
          },
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          },
        );

        // console.log(res.data.data ,"leah jaye");

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

  })
});
