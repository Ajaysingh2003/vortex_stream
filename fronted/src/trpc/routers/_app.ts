// import { uploadsRouter } from "@/app/modules/upload/server/procedures";
import { uploadsRouter } from "@/modules/upload/server/procedures";
import {  createTRPCRouter } from "../init";
import { userRouter } from "@/modules/user/server/procedures";
export const appRouter = createTRPCRouter({

  upload:uploadsRouter,
  user:userRouter,
  
});

export type AppRouter = typeof appRouter;
