// import { loginSchema } from "@/schema/schema";
import { baseProcedure, createTRPCRouter, getUserProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
// import { z } from "zod";
import axios from "axios";
import { cookies } from "next/headers";
import { title } from "process";
import axiosRetry from 'axios-retry';
import { z } from "zod";
import { access } from "fs";
import { Readable } from "stream";

axiosRetry(axios, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) =>
        axiosRetry.isNetworkError(error) || 
        (error.response?.status ?? 0) >= 500,
});
export const billingRouter = createTRPCRouter({
  getPlans: baseProcedure
    .query(async () => {
      try {

        const res = await axios.get(
          `${process.env.BASE_API}/v1/billing/plans/config`,
        );

        return res.data.data;

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

});
