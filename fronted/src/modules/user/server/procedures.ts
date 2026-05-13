// import { loginSchema } from "@/schema/schema";
import { baseProcedure, createTRPCRouter, getUserProcedure, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
// import { z } from "zod";
import axios from "axios";
import { cookies } from "next/headers";

import { z } from "zod";


export const userRouter = createTRPCRouter({
  login: baseProcedure
    .input(
      z.object({
        email: z.string(),
        password: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        console.log(input, "input");
        // console.log();
        const res = await axios.post(
          `${process.env.BASE_API}/v1/users/login`,
          {
            ...input,
          },
          {
            withCredentials: true,
          },
        );

        const cookieStore = await cookies();
        cookieStore.set("access_token", res.data.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 90,
        });
        
        cookieStore.set("workspace_id", res.data.workspace_id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 90,
        });

        return res.data;
        console.log(res.data, "res");
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
  googleSignIn:baseProcedure.mutation(async({ctx})=>{
    try {
      
      const url = `${process.env.BASE_API}/v1/users/oauth/google`;
      // return url
      
      const res = await axios.get(url);
      console.log(res, "check-03");

      return res.data;
    } catch (error) {
      console.log(error, "vickysingh");
    }
  }),
  profile:protectedProcedure(["Admin","User"]).query(async({ctx})=>{
    try {
      console.log(ctx.user,"lol")
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

  })
  ,
  getWorkspaces:getUserProcedure.query(async({ctx})=>{
    try {
      const cookieStore = await cookies();

      const access_token = cookieStore.get("access_token")?.value;

        const res = await axios.get(
            `${process.env.BASE_API}/v1/users/workspaces/`,
            {
              withCredentials: true,
              headers:{
                Authorization:`Bearer ${access_token}`
              }
            },
          );

          return res.data.data
    } catch (error:any) {
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
  createWorkspace:getUserProcedure.input(z.object({
    name:z.string()
  })).mutation(async({ctx,input})=>{

     try {
      const cookieStore = await cookies();

      const access_token = cookieStore.get("access_token")?.value;

        const res = await axios.post(
            `${process.env.BASE_API}/v1/users/workspaces/create`,
            {
              ...input
            },
            {
              withCredentials: true,
              headers:{
                Authorization:`Bearer ${access_token}`
              }
            },
        );
        
        return res.data.data
    } catch (error:any) {
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
  switchWorkspace:getUserProcedure.input(z.object({workspaceId:z.string()})).mutation(async({ctx ,input})=>{
    
    try {
      const cookieStore = await cookies();

        cookieStore.set("workspace_id", input.workspaceId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 90,
        });

        return {success:true}
    } catch (error) {
      console.error("Failed to set workspace cookie:", error);
      throw new Error("Could not switch workspace. Please try again.");
    }
  }),
  getWorkspace:getUserProcedure.query(async({ctx})=>{
    
    try {
      
       const cookieStore = await cookies();
       const workspace_id = cookieStore.get("workspace_id")?.value;


      const access_token = cookieStore.get("access_token")?.value;

      console.log(access_token,workspace_id,"leah goti")
      
      const res = await axios.get(`${process.env.BASE_API}/v1/users/workspaces/${workspace_id}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      
      console.log(res.data.data,"leah jaye")
    return res.data.data

    } catch (error) {
      console.error("Cookie retrieval error:", error);
      return { workspaceId: null};
    }
  })

});
