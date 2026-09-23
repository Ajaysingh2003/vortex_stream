# Video analytics API

Implementation: 2026-09-23. This is the dashboard integration contract for the shared watch/embed player. No dashboard UI was added.

## Architecture and deployment

Browser → `POST /api/v1/analytics/events` → NATS JetStream → analytics worker → ClickHouse. Reporting combines deduplicated ClickHouse events with authoritative saved forms in PostgreSQL. Run the API, Redis, NATS, ClickHouse and analytics worker continuously. The worker acknowledges only after successful insertion and retries storage failures. Keep NATS storage persistent; its existing retention is 30 days, ClickHouse event retention is 365 days.

The shared `VideoCustomization` player collects events automatically. The full-page `/embed/:videoId` player is reported as `video_page`; an iframe is reported as `embed`. The console video preview uses the same embedded player, so owner preview activity is currently included. There is no reliable way to distinguish a real customer from an anonymous owner preview without an explicit preview policy.

Default transport: same-origin Next.js `/api/analytics/events`, forwarding to `${BASE_API}/v1/analytics/events`. For direct browser-to-API collection, set **NEXT_PUBLIC_ANALYTICS_API_URL** to the full public HTTPS ingestion URL and rebuild the frontend. Never point this public variable at an internal Docker hostname. Direct ingestion gives the API the viewer's network address and avoids attributing geolocation to the Next.js server.

**Country setup:** choose a trusted edge country header or mount a GeoLite2 Country `.mmdb` file and set `GEOIP_COUNTRY_DB_PATH`. To accept Cloudflare `CF-IPCountry` or forwarded IPs, set `TRUST_PROXY_HEADERS=true` only when the API is network-restricted behind a proxy that overwrites those headers. The Next.js fallback strips these headers unless `ANALYTICS_TRUST_EDGE_HEADERS=true`; enable that only when the Next.js ingress also overwrites client-supplied forwarding/country headers. Without a trusted source/database, country is **Unknown**, including localhost. Client-supplied country values are ignored. IPs are used transiently for GeoIP; raw IPs are not stored in analytics events. Rate-limit keys use a short-lived hash of the immediate network peer.

`JWT_SECRET_KEY` signs scoped 24-hour analytics tokens attached as `data.analyticsToken` by the existing `GET /api/v1/video/:videoId` endpoint after its playback/domain checks. Never place this signing secret in frontend configuration. Tokens are restricted to the `player-analytics` audience and exact video/workspace; they do not grant access to reporting or account APIs. Reload a player after its analytics token expires. Ingestion strips the token before publishing to NATS.

The public collector is best-effort audience measurement, not anti-fraud or billing infrastructure. Authorized viewers can still forge telemetry. Browser blockers, closed tabs, offline time and storage partitioning can reduce/alter counts. Existing CDN bandwidth accounting remains separate.

## Authentication and endpoint scopes

Every reporting request requires:

```http
Authorization: Bearer <owner-access-token>
```

Workspace prefix (all videos combined):

```text
/api/v1/workspaces/{workspaceId}/analytics
```

Single-video prefix:

```text
/api/v1/workspaces/{workspaceId}/videos/{videoId}/analytics
```

Workspace endpoints also accept `videoId=<uuid>` as an optional filter. Video-route scope takes precedence. The API verifies workspace ownership and that a requested video belongs to it. A video not owned by this workspace returns 404, never another customer's metrics. Responses use `Cache-Control: no-store`.

| Suffix | Workspace | Single video | Purpose |
|---|---|---|---|
| `/summary` | Yes | Yes | Cards, rates, previous-period comparison |
| `/series` | Yes | Yes | Zero-filled time-series charts |
| `/breakdown` | Yes | Yes | Countries, referrers, devices, browser, OS, campaign, surface |
| `/videos` | Yes | Use workspace endpoint | Top videos by views, titles and metrics |
| `/live` | Yes | Yes | Current active sessions, unique browsers, countries and videos |
| `/concurrency` | Yes | Yes | Sampled active sessions per UTC minute |
| `/engagement` | Requires `videoId` | Yes | Position/completion retention buckets |

