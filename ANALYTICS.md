# Analytics

This document describes the analytics backend currently added to Vortex Stream and the plan for continuing the work.

The analytics scope is intentionally limited to:

1. Video playback and viewer engagement
2. Sales and lead-conversion funnels

Product-wide analytics, infrastructure telemetry, and unrelated feature analytics are out of scope for now.

## Current architecture

```text
Video player / frontend
        |
        | POST /api/v1/analytics/events
        v
Go analytics ingestion API
        |
        | NATS JetStream: analytics.events
        v
Analytics worker
        |
        | bulk insert
        v
ClickHouse: analytics_events
```

The browser does not connect directly to NATS or ClickHouse. It sends a validated batch to the Go API. The API publishes that batch to NATS, and the worker stores it in ClickHouse.

## Country detection

Country is derived by the backend and is never trusted from the browser payload.

The resolver uses this order:

1. `CF-IPCountry` when the API is behind Cloudflare
2. An optional local MaxMind GeoLite2 Country database
3. Empty country when neither source is available

To use the local database, set:

```text
GEOIP_COUNTRY_DB_PATH=/app/data/GeoLite2-Country.mmdb
TRUST_PROXY_HEADERS=true
```

`TRUST_PROXY_HEADERS` should only be enabled when the API is behind a trusted reverse proxy. The backend stores only an ISO 3166-1 alpha-2 code such as `IN` or `US`; it does not store the raw IP address.

## Public visitors and identity

Visitors watching an embedded video usually do not have an account, so `user_id` is optional and should normally be `NULL` for public playback events. Analytics must not require authentication.

The frontend should generate and persist an anonymous browser identifier:

```text
anonymous_id       browser-level anonymous identifier
session_id         one visit/session in the browser
playback_session_id one viewing session for one video
```

Use these identifiers for visitor analytics:

- `anonymous_id` measures approximate unique browsers
- `session_id` groups activity during one visit
- `playback_session_id` groups one video-watching session
- `video_id` identifies the watched video
- `workspace_id` identifies the video owner/workspace
- `user_id` is only populated when the viewer is authenticated

An anonymous identifier is not a guaranteed real-world identity. It can change when the visitor clears storage, changes browsers, uses private browsing, or blocks storage. Reports should call this metric `unique anonymous viewers` rather than `unique people`.

For public embeds, the client may send `user_id: null` and should not invent a user ID. The backend should validate that the video is playable and that the event's video/workspace relationship is valid. For private videos, use the existing access-control or signed-playback flow before accepting playback analytics.

## What has been added

### Analytics event module

Location:

```text
server/internal/modules/analytics/
```

It contains:

- Event envelope and event-name validation
- Batch payload validation
- Analytics ingestion handler
- NATS publishing service
- Analytics route registration

### Ingestion endpoint

```text
POST /api/v1/analytics/events
```

This endpoint is public because embedded videos can be watched by visitors who are not logged in.

The endpoint accepts 1–100 events per request and limits the request body to 1 MiB.

Example request:

```json
{
  "events": [
    {
      "event_id": "01900000-0000-7000-8000-000000000001",
      "event_name": "play_started",
      "event_version": 1,
      "occurred_at": "2026-08-21T13:00:00Z",
      "anonymous_id": "anonymous-123",
      "session_id": "session-123",
      "playback_session_id": "playback-123",
      "workspace_id": "workspace-uuid",
      "video_id": "video-uuid",
      "page_url": "https://customer.example.com/demo",
      "referrer": "https://google.com",
      "device_type": "desktop",
      "browser": "Chrome",
      "os": "macOS",
      "properties": {
        "quality": "1080p",
        "muted": false,
        "playback_rate": 1
      }
    }
  ]
}
```

`event_id`, `event_version`, and `occurred_at` are normalized by the backend when they are missing. Unknown event names and invalid JSON properties are rejected. `user_id`, `workspace_id`, and `video_id` remain nullable because public visitors are not authenticated.

## NATS JetStream

Location:

```text
server/internal/shared/config/nats/
```

NATS is used as the durable event transport.

Current configuration:

```text
Subject:  analytics.events
Stream:   ANALYTICS_EVENTS
Consumer: analytics-clickhouse
Retention: 30 days
Storage: file-backed JetStream storage
```

The worker uses a durable pull consumer. It acknowledges a message only after the events have been inserted successfully into ClickHouse. If ClickHouse fails, the message is negatively acknowledged and can be retried.

## ClickHouse

Location:

```text
server/internal/shared/config/clickhouse/
```

The worker creates this table automatically:

```text
analytics_events
```

The table stores:

- Event identity and version
- Event time and ingestion time
- Anonymous, session, and playback-session IDs
- User, workspace, and video IDs when available
- Page URL, referrer, and UTM campaign data
- Device, browser, operating system, and country
- Playback position and video duration
- Event-specific JSON properties

The table uses `ReplacingMergeTree` with a 365-day event TTL. The `event_id` must remain stable when an event is retried so duplicate events can be collapsed by ClickHouse during merges. Reports should use `FINAL` or an equivalent deduplication strategy when exact results are required.

## Docker services

The development Compose file now includes:

```text
nats        ports 4222 and 8222
clickhouse  ports 8123 and 9000
```

The worker waits for PostgreSQL, Redis, NATS, and ClickHouse to become healthy before starting.

Relevant environment variables are in:

```text
server/internal/shared/config/.env
```

```text
NATS_URL=nats://nats:4222
NATS_SUBJECT=analytics.events
NATS_STREAM=ANALYTICS_EVENTS
NATS_CONSUMER=analytics-clickhouse

CLICKHOUSE_ADDR=clickhouse:9000
CLICKHOUSE_DATABASE=analytics
CLICKHOUSE_USERNAME=analytics_user
CLICKHOUSE_PASSWORD=analytics_password
```

