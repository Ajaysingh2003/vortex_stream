// import { uploadsRouter } from "@/app/modules/upload/server/procedures";
import { uploadsRouter } from "@/modules/upload/server/procedures";
import {  createTRPCRouter } from "../init";
import { userRouter } from "@/modules/user/server/procedures";
import { videoRouter } from "@/modules/video/server/procedures";
import { folderRouter } from "@/modules/folder/server/procedures";
export const appRouter = createTRPCRouter({

  upload:uploadsRouter,
  user:userRouter,
  video:videoRouter,
  folder:folderRouter
});

export type AppRouter = typeof appRouter;