Existing `/overview`, `/timeseries`, `/retention`, `/technical`, `/funnel` and `/funnel/timeseries` routes remain for compatibility. **Use the new endpoints above for new dashboards.** Legacy endpoints use the earlier event-count semantics and browser-observed form counts rather than the new metric contract.

## Common report parameters

- `from`: RFC3339 timestamp or `YYYY-MM-DD`; inclusive.
- `to`: RFC3339 timestamp (exclusive) or `YYYY-MM-DD` (includes that entire UTC date).
- Defaults: trailing 30 days ending now. Maximum 366 days.
- All bucket keys use UTC. Dates are not implicitly interpreted in the browser's local timezone. To show a local date range, send its explicit timestamp boundaries and format labels locally.
- `interval`: `hour`, `day` (default), `week` (Monday UTC), for `/series`.
- Hourly series: maximum 31 days; minute concurrency: maximum 48 hours. For `/concurrency`, explicitly supply a short range (the default 30-day range is rejected).
- `limit`: 1–100, default 50; `offset`: 0–10000 for breakdown/video lists. Rankings sort by views descending then key ascending. A page shorter than the limit is the end; no expensive total-count scan is provided.
- Series returns the entire bounded range with zero-filled buckets; limit/offset do not page it. Boundary buckets may represent only part of an hour/day/week.
- Queries have a 20-second server timeout. Reports are eventually consistent with the worker; refresh dashboard data every 15–30 seconds and live data about every 10 seconds.

Successful envelope: `{ "success": true, "data": ... }`. Errors: 400 malformed/unsupported filters, 401 missing/expired login, 404 not-owned/nonexistent resource, 429 ingestion rate limit, 503 unavailable ingestion dependencies; unexpected reporting/storage errors return 500 with a generic message. Never interpret an error as zero activity.

## Metrics object

All counts and times are nonnegative. Times are **milliseconds**, percentages are **0–100** except no value is implied when the denominator is absent (returned as zero).

| Field | Definition |
|---|---|
| `views` | Distinct `(video, playback_session_id)` sessions with an actual playing/start event in the range |
| `unique_viewers` | Distinct anonymous browser IDs among those views; deduplicated across videos in the workspace summary |
| `impressions` | Distinct player sessions at least 50% in the viewport while the document is visible |
| `impression_play_sessions` | Sessions with both an impression and a play in this scope/range |
| `play_rate` | impression_play_sessions / impressions × 100 |
| `playback_ms` | Sum of bounded incremental playing wall time; excludes pause, seeking and buffering; continues for actual background playback when browser timers run |
| `completions` | Viewed sessions with an ended event in the same scope/range; at most one per playback session |
| `completion_rate` | completions / views × 100 |
| `replays` | Replay events within a mounted player; do not add a view |
| `average_progress_percent` | Average maximum timeline position reached among viewed sessions |
| `cta_displays`, `cta_clicks` | CTA display/click events; display once per CTA per player session |
| `cta_exposed_sessions`, `cta_clicking_sessions` | Distinct exposed sessions and exposed sessions that also clicked |
| `cta_click_rate` | cta_clicking_sessions / cta_exposed_sessions × 100 |
| `form_opens`, `form_starts`, `form_failures` | Browser-observed interactions; no answers or personal contact values |
| `form_opened_sessions`, `form_converted_sessions` | Sessions with an observed form opening and those also observing successful submission |
| `form_conversion_rate` | form_converted_sessions / form_opened_sessions × 100; observational cohort rate, not authoritative saved-total / telemetry-opens |
| `observed_form_submissions` | Successful submission IDs observed by the browser, deduplicated per playback session |
| `form_submissions`, `form_skips` | Actual PostgreSQL completed/skipped submissions by submission time. Authoritative in summary, series and videos; not attributable to country/device/referrer for historical records |
| `errors` | Playback/CDN/quality error events |
| `buffer_events`, `buffer_ms` | Rebuffering count and observed duration after playback first started |
| `average_startup_ms` | Mean time from play request to the first `playing` signal; not a browser paint measurement |
| `end_screen_displays`, `end_screen_clicks` | End-screen display and action events |

