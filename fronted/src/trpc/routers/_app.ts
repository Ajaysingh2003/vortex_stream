// import { uploadsRouter } from "@/app/modules/upload/server/procedures";
import { uploadsRouter } from "@/modules/upload/server/procedures";
import {  createTRPCRouter } from "../init";
import { userRouter } from "@/modules/user/server/procedures";
import { videoRouter } from "@/modules/video/server/procedures";
import { folderRouter } from "@/modules/folder/server/procedures";
import { billingRouter } from "@/modules/billing/server/procedures";
export const appRouter = createTRPCRouter({

  upload:uploadsRouter,
  user:userRouter,
  video:videoRouter,
  billing:billingRouter,
  folder:folderRouter
});

export type AppRouter = typeof appRouter;
