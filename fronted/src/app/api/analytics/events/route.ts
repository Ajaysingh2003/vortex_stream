// Same-origin fallback. For accurate viewer IP geolocation prefer a public Go
// ingestion URL, or enable edge forwarding ONLY behind a header-sanitizing proxy.
export async function POST(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return new Response(null, { status: 400 });
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 65536) {
        await reader.cancel();
        return new Response(null, { status: 413 });
      }
      chunks.push(value);
    }
    const body = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (process.env.ANALYTICS_TRUST_EDGE_HEADERS === "true")
      for (const name of ["cf-ipcountry", "x-forwarded-for", "x-real-ip"]) {
        const value = request.headers.get(name);
        if (value) headers[name] = value;
      }
    const response = await fetch(
      `${process.env.BASE_API}/v1/analytics/events`,
      {
        method: "POST",
        headers,
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(7000),
      },
    );
    return new Response(null, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return new Response(null, { status: 503 });
  }
}