Unique counts, cohort rates and per-bucket completions are **not additive**. For example, a view starts in one hour and ends in the next; the next hour's completion cohort excludes the earlier view. Use summary for the overall range rather than summing or averaging series percentages. Watch time in a bucket can include sessions that began before that bucket. New collection cannot reconstruct historical watch time or countries; existing saved lead totals remain available.

## Summary and comparisons

```http
GET /api/v1/workspaces/{workspaceId}/analytics/summary?from=2026-09-17&to=2026-09-23
```

```json
{
  "success": true,
  "data": {
    "range": {"from":"2026-09-17T00:00:00Z","to":"2026-09-24T00:00:00Z"},
    "previous_range": {"from":"2026-09-10T00:00:00Z","to":"2026-09-17T00:00:00Z"},
    "current": {"views":120,"unique_viewers":93,"impressions":180,"playback_ms":3600000,"completions":60,"completion_rate":50,"form_submissions":8},
    "previous": {"views":100,"unique_viewers":80,"impressions":150,"playback_ms":3000000,"form_submissions":0},
    "change_percent": {"views":20,"unique_viewers":16.25,"impressions":20,"playback_ms":20,"form_submissions":null,"cta_clicks":null},
    "generated_at":"2026-09-24T00:00:00Z"
  }
}
```

Metrics objects above are abbreviated for readability; actual responses include every field in the metrics table. Previous period is the immediately preceding equal-length interval. A change of `null` means the previous denominator was zero (display “New”/“—”, not Infinity). Compare completion/conversion percentages directly using current and previous values if needed.

## Time series

```http
GET .../analytics/series?from=2026-09-17&to=2026-09-23&interval=day
```

```json
{"success":true,"data":{"range":{"from":"2026-09-17T00:00:00Z","to":"2026-09-24T00:00:00Z"},"dimension":"series","interval":"day","limit":800,"offset":0,"saved_form_counts_available":true,"items":[{"key":"2026-09-17T00:00:00Z","metrics":{"views":0,"unique_viewers":0,"impressions":0,"playback_ms":0,"form_submissions":0}}]}}
```

Example abbreviated to one bucket; all seven daily buckets are returned. Chart `metrics.views`, `unique_viewers`, `impressions`, `playback_ms / 60000`, `form_submissions`, `cta_clicks`, or `completion_rate`.

## Country map, referrers, devices and campaigns

```http
GET .../analytics/breakdown?dimension=country&from=2026-09-17&to=2026-09-23&limit=100
GET .../analytics/breakdown?dimension=referrer
GET .../analytics/breakdown?dimension=device
```

Allowlisted dimensions: `country`, `referrer`, `page`, `device`, `browser`, `os`, `utm_source`, `utm_medium`, `utm_campaign`, `surface`, `video`.

```json
{"success":true,"data":{"dimension":"country","interval":"day","limit":100,"offset":0,"saved_form_counts_available":false,"items":[{"key":"IN","metrics":{"views":40,"unique_viewers":32,"playback_ms":800000}}]}}
```

Use country keys (`IN`, `US`, …) with your map library. `Unknown` is a separate bucket and must not be plotted as a real country. `referrer` and `page` retain only origins (scheme + host), never userinfo, paths, query strings or fragments. Missing referrer is `Direct / unknown`. Campaign tags are read from the player's own URL; a cross-origin iframe cannot reliably read the parent URL, so explicitly include UTM tags in its `src` when needed. Do not put contact data in campaign tags.

**Important:** when `saved_form_counts_available` is false, ignore `form_submissions`/`form_skips` in the metrics object (they are zero placeholders). Use `observed_form_submissions` for an explicitly labeled observational breakdown. Historical lead records cannot be accurately assigned to countries/referrers after the fact.

