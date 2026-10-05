import axios from "axios";
import { cookies } from "next/headers";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, getUserProcedure } from "@/trpc/init";
import type {
  SummaryReport,
  SeriesReport,
  BreakdownReport,
  VideoRankingReport,
  LiveReport,
  ConcurrencyPoint,
  EngagementBucket,
  CTAPerformanceReport,
  ChaptersReport,
  CaptionsReport,
  HeatmapReport,
  FunnelReport,
  LeadAttributionReport,
  SessionMetricsReport,
  QualityReport,
  ExportJobDTO,
} from "../types";

const scopeSchema = z.object({
  workspaceId: z.string().optional(),
  videoId: z.string().optional(),
});

const filtersSchema = z
  .object({
    country: z.string().optional(),
    referrer: z.string().optional(),
    device: z.string().optional(),
    browser: z.string().optional(),
    os: z.string().optional(),
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
    surface: z.string().optional(),
    media_revision_id: z.string().optional(),
    cta_id: z.string().optional(),
    chapter_id: z.string().optional(),
    subtitle_track_id: z.string().optional(),
    is_preview: z.boolean().optional(),
  })
  .optional();

async function getAuthContext(explicitWorkspaceId?: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const workspaceId =
    explicitWorkspaceId || cookieStore.get("workspace_id")?.value;

  if (!token) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Please sign in to view analytics.",
    });
  }
  if (!workspaceId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No workspace selected.",
    });
  }

  return { token, workspaceId };
}

function buildAnalyticsUrl(
  workspaceId: string,
  videoId?: string,
  endpoint = "",
): string {
  const base = process.env.BASE_API || "http://localhost:8000";
  if (videoId) {
    return `${base}/v1/workspaces/${workspaceId}/videos/${videoId}/analytics/${endpoint}`;
  }
  return `${base}/v1/workspaces/${workspaceId}/analytics/${endpoint}`;
}

async function request<T>(
  url: string,
  token: string,
  params?: Record<string, unknown>,
  method: "GET" | "POST" | "DELETE" = "GET",
  data?: unknown,
): Promise<T> {
  try {
    const response = await axios.request<{ data: T; success?: boolean }>({
      method,
      url,
      params,
      data,
      timeout: 25000,
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data !== undefined
      ? response.data.data
      : (response.data as unknown as T);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to fetch analytics";
      throw new TRPCError({
        code:
          status === 401
            ? "UNAUTHORIZED"
            : status === 403
              ? "FORBIDDEN"
              : status === 404
                ? "NOT_FOUND"
                : status === 400
                  ? "BAD_REQUEST"
                  : "INTERNAL_SERVER_ERROR",
        message,
      });
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Analytics service unavailable",
    });
  }
}

