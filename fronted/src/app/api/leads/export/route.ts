import { cookies } from "next/headers";
import { z } from "zod";

export async function GET(request: Request) {
  const token = (await cookies()).get("access_token")?.value;
  if (!token)
    return Response.json(
      { message: "Please sign in to export leads." },
      { status: 401 },
    );
  const url = new URL(request.url);
  const schema = z.object({
    workspaceId: z.string().uuid(),
    videoId: z.string().uuid(),
    search: z.string().max(200).optional(),
    status: z.enum(["all", "completed", "skipped"]).optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    asOf: z.string().datetime().optional(),
  });
  const input = schema.safeParse(Object.fromEntries(url.searchParams));
  if (!input.success)
    return Response.json(
      { message: "Invalid export filters." },
      { status: 400 },
    );
  const { workspaceId, videoId, ...filters } = input.data;
  const query = new URLSearchParams(
    Object.entries(filters).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  );
  try {
    const response = await fetch(
      `${process.env.BASE_API}/v1/workspace/${workspaceId}/video/${videoId}/leads/export?${query}`,
      {
        cache: "no-store",
        redirect: "error",
        headers: { Authorization: `Bearer ${token}` },
        signal: request.signal,
      },
    );
    if (!response.ok)
      return Response.json(
        {
          message:
            (await response.json()).message ||
            "Export failed. Please try again.",
        },
        { status: response.status },
      );
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="video-leads.csv"',
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json(
      { message: "Unable to export leads. Please try again." },
      { status: 502 },
    );
  }
}