## Top-performing videos

```http
GET /api/v1/workspaces/{workspaceId}/analytics/videos?from=2026-09-17&to=2026-09-23&limit=10&offset=0
```

Same list envelope with `dimension: "video"`, `saved_form_counts_available: true` and rows:

```json
{"key":"<video-uuid>","title":"Campaign video","metrics":{"views":120,"unique_viewers":93,"form_submissions":8,"completion_rate":50}}
```

Sorted by views. Only videos with telemetry in the range appear; use the content-library list separately if your dashboard needs videos with no collected activity. Selecting a row can navigate to the corresponding single-video analytics endpoints.

## Live and concurrent viewers

```http
GET .../analytics/live
```

```json
{"success":true,"data":{"as_of":"2026-09-23T10:00:00Z","window_seconds":90,"active_sessions":3,"unique_viewers":2,"countries":[{"key":"IN","active_sessions":3,"unique_viewers":2}],"videos":[{"key":"<video-uuid>","active_sessions":3,"unique_viewers":2}]}}
```

Latest state must be visible and playing, received through the pipeline within the 90-second event-time window. Pause/end/hidden/unload publishes inactive state. A crashed browser expires naturally. Worker lag affects this metric; it is not a websocket presence guarantee. Opening a tab without playback is not a live viewer. This endpoint ignores historical date parameters.

```http
GET .../analytics/concurrency?from=2026-09-23T09:00:00Z&to=2026-09-23T10:00:00Z
```

```json
{"success":true,"data":{"bucket_seconds":60,"definition":"distinct active sessions observed per minute; not a subsecond peak","items":[{"key":"2026-09-23T09:31:00Z","active_sessions":3,"unique_viewers":2}]}}
```

Concurrency is sampled heartbeat activity: people active at different instants in the same minute can both count. It is not an exact historical peak. Missing minutes mean no collected active heartbeats; fill them with zero for chart display. Maximum 48 hours per query.

## Engagement and completion retention

```http
GET /api/v1/workspaces/{workspaceId}/videos/{videoId}/analytics/engagement?from=2026-09-17&to=2026-09-23
```

```json
{"success":true,"data":{"items":[{"bucket":"0","sessions":100,"percent":100},{"bucket":"25","sessions":80,"percent":80},{"bucket":"50","sessions":60,"percent":60},{"bucket":"75","sessions":40,"percent":40},{"bucket":"90","sessions":30,"percent":30},{"bucket":"100","sessions":25,"percent":25}]}}
```

0 is plays, 25–90 are maximum timeline positions reached, 100 is ended. Seeking forward can advance retention; these are not per-second attention heatmaps. The denominator consists of sessions that started within the requested scope/range. Very short clips may skip intermediate media updates; the ended sample still supplies their final position.

## Event ingestion contract

Normally the shared player handles this; custom players may use the same API. Fetch the normal video metadata first and retain `data.analyticsToken`. Use stable UUIDs for `anonymous_id`, visit `session_id`, and one `playback_session_id` per mounted player. Retrying a batch must preserve event IDs and timestamps.

```http
POST /api/v1/analytics/events
Content-Type: application/json
```

```json
{"events":[{"event_id":"<uuid>","event_name":"playback_heartbeat","event_version":1,"occurred_at":"2026-09-23T10:00:00.000Z","anonymous_id":"<uuid>","session_id":"<uuid>","playback_session_id":"<uuid>","video_id":"<video-uuid>","playback_token":"<data.analyticsToken>","page_url":"https://video.example.com","referrer":"https://campaign.example.com","utm_source":"newsletter","utm_medium":"email","utm_campaign":"launch","device_type":"desktop","browser":"Chrome","os":"macOS","position_ms":12000,"duration_ms":60000,"properties":{"watch_ms":10000,"active":true,"surface":"embed"}}]}
```

