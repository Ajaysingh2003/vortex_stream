// import { loginSchema } from "@/schema/schema";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
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
export const uploadsRouter = createTRPCRouter({
  getSignedUrl: baseProcedure

    .input(
      z.array(
        z.object({
          name: z.string(),
          type: z.string(),
          size: z.number(),
        }),
      ),
    )
    
    .output(
      z.object({
        files: z.array(
          z.object({
            Key: z.string(),
            UploadUrl: z.string(),
          }),
        ),
        success:z.boolean()
      }),
    )

    .mutation(async ({ ctx, input }) => {
      try {
        console.log(input, "input");
        const cookieStore = await cookies();

        const access_token = cookieStore.get("access_token")?.value;

        const res = await axios.post(
          `${process.env.BASE_API}/v1/upload/presigned-url`,
          {
            files: input,
          },
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          },
        );

        console.log(res.data, "leah jaye");
        return res.data;
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

  updateMetaData: baseProcedure
    .input(
      z.object({
        title: z.string(),
        userId: z.string(),
        videoKey: z.string(),
        size: z.string(),
        status: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {

      console.log(
        input.title,
        input.userId,
        input.videoKey,
        input.size,
        input.status,
      );

      try {
        const cookieStore = await cookies();
        const access_token = cookieStore.get("access_token")?.value;
        console.log(input,"testing form video");
        const res = await axios.post(
          `${process.env.BASE_API}/v1/video/create`,
          {
            ...input,
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
        console.log(error?.response as any, "error occuried");
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 400) {
            console.log("Bad request:", error.response.data);
            return;
          }
        }

        throw error;
      }
    }),

    startProcessing:baseProcedure.input(z.object({
      id:z.string()
    })).mutation(async({input})=>{

       try {
         const cookieStore = await cookies();
        const access_token = cookieStore.get("access_token")?.value;

         const res = await axios.post(
          `${process.env.BASE_API}/v1/video/process/${input.id}`,
          {
            ...input,
          },
          {
            timeout:10000,
            withCredentials: true,
            headers: {
              "Content-Type":"application/json",
              Authorization: `Bearer ${access_token}`,
              'X-Request-ID': crypto.randomUUID(),
            },
          },
        );

        return res.data
       } catch (error) {
          if (axios.isAxiosError(error)){

            if(error.code =="ECONNABORTED"){
              throw new Error('Request timed out');
            }

            if (error.response) {
                throw new Error(error.response.data?.message || 'Server error');
            }
            throw new Error('Network error');
          }
          throw error
       }
    })
});
