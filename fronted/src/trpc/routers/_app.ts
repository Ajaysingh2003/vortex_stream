// import { uploadsRouter } from "@/app/modules/upload/server/procedures";
import { uploadsRouter } from "@/modules/upload/server/procedures";
import {  createTRPCRouter } from "../init";
import { userRouter } from "@/modules/user/server/procedures";
import { videoRouter } from "@/modules/video/server/procedures";
import { folderRouter } from "@/modules/folder/server/procedures";
import { billingRouter } from "@/modules/billing/server/procedures";
import { playerRouter } from "@/modules/embed/server/procedures";
import { favoriteRouter } from "@/modules/favorite/server/procedures";
import { channelRouter } from "@/modules/channel/server/procedures";
import { bandwidthRouter } from "@/modules/bandwidth/server/procedures";
export const appRouter = createTRPCRouter({

  upload:uploadsRouter,
  user:userRouter,
  video:videoRouter,
  billing:billingRouter,
  folder:folderRouter,
  videoPlayer:playerRouter,
  favorite: favoriteRouter,
  channel: channelRouter,
  bandwidth: bandwidthRouter,
});

export type AppRouter = typeof appRouter;