Accepted: **202 with no response body**, after NATS confirms publication (not after ClickHouse indexing). Batches: 1–100 events; Go body limit 1 MiB, Next.js proxy body limit 64 KiB. Collector uses batches of 20 and a maximum queue of 100. Flush every 3 seconds or 20 events, heartbeat every 10 seconds, exponential retry up to 60 seconds for network/429/5xx errors. 4xx validation failures are dropped. Unload uses `sendBeacon`/keepalive and is best-effort; queued events do not persist across reloads. A blocked storage environment uses in-memory anonymous IDs.

Ingestion requires version 1, nonzero UUID identities, timestamps no older than 24 hours/no more than 5 minutes ahead, nonnegative bounded positions/durations, valid object properties up to 4 KiB, and metadata length limits. Workspace is overwritten from the actual READY video; user identity and client country are discarded. It validates the scoped playback token. Tokens and contact values are never written into the event stream. Incoming unknown property keys are discarded. Allowed numeric properties: `watch_ms` (heartbeat only, 0–15000), `buffer_ms`, `startup_ms`, `rate`, `width`, `height`, `from_ms`; boolean: `active`; string: `cta_id`, `chapter_id`, `form_id`, `submission_id`, `surface`, `language`, `error_code`, `quality`, `action`. Strings are at most 100 characters. Never send answer values or exception messages containing URLs.

Redis rate limit: 12,000 events/minute per immediate network peer, shared across API replicas. A reverse proxy can aggregate many viewers under one peer; size this budget for deployment traffic or add a trusted-edge limiter. Do not trust arbitrary client-forwarded IP headers merely to evade that aggregation.

Automatically emitted: player impression; initial play; resume/pause; heartbeat and progress; 25/50/75/90 milestones; end/replay/abandon; forward/backward seek; load start/metadata ready; first playing/startup; buffer start/end; native video error; rate/mute/fullscreen/PiP/resolution changes; CTA display/click; chapter/caption controls; form open/start/saved/skip/failure; end-screen display/click; copy-link share. The ingestion allowlist also accepts explicit thumbnail, CTA-dismissal, share/download, CDN-error and quality-switch-failure events for custom controls. Do not claim these events are automatically available when a control does not expose them.

## Example dashboard fetch

```ts
const prefix = `/api/v1/workspaces/${workspaceId}/analytics`;
const params = new URLSearchParams({ from: '2026-09-17', to: '2026-09-23' });
const response = await fetch(`${apiOrigin}${prefix}/summary?${params}`, {
  headers: { Authorization: `Bearer ${accessToken}` },
  cache: 'no-store',
});
if (!response.ok) throw new Error('Unable to load analytics');
const { data } = await response.json();
// Cards: data.current.views / unique_viewers / impressions / playback_ms.
// Comparison badges: data.change_percent. Never sum unique viewers across videos.
```

Keep owner access tokens in the application's existing authenticated server/session flow; do not embed them in public video pages. The Next.js tRPC layer can proxy these reporting requests using its HttpOnly access cookie, as the Leads module does, when you build the dashboard.

## Verification and operations

- `go test ./...` from `server`: unit checks, including event validation and untrusted country rejection.
- `bun test src/modules/analytics/player/collector.test.js` from `fronted`: time-accounting and URL-sanitization checks.
- `ANALYTICS_DATABASE_TEST=1 go test ./internal/shared/config/clickhouse ./internal/modules/analytics/services` inside the local API environment: real ClickHouse dedup/metrics/live/retention plus NATS-worker end-to-end ingestion and PostgreSQL saved-form counts. Requires the analytics worker running. PostgreSQL fixtures roll back; isolated ClickHouse test workspace events are removed.
- Production rollout: deploy backend and worker before the frontend, verify a synthetic play → 202 → view + heartbeat in reports, and verify country using an actual external request through the configured edge. Do not invent a country for a localhost test.
- Monitor NATS consumer lag/redeliveries, ClickHouse errors, ingestion 429/503 rates, and worker restart health. Raw data expires after 365 days; this implementation does not add long-term rollups. High-volume deployments should benchmark query latency and add tested materialized aggregates before increasing data retention.