## Analytics worker

Location:

```text
server/cmd/worker/
```

The worker currently:

1. Connects to NATS
2. Connects to ClickHouse
3. Creates the ClickHouse table if it does not exist
4. Reads analytics batches from JetStream
5. Inserts events in bulk
6. Acknowledges successfully processed messages

The worker does not yet calculate reporting summaries. It currently stores the raw event layer, which gives us a reliable source for building reports later.

## Event categories

### Video events

Use these for viewer engagement and playback quality:

```text
player_loaded
video_load_started
video_load_completed
first_frame_rendered
play_started
play_resumed
play_paused
video_progress
video_25_percent
video_50_percent
video_75_percent
video_90_percent
video_completed
video_replayed
video_abandoned
seek_forward
seek_backward
quality_changed
playback_speed_changed
mute_enabled
mute_disabled
fullscreen_entered
fullscreen_exited
pip_entered
captions_enabled
captions_disabled
buffer_started
buffer_ended
video_error
quality_switch_failed
cdn_error
chapter_clicked
```

Do not send a request for every native `timeupdate` event. The frontend should batch events and send progress heartbeats at a controlled interval, such as every 10–15 seconds while playback is active.

### Sales-funnel events

Use these for video-to-lead and video-to-sale conversion:

```text
cta_displayed
cta_clicked
cta_dismissed
lead_form_opened
lead_form_started
lead_form_submitted
lead_form_failed
end_screen_displayed
end_screen_clicked
share_clicked
download_clicked
subscription_started
subscription_cancelled
subscription_upgraded
subscription_downgraded
```

These events should include the video ID, workspace ID, CTA/form ID where applicable, playback position, and playback session ID. That allows reports such as:

- CTA conversion by video
- Form submissions by video timestamp
- Lead conversion by referrer and UTM campaign
- Conversion rate by device and browser
- Sales conversion for viewers who watched 25%, 50%, or 75%

## Next implementation steps

### 1. Add a frontend analytics client

Create:

```text
fronted/src/modules/analytics/
```

The client should manage anonymous IDs, sessions, batching, retries, and `navigator.sendBeacon()` when the page closes.

### 2. Connect the video player

Instrument:

```text
fronted/src/modules/embed/component/VideoCustomization.tsx
```

Use the existing HTML video events and the current CTA/end-screen interactions. Do not place analytics network calls directly throughout the component; use the shared analytics client.

### 3. Add funnel instrumentation

Connect CTA, lead-form, and end-screen actions to the same analytics client. Keep video and sales events in the same event envelope so they can be joined by `video_id`, `workspace_id`, and `playback_session_id`.

### 4. Add reporting APIs

The backend now exposes authenticated workspace-scoped reporting endpoints:

```text
GET /api/v1/workspaces/:workspaceId/analytics/overview
GET /api/v1/workspaces/:workspaceId/analytics/funnel
GET /api/v1/workspaces/:workspaceId/analytics/funnel/timeseries

GET /api/v1/workspaces/:workspaceId/videos/:videoId/analytics/overview
GET /api/v1/workspaces/:workspaceId/videos/:videoId/analytics/timeseries
GET /api/v1/workspaces/:workspaceId/videos/:videoId/analytics/retention
GET /api/v1/workspaces/:workspaceId/videos/:videoId/analytics/technical
GET /api/v1/workspaces/:workspaceId/videos/:videoId/analytics/funnel
```

All report endpoints require the normal Bearer token. The backend verifies that the authenticated user owns the requested workspace before querying ClickHouse. The frontend must never connect directly to ClickHouse.

Supported query parameters:

```text
from=2026-08-01                 optional; defaults to 30 days ago
to=2026-08-22                   optional; defaults to now
```

Dates may also be RFC3339 timestamps. Date ranges are limited to 366 days.

The technical report additionally supports:

```text
dimension=country              default
dimension=device
dimension=browser
dimension=os
```

The workspace funnel timeseries optionally supports:

```text
videoId=<uuid>                 restrict the funnel to one video
```

All responses use the standard envelope:

```json
{
  "success": true,
  "data": {}
}
```

The reporting layer currently provides:

- Overview totals and rates
- Daily video timeseries
- Retention milestones
- Technical breakdown by country/device/browser/OS
- Workspace sales funnel
- Video-specific sales funnel
- Daily conversion timeseries

Queries use ClickHouse `FINAL` for the raw event table so retried events can be deduplicated.

### 5. Add aggregate tables

For faster dashboard queries, create derived tables such as:

```text
video_daily_metrics
video_retention_buckets
video_playback_quality_daily
video_conversion_daily
workspace_funnel_daily
```

Raw events remain the source of truth. Aggregates can be rebuilt if metric definitions change.

## Metric definitions

Define metrics before building dashboard cards. Initial definitions should include:

```text
Qualified play:
  Playback started and at least 10 seconds were watched,
  or at least 25% of a short video was watched.

Completion rate:
  Completed playback sessions / qualified playback sessions.

Average watch percentage:
  Watched video time / video duration.

CTA conversion rate:
  CTA clicks / CTA displays.

Lead conversion rate:
  Form submissions / qualified plays.
```

Metric definitions must stay documented and versioned. Changing a formula later should create a new metric version instead of silently changing historical numbers.

## Important boundaries

- Do not store raw email addresses or raw IP addresses in viewer events.
- Do not trust client-provided user IDs for authenticated reports; derive them from the authorization token when available.
- Do not expose ClickHouse publicly in production.
- Do not use a simple view counter as the source of truth.
- Keep raw events append-only.
- Treat NATS delivery as at-least-once and make processing idempotent.
