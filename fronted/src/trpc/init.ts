import { initTRPC, TRPCError } from "@trpc/server";
import { cookies, headers as getHeaders } from "next/headers";
import SuperJSON from "superjson";
import { convertSegmentPathToStaticExportFilename } from "next/dist/shared/lib/segment-cache/segment-value-encoding";
import axios from "axios";
export const createTRPCContext = async () => {};
const t = initTRPC.create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: SuperJSON,
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

export const baseProcedure = t.procedure.use(async ({ next }) => {
  return next({ ctx: {} });
});

export const getUserProcedure = baseProcedure.use(async ({ ctx, next }) => {
  try {
    const cookieStore = await cookies();

    const access_token = cookieStore.get("access_token")?.value;


    const res = await axios.get(`${process.env.BASE_API}/v1/users/profile`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });



    return next({
      ctx: {
        ...ctx,
        user: res.data.data,
      },
    });
  } catch (error) {

    return next({
      ctx: {
        ...ctx,
        user: null,
      },
    });
  }
});

export const protectedProcedure = (requiredPermissions: string[]) =>
  getUserProcedure.use(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Please sign in to continue" });
    }
    if (!requiredPermissions.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
    }

    return next({ ctx });
  });
