# Video analytics: implementation plan and metric contract

Updated: 2026-09-23. Scope: backend analytics plus automatic collection on the public video page and embed player. Dashboard UI is intentionally left to the product owner. Reference screenshots guide the metric coverage, not third-party instructions.

## Implementation sequence

1. Audit the existing NATS JetStream → ClickHouse event pipeline and shared player (completed before this plan).
2. Harden public ingestion: bounded validated batches, resolve workspace from the video record, reject unsupported/untrusted events, derive country on the server, remove personal/query-string data, and protect against duplicate event delivery.
3. Add a shared browser collector and instrument the actual HTML media element used by both playback routes. Capture impressions, initial play, heartbeats, playing time, pause/resume/end, seek, replay, buffer/error, controls, CTA, chapters, captions, end screens and lead-form interactions. Never transmit form answers into analytics.
4. Add workspace-wide and per-video reporting APIs for overview/comparison, time series, country/referrer/device breakdowns, top videos, live viewers, concurrency, retention, quality and conversion metrics. Count saved forms from PostgreSQL as the authoritative source; browser form-success events are observational only.
5. Exercise validation, watch-time accounting, duplicate handling, authorization and report queries with unit/integration tests, run the frontend build, then publish full request/response examples in `docs/analytics-api.md`.

## Architecture

Browser collector → public Go ingestion → durable NATS JetStream → analytics worker → ClickHouse. Reporting endpoints require the workspace owner's bearer token. PostgreSQL supplies video ownership and authoritative lead counts. The existing storage is reused; no third-party analytics vendor or dashboard is required.

Reports are eventually consistent with worker delivery. Live means playback sessions with a recent visible-playing heartbeat (a bounded freshness window), not a guaranteed count of people staring at a screen. The API must return freshness semantics. Analytics must never block playback or lead submission when storage/network is unavailable.

## Definitions

- **Impressions:** distinct playback sessions whose player is visible, once per player mount.
- **Views:** distinct playback sessions that actually begin playing. Pausing/resuming and replaying within the same mounted player do not add another view; replay has its own count.
- **Unique viewers:** approximate distinct anonymous browser IDs among plays, scoped to the report range and workspace. Not identified people; private mode, blocked storage and different embedding origins affect identity.
- **Playback time:** incremental wall-clock milliseconds spent playing, excluding paused, buffering and seeking intervals. A seek jump is never watch time. Interval deltas are bounded and carry stable event IDs for retries.
- **Completions:** viewed sessions with an ended event. Completion rate uses viewed sessions in the selected range as its denominator and remains 0–100%. Timeline milestones describe position reached, not proof that every preceding second was watched.
- **Engagement/retention:** viewed-session progress buckets and maximum reached position, with seek behavior documented.
- **Live viewers:** visible, playing playback sessions with a recent heartbeat; unique browser count is reported separately. Pause/end/hidden/unload makes a session inactive; stale sessions expire naturally.
- **Concurrent viewers:** distinct active playback sessions observed in each time bucket. This is sampled concurrency, not a historical subsecond peak.
- **Forms:** saved completed submissions and skipped forms come from PostgreSQL, so failed requests, retries and blocked browser telemetry cannot inflate conversion counts. Form impressions/starts/failures are browser events and can be undercounted.
- **CTA:** display and click events plus distinct exposed/clicking sessions. Rate uses exposed sessions, not raw repeated clicks.
- **Country:** ISO alpha-2 country resolved from trusted edge headers or a local GeoIP database; `Unknown` when unavailable. Never trust a browser-supplied country or store raw IPs in event records.
- **Attribution:** sanitized page/referrer origins, UTM source/medium/campaign and embed vs watch-page placement. No URL query strings, fragments, credentials, form answers or contact details in analytics.
- **Quality:** startup delay, buffering count/time, error counts and dimensions for browser, OS, device and selected resolution when observable.

## Reliability and boundaries

Use browser-generated immutable event IDs and retries. ClickHouse reports read deduplicated events. Queues are bounded; unload delivery is best-effort. Collection is approximate and can be blocked or forged by public clients, so it is unsuitable as a billing ledger. Existing CDN bandwidth accounting remains separate.

Resolve video/workspace ownership at ingestion rather than trusting workspace IDs. Restrict report dimensions and SQL expressions to allowlists. Bound report date ranges and result sizes. Private-network IP/country lookup must respect explicitly trusted proxies; localhost correctly produces Unknown without a GeoIP source. No country data is invented.

Keep raw event retention at the existing 365 days; report date/time conventions and UTC boundaries explicitly. API errors must distinguish malformed requests, unauthorized/not-owned resources and temporarily unavailable infrastructure. Deployment configuration, limits, endpoint examples and rollout verification belong in `docs/analytics-api.md`.

## Delivery status

The shared collector, validated/token-scoped ingestion, new workspace and video reporting routes, database regression tests, and dashboard integration reference are implemented. See [the complete API guide](docs/analytics-api.md) for concrete endpoints, response fields, metric limitations, country configuration and deployment checks.

Verified locally: full Go test suite, database-backed PostgreSQL → NATS → ClickHouse ingestion/report tests (including duplicate delivery and authorization), frontend collector tests, scoped lint, TypeScript through a successful production build, and actual browser playback/form submission on the full-page and iframe players. Temporary browser fixtures were removed. Production country accuracy requires the trusted edge/GeoIP setup in the API guide.