export const analyticsRouter = createTRPCRouter({
  summary: getUserProcedure
    .input(
      scopeSchema.extend({
        from: z.string(),
        to: z.string(),
        filters: filtersSchema,
      }),
    )
    .query(async ({ input }) => {
      const { token, workspaceId } = await getAuthContext(input.workspaceId);
      const url = buildAnalyticsUrl(workspaceId, input.videoId, "summary");
      return request<SummaryReport>(url, token, {
        from: input.from,
        to: input.to,
        ...input.filters,
      });
    }),

  series: getUserProcedure
    .input(
      scopeSchema.extend({
        from: z.string(),
        to: z.string(),
        interval: z.enum(["hour", "day", "week"]).default("day"),
        metric: z.string().optional(),
        filters: filtersSchema,
      }),
    )
    .query(async ({ input }) => {
      const { token, workspaceId } = await getAuthContext(input.workspaceId);
      const url = buildAnalyticsUrl(workspaceId, input.videoId, "series");
      return request<SeriesReport>(url, token, {
        from: input.from,
        to: input.to,
        interval: input.interval,
        metric: input.metric,
        ...input.filters,
      });
    }),

  breakdown: getUserProcedure
    .input(
      scopeSchema.extend({
        from: z.string(),
        to: z.string(),
        dimension: z.string().default("country"),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
        filters: filtersSchema,
      }),
    )
    .query(async ({ input }) => {
      const { token, workspaceId } = await getAuthContext(input.workspaceId);
      const url = buildAnalyticsUrl(workspaceId, input.videoId, "breakdown");
      return request<BreakdownReport>(url, token, {
        from: input.from,
        to: input.to,
        dimension: input.dimension,
        limit: input.limit,
        offset: input.offset,
        ...input.filters,
      });
    }),

  videos: getUserProcedure
    .input(
      z.object({
        workspaceId: z.string().optional(),
        from: z.string(),
        to: z.string(),
        limit: z.number().optional().default(25),
        offset: z.number().optional().default(0),
      }),
    )
    .query(async ({ input }) => {
      const { token, workspaceId } = await getAuthContext(input.workspaceId);
      const url = buildAnalyticsUrl(workspaceId, undefined, "videos");
      return request<VideoRankingReport>(url, token, {
        from: input.from,
        to: input.to,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  live: getUserProcedure
    .input(scopeSchema)
    .query(async ({ input }) => {
      const { token, workspaceId } = await getAuthContext(input.workspaceId);
      const url = buildAnalyticsUrl(workspaceId, input.videoId, "live");
      return request<LiveReport>(url, token);
    }),

  concurrency: getUserProcedure
    .input(
      scopeSchema.extend({
        from: z.string(),
        to: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { token, workspaceId } = await getAuthContext(input.workspaceId);
      const url = buildAnalyticsUrl(workspaceId, input.videoId, "concurrency");
      const res = await request<{ items: ConcurrencyPoint[] }>(url, token, {
        from: input.from,
        to: input.to,
      });
      return res.items || [];
    }),

  engagement: getUserProcedure
    .input(
      z.object({
        workspaceId: z.string().optional(),
        videoId: z.string(),
        from: z.string(),
        to: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { token, workspaceId } = await getAuthContext(input.workspaceId);
      const url = buildAnalyticsUrl(workspaceId, input.videoId, "engagement");
      const res = await request<{ items: EngagementBucket[] }>(url, token, {
        from: input.from,
        to: input.to,
      });
      return res.items || [];
    }),

  ctas: getUserProcedure
    .input(
      scopeSchema.extend({
        from: z.string(),
        to: z.string(),
        mode: z.enum(["summary", "series"]).default("summary"),
        interval: z.string().optional().default("day"),
        sort: z.string().optional().default("clicks"),
        order: z.string().optional().default("desc"),
        limit: z.number().optional().default(25),
        offset: z.number().optional().default(0),
        cursor: z.string().optional(),
        filters: filtersSchema,
      }),
    )
    .query(async ({ input }) => {
      const { token, workspaceId } = await getAuthContext(input.workspaceId);
      const url = buildAnalyticsUrl(workspaceId, input.videoId, "ctas");
      return request<CTAPerformanceReport>(url, token, {
        from: input.from,
        to: input.to,
        mode: input.mode,
        interval: input.interval,
        sort: input.sort,
        order: input.order,
        limit: input.limit,
        offset: input.offset,
        cursor: input.cursor,
        ...input.filters,
      });
    }),

  chapters: getUserProcedure
    .input(
      scopeSchema.extend({
        from: z.string(),
        to: z.string(),
        filters: filtersSchema,
      }),
    )
    .query(async ({ input }) => {
      const { token, workspaceId } = await getAuthContext(input.workspaceId);
      const url = buildAnalyticsUrl(workspaceId, input.videoId, "chapters");
      return request<ChaptersReport>(url, token, {
        from: input.from,
        to: input.to,
        ...input.filters,
      });
    }),

  captions: getUserProcedure
    .input(
      scopeSchema.extend({
        from: z.string(),
        to: z.string(),
        filters: filtersSchema,
      }),
    )
    .query(async ({ input }) => {
      const { token, workspaceId } = await getAuthContext(input.workspaceId);
      const url = buildAnalyticsUrl(workspaceId, input.videoId, "captions");
      return request<CaptionsReport>(url, token, {
        from: input.from,
        to: input.to,
        ...input.filters,
      });
    }),

  heatmap: getUserProcedure
    .input(
      z.object({
        workspaceId: z.string().optional(),
        videoId: z.string(),
        from: z.string(),
        to: z.string(),
        bins: z.number().min(20).max(200).optional().default(100),
        filters: filtersSchema,
      }),
    )
    .query(async ({ input }) => {
      const { token, workspaceId } = await getAuthContext(input.workspaceId);
      const url = buildAnalyticsUrl(workspaceId, input.videoId, "heatmap");
      return request<HeatmapReport>(url, token, {
        from: input.from,
        to: input.to,
        bins: input.bins,
        ...input.filters,
      });
    }),

  funnels: getUserProcedure
    .input(
      scopeSchema.extend({
        from: z.string(),
        to: z.string(),
        template: z
          .enum(["inplay_lead", "preplay_lead", "cta_response", "cta_to_lead"])
          .default("inplay_lead"),
        windowMinutes: z.number().min(1).max(1440).optional().default(30),
        filters: filtersSchema,
      }),
    )
    .query(async ({ input }) => {
      const { token, workspaceId } = await getAuthContext(input.workspaceId);
      const url = buildAnalyticsUrl(workspaceId, input.videoId, "funnels");
      return request<FunnelReport>(url, token, {
        from: input.from,
        to: input.to,
        template: input.template,
        window_minutes: input.windowMinutes,
        ...input.filters,
      });
    }),

  leadAttribution: getUserProcedure
    .input(
      scopeSchema.extend({
        from: z.string(),
        to: z.string(),
        dimension: z
          .enum([
            "country",
            "utm_campaign",
            "utm_source",
            "utm_medium",
            "referrer",
            "surface",
          ])
          .default("country"),
      }),
    )
    .query(async ({ input }) => {
      const { token, workspaceId } = await getAuthContext(input.workspaceId);
      const url = buildAnalyticsUrl(
        workspaceId,
        input.videoId,
        "lead-attribution",
      );
      return request<LeadAttributionReport>(url, token, {
        from: input.from,
        to: input.to,
        dimension: input.dimension,
      });
    }),

  sessionMetrics: getUserProcedure
    .input(
      scopeSchema.extend({
        from: z.string(),
        to: z.string(),
        cohort: z.string().optional().default("play_start"),
        filters: filtersSchema,
      }),
    )
    .query(async ({ input }) => {
      const { token, workspaceId } = await getAuthContext(input.workspaceId);
      const url = buildAnalyticsUrl(
        workspaceId,
        input.videoId,
        "session-metrics",
      );
      return request<SessionMetricsReport>(url, token, {
        from: input.from,
        to: input.to,
        cohort: input.cohort,
        ...input.filters,
      });
    }),

  quality: getUserProcedure
    .input(
      scopeSchema.extend({
        from: z.string(),
        to: z.string(),
        mode: z.enum(["summary", "series"]).default("summary"),
        interval: z.string().optional().default("day"),
        filters: filtersSchema,
      }),
    )
    .query(async ({ input }) => {
      const { token, workspaceId } = await getAuthContext(input.workspaceId);
      const url = buildAnalyticsUrl(workspaceId, input.videoId, "quality");
      return request<QualityReport>(url, token, {
        from: input.from,
        to: input.to,
        mode: input.mode,
        interval: input.interval,
        ...input.filters,
      });
    }),

  createExport: getUserProcedure
    .input(
      scopeSchema.extend({
        reportType: z.string(),
        format: z.enum(["csv", "json"]).default("csv"),
        from: z.string(),
        to: z.string(),
        filters: filtersSchema,
        dimension: z.string().optional(),
        template: z.string().optional(),
        interval: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { token, workspaceId } = await getAuthContext(input.workspaceId);
      const url = buildAnalyticsUrl(workspaceId, input.videoId, "exports");
      return request<ExportJobDTO>(
        url,
        token,
        undefined,
        "POST",
        {
          report_type: input.reportType,
          format: input.format,
          from: input.from,
          to: input.to,
          filters: input.filters || {},
          dimension: input.dimension,
          template: input.template,
          interval: input.interval,
        },
      );
    }),

  getExport: getUserProcedure
    .input(
      z.object({
        workspaceId: z.string().optional(),
        exportId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { token, workspaceId } = await getAuthContext(input.workspaceId);
      const url = `${process.env.BASE_API || "http://localhost:8000"}/v1/workspaces/${workspaceId}/analytics/exports/${input.exportId}`;
      return request<ExportJobDTO>(url, token);
    }),

  cancelExport: getUserProcedure
    .input(
      z.object({
        workspaceId: z.string().optional(),
        exportId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { token, workspaceId } = await getAuthContext(input.workspaceId);
      const url = `${process.env.BASE_API || "http://localhost:8000"}/v1/workspaces/${workspaceId}/analytics/exports/${input.exportId}`;
      return request<{ message: string }>(url, token, undefined, "DELETE");
    }),
});
