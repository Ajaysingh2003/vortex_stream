import axios from "axios";
import { cookies } from "next/headers";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import type {
  Delivery,
  DeliveryAttempt,
  Integration,
  Integrations,
  LeadPage,
  LeadScope,
} from "../types";

const scope = z.object({
  workspaceId: z.string().uuid(),
  videoId: z.string().uuid(),
});
const owner = protectedProcedure(["Admin", "User"]);
async function request<T>(
  input: LeadScope,
  path = "",
  method: "GET" | "POST" | "PUT" = "GET",
  data?: unknown,
  params?: Record<string, unknown>,
): Promise<T> {
  const token = (await cookies()).get("access_token")?.value;
  if (!token)
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Please sign in to view leads.",
    });
  try {
    const response = await axios.request<{ data: T }>({
      method,
      url: `${process.env.BASE_API}/v1/workspace/${input.workspaceId}/video/${input.videoId}/leads${path}`,
      data,
      params,
      timeout: 20000,
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      throw new TRPCError({
        code:
          status === 401
            ? "UNAUTHORIZED"
            : status === 403
              ? "FORBIDDEN"
              : status === 404
                ? "NOT_FOUND"
                : status === 409
                  ? "CONFLICT"
                  : "BAD_REQUEST",
        message:
          error.response?.data?.message ||
          "Unable to complete the request. Please try again.",
      });
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unable to complete the request.",
    });
  }
}
export const leadsRouter = createTRPCRouter({
  list: owner
    .input(
      scope.extend({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(25),
        search: z.string().max(200).default(""),
        status: z.enum(["all", "completed", "skipped"]).default("all"),
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
        asOf: z.string().datetime().optional(),
      }),
    )
    .query(({ input }) =>
      request<LeadPage>(input, "", "GET", undefined, input),
    ),
  integrations: owner
    .input(scope)
    .query(({ input }) => request<Integrations>(input, "/integrations")),
  saveIntegration: owner
    .input(
      scope.extend({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(1).max(100),
        kind: z.enum(["webhook", "hubspot"]),
        endpoint: z.string().max(2048),
        secret: z.string().max(4096),
        mapping: z.record(
          z.string().uuid(),
          z.string().regex(/^[a-z][a-z0-9_]{0,99}$/),
        ),
        enabled: z.boolean(),
        version: z.number().int().nonnegative(),
      }),
    )
    .mutation(({ input }) => {
      const { id, workspaceId, videoId, ...body } = input;
      return request<Integration>(
        { workspaceId, videoId },
        `/integrations${id ? `/${id}` : ""}`,
        id ? "PUT" : "POST",
        body,
      );
    }),
  testIntegration: owner
    .input(scope.extend({ integrationId: z.string().uuid() }))
    .mutation(({ input }) =>
      request(input, `/integrations/${input.integrationId}/test`, "POST", {}),
    ),
  deliveries: owner
    .input(scope)
    .query(({ input }) => request<Delivery[]>(input, "/deliveries")),
  attempts: owner
    .input(scope.extend({ deliveryId: z.string().uuid() }))
    .query(({ input }) =>
      request<DeliveryAttempt[]>(
        input,
        `/deliveries/${input.deliveryId}/attempts`,
      ),
    ),
  retry: owner
    .input(scope.extend({ deliveryId: z.string().uuid() }))
    .mutation(({ input }) =>
      request(input, `/deliveries/${input.deliveryId}/retry`, "POST", {}),
    ),
  send: owner
    .input(scope.extend({ ids: z.array(z.string().uuid()).min(1).max(100) }))
    .mutation(({ input }) =>
      request(input, "/send", "POST", { ids: input.ids }),
    ),
});
