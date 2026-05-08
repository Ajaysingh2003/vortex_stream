// import { loginSchema } from "@/schema/schema";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
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
        console.log(`${process.env.BASE_API}/v1/users/`);
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
          maxAge: 60 * 60 * 24 * 7,
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
  
  profile:protectedProcedure(["Admin"]).query(async({ctx})=>{
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

  })

});
