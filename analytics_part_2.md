# Analytics Part 2 — advanced measurement and reporting

Status: proposed implementation plan. None of the new contracts in this file should be treated as an existing endpoint.

## 1. Objective and relationship to Part 1

Extend Rowley's existing player → Go API → NATS → ClickHouse pipeline to answer detailed campaign, content and playback questions while retaining workspace isolation. PostgreSQL remains the source of truth for accepted lead submissions and their saved attribution.

References:

- [Current analytics API](docs/analytics-api.md): implemented endpoints and definitions.
- [Analytics design](analytics_design.md): ten frontend destinations, shared shadcn From/To controls, Dotted Map and presentation rules.
- [Initial implementation plan](ANALYTICS.md): existing collection architecture.

Part 1 already supplies summary, series, breakdowns, video rankings, live activity, sampled concurrency and maximum-position engagement. Part 2 adds seven capabilities:

1. Per-CTA button performance.
2. Per-chapter and subtitle usage.
3. Observed watched-segment heatmaps.
4. Sequential conversion funnels.
5. Authoritative saved-lead attribution by country and campaign.
6. Cohort-correct average watch duration and advanced playback-quality statistics.
7. Filtering, sorting and exports.

“Observed watched segments” means measured media playback, not proof of human attention. “Authoritative attribution” means an attribution snapshot saved with a real accepted submission; it does not make browser-supplied campaign labels independently verified advertising evidence.

## 2. Non-negotiable scope and compatibility rules

Every report is scoped to one authorized workspace, optionally one video belonging to it. Reuse these prefixes:

```text
Workspace: /api/v1/workspaces/{workspaceId}/analytics
Video:     /api/v1/workspaces/{workspaceId}/videos/{videoId}/analytics
```

A workspace report combines only its own videos. Video reports apply the identical definitions and range semantics to a single video. Content-specific rows always include video ID; never merge matching CTA/chapter titles from unrelated videos.

Preserve current endpoints and definitions. Add explicitly named new fields and routes; do not silently redefine `views`, `playback_ms`, `form_conversion_rate` or legacy `/funnel`. New ordered funnels use `/funnels` (plural). Existing `/engagement` remains maximum-position retention; `/heatmap` is separate.

Keep all ten existing UI destinations. Place new capabilities within them, rather than adding seven more navigation items. Workspace heatmap navigation selects a video; a timeline across unrelated video durations is not meaningful.

All new historical endpoints use explicit UTC `from` inclusive and `to` exclusive timestamps, or existing inclusive calendar-date semantics. They share the design document's From/To control. Endpoint-specific limits are returned as validation errors, never silent truncation.

## 2A. Frontend settings, chart-library freedom and visual quality

This section applies to every Part 2 feature and both workspace and single-video analytics. Read it together with [analytics_design.md](analytics_design.md); advanced functionality must extend the existing product experience rather than introduce a different dashboard design.

### Required page and filter settings

- Keep the same ten destinations: Overview, Real-time, Audience, Engagement, Conversions, Playback quality, Form Submissions, CTA Clicks, Watch Time and Views.
- All nine historical destinations share the same shadcn From/To range control, presets, Apply/Cancel behavior, explicit UTC boundaries and supported hourly/daily/weekly intervals. Preserve applied settings when switching sections or drilling into a video.
- Real-time uses current activity plus its independent recent concurrency window. It must not pretend the historical range filters current viewers.
- Apply workspace/video scope, date range, filters, sort and metric version consistently to every affected widget and export. Explain endpoint-specific limits and unsupported combinations.
- Country maps continue to use `dotted-map`. Chart-library freedom does not replace the selected map package. Preserve country-level meaning, Unknown handling, accurate projection and an accessible country table.
- Reuse the existing console shell, authentication flow, shared UI primitives, TanStack Table conventions and Leads links. Keep data collection separate from presentation components.

### Any suitable chart library is allowed

Developers and AI generators may use any maintained charting library that satisfies the actual chart requirements and works with the project's React/Next.js setup. Recharts is already installed and is a convenient option, not a mandatory choice. A library change is justified by accessibility, interaction, performance or required visualization support—not by an unrelated template's default styling.

Evaluate the chosen library against these requirements before adding it:

- Compatibility with the installed framework, client/server rendering boundaries and TypeScript.
- Required time-series, bar, retention, heatmap and funnel presentations without distorting metric definitions.
- Responsive sizing, readable labels and stable layouts at mobile and desktop widths.
- Keyboard-accessible data access, useful descriptions and equivalent tables when chart interaction alone is insufficient.
- Themeable colors, fonts, axes, legends, tooltips, selection states and focus indicators.
- Acceptable bundle size and rendering cost for the largest supported dataset; lazy loading where useful.
- Suitable licensing and a maintainable integration using documented APIs.

Prefer one primary chart library. Add a specialized renderer only for a demonstrated capability gap, and keep its appearance and interaction consistent with the rest of the dashboard. Do not install multiple overlapping chart libraries just to render ordinary lines and bars.

Wrap library-specific code in shared chart components. Report fetching, metric calculations, date handling and formatting belong in reusable data/formatting layers, not inside an individual chart implementation. This lets the renderer change without changing what the metrics mean.

### Match Rowley's product design

Use existing background, card, foreground, border, muted and primary tokens, loaded fonts, radii and spacing conventions. Primary actions use `bg-primary` with a verified contrasting label. The light-theme lime primary needs dark text and must not be used as an unreadable thin line on white.

Customize chart-library defaults: no unrelated blue/purple palette, mismatched fonts, oversized tooltip shadows or rounded cartoon bars. Use restrained readable strokes, light grid lines, tabular numeric labels and consistent legends. The same metric keeps the same visual treatment across Overview, its detail page and single-video reports.

Keep charts subordinate to the owner's task. Do not add decorative gradients, glass panels, glow effects, animated counters, network arcs, fabricated insights or visual noise. Smooth transitions may clarify a user action; polling must not replay entrance animations, move controls or reset focus.

### Polish and acceptance requirements

- Every card, chart, table and map agrees on scope, applied range, units, metric version and freshness.
- Counts, durations, rates and percentile samples use the documented formatting and denominators. Do not hide missing data with a plausible-looking line.
- Loading, empty, partial-error, stale, unavailable and unauthorized states have intentional layouts and meaningful actions.
- Titles, controls, axes and numeric columns align; long names, large values and compact screens do not overlap or clip essential information.
- Tooltips work for touch or have an equivalent accessible interaction; keyboard users can obtain the same values.
- Verify approximately 1440, 1024, 768 and 390 px layouts, supported light/dark themes, reduced motion and 200% zoom.
- Review the actual rendered UI with real or explicitly labeled test data; a successful build or attractive static screenshot alone is insufficient.
- No button, filter, export action or chart interaction may imply functionality that the corresponding API has not implemented.

### Instruction for Gemini, Anti-Gravity and other UI generators

> You may choose any suitable chart library. Match Rowley's existing console design rather than the library's default theme. Keep the ten analytics destinations, shared shadcn date controls, workspace/video isolation, Dotted Map country visualization and exact metric contracts. Build reusable, responsive and accessible charts with consistent typography, spacing, colors, tooltips and data states. Do not add decorative AI-template styling, invented analytics or nonfunctional controls. Verify the rendered result across both scopes and all supported states before calling it complete.

## 3. Foundation: event, identity and configuration revisions

### Versioned event schema

The current public validator accepts only version 1 and a small properties allowlist. New fields will be stripped or rejected until validation is updated. Introduce a documented version 2 schema while continuing to accept version 1 during migration.

Add bounded, typed fields as appropriate to each event:

| Field | Purpose |
|---|---|
| `event_id` | Immutable retry identity; retain on redelivery |
| `event_version` | Parser and semantic version |
| `playback_session_id` | One mounted player session |
| `event_sequence` | Increasing integer within that playback session for client event ordering |
| `media_revision_id` | Immutable identity of the actual media version |
| `experience_revision_id` | Published CTA/chapter/form/caption configuration revision |
| `monotonic_elapsed_ms` | Elapsed time since collector initialization, unaffected by wall-clock changes |
| `occurred_at`, server `received_at` | Client event time and server receipt time, kept separately |
| `visibility`, `surface`, `is_preview` | Measurement context; preview exclusion must be server-authorized |
| `cta_id`, `chapter_id`, `subtitle_track_id` | Stable entity references, only on relevant events |

Anonymous identity remains approximate and partitioned by browser/storage behavior. Do not join people across workspaces, devices or embedding origins using fingerprinting. Session IDs and client timing aid attribution and ordering; they do not prevent deliberate telemetry forgery.

Publish immutable configuration revisions from the backend. Store entity labels and sanitized destinations in revision metadata instead of repeating free-form labels in every event. Preserve old revisions after editing/deleting a CTA or chapter so historical reports remain understandable. A replacement video must receive a new media revision; do not overlay its timeline on the old asset.

Validate version 2 entity references against the video's published revision, including stable subtitle track IDs. Do not trust an arbitrary submitted CTA ID merely because it is a UUID. Reject mismatched video/workspace/revision references. Allow a documented transition for sessions legitimately running an older published revision.

### Delivery and deduplication

Continue bounded batches, timeouts, retries and scoped analytics authorization. Define version 2 payload limits explicitly; segment arrays must fit a bounded request instead of bypassing the existing limits. A starting limit is 50 segment slices per event and 16 KiB per event, subject to load testing; adapt batching to the existing 64 KiB proxy request budget.

Deduplicate by immutable event identity before additive aggregation. Exact retries preserve ID, sequence and payload. Conflicting reuse of an event ID must be rejected or quarantined, not treated as a second event. Unique `(playback_session_id, event_sequence)` checks are an additional consistency signal, not a substitute for event IDs.

Do not feed additive materialized totals directly from an at-least-once stream and assume later raw-table replacement will undo duplicate sums. Use an idempotent derived-data stage or recompute affected bounded partitions from deduplicated raw events. Test both replay and out-of-order delivery.

Store telemetry quality indicators: missing sequences, late arrivals, unsupported versions, incomplete sessions and unavailable attribution. Do not fill missing measurements with plausible-looking values.

## 4. Per-CTA button performance

### Collection

Retain `cta_displayed` and `cta_clicked`, adding stable CTA and experience revision IDs. Define a qualified exposure as at least 50% of the rendered CTA visible for a cumulative one second while the document is visible. A click before that threshold also creates a qualified exposure so clicked sessions cannot exceed exposed sessions solely due to a fast click.

Track repeated visible occurrences separately if needed, but default reach and click rate are deduplicated per `(video, media revision, playback session, CTA ID, experience revision)`. Multiple clicks remain available as an event count. Do not equate a click with arrival at its external destination or completion of an external sale.

### Metrics

- Qualified exposure events and exposed sessions.
- Click events and exposed sessions that clicked.
- Session click rate: exposed-and-clicked sessions / exposed sessions × 100.
- Time to first click after first qualified exposure, with sample count.
- Observed post-click saved leads linked within the same playback session and declared conversion window.
- Country, referrer, device and campaign breakdowns using session attribution.

Per-CTA display rate and clicks must remain separate from end-screen buttons unless those buttons are explicitly modeled as CTA entities. Do not silently change Part 1's simpler CTA-display definition; return `metric_version` and explain the transition.

### Proposed report

```http
GET {P}/ctas?from=...&to=...&sort=clicks&order=desc&limit=25
```

Rows contain `video_id`, `cta_id`, `experience_revision_id`, title snapshot, sanitized destination origin, metrics and sample counts. Optional validated `cta_id` limits rows. With `interval=day`, return time buckets grouped by entity; do not mix this shape with ordinary aggregate rows without an explicit `mode=series` parameter.

UI: CTA Clicks page, with a button-performance table and selectable trend. Workspace rows identify the video; video scope removes the redundant video column.

## 5. Per-chapter and subtitle usage

### Chapter collection and reporting

A chapter click measures navigation, not viewing. Keep `chapter_clicked` with chapter/revision ID and destination position. Derive actual chapter viewing from the new segment measurements, intersected with immutable chapter boundaries for that media/configuration revision.

Define each chapter as `[start, next chapter start)`, with the final chapter ending at media duration. Validate sorted, nonoverlapping boundaries. Unchaptered intervals stay explicitly unassigned instead of disappearing from playback totals.

Report navigation clicks, navigating sessions, sessions that played within the chapter, playing wall time within it, unique media coverage, and replay coverage. Use source-segment allocation so chapter wall-time totals do not double count overlaps. “Completed chapter” requires measured coverage above a documented threshold, initially 90%; reaching the next chapter via seek does not count.

```http
GET {P}/chapters?from=...&to=...&sort=playback_ms&order=desc
```

Workspace results are keyed by video/chapter/revision. Video results may return a timeline ordered by chapter position. Changes in chapter layout remain versioned rather than rewriting old results.

### Subtitle collection and reporting

Add `subtitle_track_selected` with stable track ID, language, source (`manual`, `default`, or `browser_preference`) and experience revision. Observe actual text-track changes, not just menu clicks. Record captions being disabled, and annotate segment slices with the active track ID or captions-off state.

Report sessions offered captions, sessions with captions enabled, manually selecting sessions, per-track usage sessions and caption-enabled playing wall time. Automatic activation is not a manual selection. Detect browser limitations explicitly; do not infer a menu interaction from a default language.

```http
GET {P}/captions?from=...&to=...&sort=caption_playback_ms&order=desc
```

Caption usage rate uses sessions with captions available as the denominator. Return `captions_available_sessions`, `captions_enabled_sessions`, and nullable rate. A session can use several languages; per-language shares need not add up to 100% of sessions.

UI: Engagement contains Chapters and Captions subsections. Workspace compares video/entity rows; single-video scope shows that video's chapters and tracks. Do not add personal viewer identities.

## 6. Actual watched-segment heatmaps

### Collector algorithm

Add a bounded `playback_segments` event containing contiguous played slices. Each slice includes media start/end milliseconds, elapsed playing wall time, playback rate, visibility and optional caption/quality state. Samples are captured while media actually advances; the flush cadence must not determine sampling accuracy.

- Sample approximately every second while playing, supplemented by media events.
- End the current slice on pause, waiting, seeking, rate change, track/quality change, visibility change, end or unload.
- Never bridge a seek jump or long unobserved suspension. Start a new slice after the discontinuity.
- At 2× speed, roughly two seconds of media coverage can correspond to one second of wall time. Store both quantities separately.
- Validate plausible media advance against wall time and playback rate, with a documented tolerance for player timing jitter. Quarantine large discontinuities rather than counting skipped content.
- Bound segments, payload size, elapsed intervals and positions. Merge adjacent compatible slices to reduce volume without losing gaps or repeated passes.
- Mark background playback separately. Measured playback is not a guarantee that the viewer paid attention.

The new segment source and existing heartbeat source must never be added together for the same version 2 session. Select one canonical wall-time source per session/version, return the source, and compare their totals during rollout. Keep version 1 heartbeats for legacy watch-time reports; version 1 sessions have no reconstructable actual-segment heatmap.

### Aggregation and definitions

For each `(video, media revision, playback session)`:

- Union overlapping observed media intervals to measure unique coverage.
- Preserve repeated passes separately to measure replayed coverage.
- Allocate wall time proportionally when a slice crosses time bins or chapter boundaries; preserve total wall time within rounding tolerance.
- Count a session once in each heatmap bin it actually intersects, even after replay.
- Return coverage/sample quality so a coarse or incomplete observation is not presented as exact.

Primary heatmap fields per bin: `start_ms`, `end_ms`, `watching_sessions`, `playback_ms`, `unique_covered_media_ms`, `replayed_media_ms`. Define replayed media as total observed media traversal minus union coverage within each session, then sum sessions. Unique coverage across sessions is an aggregate of per-session coverage, not one global union.

For retention percentages use a declared play-start cohort, not arbitrary sessions that happened to generate events in the range. Look ahead for the bounded session observation window described in section 9. Do not divide sessions active in the range by only starts in the range.

### Proposed endpoint

```http
GET {videoPrefix}/heatmap?from=...&to=...&media_revision_id=...&bins=100
```

Initially allow 20–200 bins and a maximum 31-day cohort range. Return actual bin boundaries, eligible start-cohort sessions, measured sessions, coverage ratio, observation window and provisional status. Missing instrumentation is unavailable, not zero retention.

Workspace access uses `{workspacePrefix}/heatmap?videoId=...` with the same authorization; missing video returns 400. Workspace UI first selects a video. Never manufacture a workspace-wide media timeline.

Historical display requires matching media revision duration and thumbnail/preview metadata. Deleted media can retain aggregate results without a playable historical asset; label that state.

## 7. Sequential conversion funnels

### Templates matched to real player behavior

Do not force every video into “play → form”: before-video forms occur before playback. Introduce predefined versioned templates:

| Template | Ordered steps | Purpose |
|---|---|---|
| `preplay_lead` | Qualified impression → form opened → form started → saved submission | Before-video lead gate |
| `inplay_lead` | Play started → form opened → form started → saved submission | Forms shown during or after playback |
| `cta_response` | Play started → qualified CTA exposure → CTA clicked | CTA campaign response |
| `cta_to_lead` | Qualified CTA exposure → CTA clicked → saved submission | Only when the experience genuinely leads to an on-platform form |

Do not claim the last template tracks external destination leads without a separate authenticated conversion integration. Opening a form with untouched autofilled values may not generate a start event; report missing instrumentation and define form-start handling deliberately.

### Matching rules

- Unit: `(workspace, video, media revision, playback session)`, not individual event totals or a cross-device person.
- Cohort: first qualifying entry step within `[from, to)`.
- Match subsequent steps in order, once per session, selecting the earliest valid successor; retries and repeated clicks do not inflate conversions.
- Conversion window: default 30 minutes after entry, configurable 1–1440 minutes with bounded queries. Later steps can occur after `to`; the cohort remains based on entry time.
- Use monotonic client ordering for client steps; retain received timestamps for diagnostics. If ordering cannot be established, report unmatched/ambiguous counts instead of asserting conversion.
- The final saved step comes from the backend submission transaction, not a browser success event. Capture its playback correlation and submitted client sequence for joining, but treat client ordering evidence as untrusted telemetry.
- Freeze attribution at cohort entry, so device/country/campaign filters apply consistently across every step.
- Return unique sessions per step, previous-step conversion/drop-off, overall conversion and median time between steps with sample counts. Rates are null when denominator is absent.
- Separate finalized cohorts from cohorts still within their conversion/late-arrival window. Historical values may settle after delayed events arrive.

```http
GET {P}/funnels?template=inplay_lead&from=...&to=...&window_minutes=30
```

Initial maximum cohort range: 31 days. Multiple videos combine matching sessions, not matching labels across unrelated journeys. Existing Part 1 `/funnel` remains unchanged.

UI: Conversions page, with template selector, observation-window description and explicit saved-versus-observed steps. Do not visualize steps as a funnel unless they share this sequential cohort.

## 8. Authoritative lead attribution by country/campaign

### Write at submission time

Extend the accepted form submission transaction with an immutable attribution snapshot. Save the submission, answers, snapshot and an analytics outbox row atomically. Reporting must not depend on successful browser analytics delivery or on the CRM accepting the lead.

Suggested fields: workspace/video/form IDs, form version and placement, submission ID, server `submitted_at`, optional playback session correlation, media/experience revisions, country code and source, normalized page/referrer origins, UTM source/medium/campaign, surface, attribution schema version and provenance/status flags. Keep answer values and contact data out of analytics events and exports intended for aggregate analytics.

- Resolve country server-side through configured trusted edge headers or GeoIP on the actual form-submission request. The form proxy must preserve trusted geography correctly; analytics GeoIP configuration alone is insufficient.
- Campaign/referrer values are bounded, sanitized browser/embedding claims. Saving them makes the snapshot durable, not independently verified. Record provenance.
- Default attribution model is `submission_context`: the campaign context supplied for the successful submission. Optional first-session-touch values can be stored separately; never silently relabel last/submission touch as first touch.
- Cross-origin parents must explicitly supply campaign context through a documented validated embed integration or iframe URL. Do not assume access to the parent page's full URL.
- A retry with the same idempotency key returns the same saved submission and snapshot. It must not overwrite attribution with a later country or campaign.
- Legacy submissions have `legacy_unattributed`; do not infer their country from current viewer traffic. Distinguish unknown country from missing historical attribution.
- New submissions without a playback session still count as real saved leads. Exclude them from session funnels with an explicit unmatched count, not from authoritative totals.

### Outbox and report reconciliation

Publish a server-owned `lead_submission_saved` event from the transactional outbox. Public ingestion must reject this event name. Key downstream deduplication by submission ID. Retry delivery safely after worker restarts; mark delivery progress only after acknowledgement. Preserve the source timestamp so ingestion delay does not move leads to a different day.

PostgreSQL remains authoritative for submission-time counts. Attribution reports can initially query indexed PostgreSQL snapshots. If ClickHouse becomes the reporting replica, expose replication freshness and reconcile totals against PostgreSQL. Do not promise exact cross-store reconciliation at different query snapshots.

```http
GET {P}/lead-attribution?dimension=country&from=...&to=...
GET {P}/lead-attribution?dimension=utm_campaign&from=...&to=...
```

Rows return saved submissions/skips, attribution status, source and cohort time basis. Counts include an unattributed bucket. Saved lead country and viewer country measure different populations; label them separately. They may differ legitimately when submission occurs later or from another network.

UI: Form Submissions and Conversions; optional “Saved leads” measure on Dotted Map using this endpoint. Existing browser-observed breakdown fields must keep their original labels.

## 9. Accurate average watch duration and advanced quality

### Session cohort and lifecycle

Create one derived record per playback session and media revision. Store first play time, last received activity, observed wall time, coverage, buffer intervals, initial startup sample, error flags and finalized/provisional state.

For a bounded initial model, finalize after 90 minutes of inactivity or explicit end followed by a late-arrival grace period. A session may resume before finalization. Declare a maximum observation window of 24 hours after first play; longer sessions are marked capped, not silently presented as complete. Keep the late-arrival allowance consistent with ingestion's accepted event age, initially 24 hours. Finalization and completeness are separate concepts: unload delivery is best effort.

A rebuild can correct late events within the permitted window. Record `computed_at`, `observation_cutoff` and model version. Do not count every heartbeat as a new session or split long sessions merely at UTC midnight.

### Average watch duration

Expose both clearly named values:

- `average_observed_watch_ms`: observed playing wall time accumulated for all eligible play-start cohort sessions / those sessions, as of the observation cutoff; provisional sessions included and disclosed.
- `average_finalized_watch_ms`: observed playing wall time for finalized eligible sessions / finalized eligible sessions; return sample size and explain potential bias from excluding active sessions.

The cohort's first play must fall within the requested range. Its observation window may extend beyond the range. Do not divide period activity time by period starts: that mixes sessions that entered before the range with sessions that entered inside it. Do not claim finalized telemetry is guaranteed complete if terminal delivery or samples are missing.

### Quality statistics

- Initial startup median/p95 and mean, with valid sample count. Use one initial play-request-to-first-playing sample per session. Automatic playback and explicit play may be separate dimensions.
- Rebuffer duration median/p95 per viewed session, rebuffer event count and sessions affected. Pre-first-frame loading is startup, not rebuffering.
- Rebuffer ratio: measured rebuffer wall time / (measured playing wall time + measured rebuffer wall time). Exclude intentional pauses/seeks from both sides.
- Playback error session rate: eligible sessions with at least one supported playback error / eligible sessions, deduplicated per session.
- Failure before first play: a separate play-attempt cohort and denominator; failed starts are invisible to a started-session-only error rate.
- Quality/resolution distribution from observable media state; bitrate and dropped-frame statistics only when the player's actual APIs expose valid measurements.
- Percentiles must be computed from samples or mergeable aggregate states; never average per-video p95 values. Return sample counts and `insufficient_data` status for a product-defined minimum, initially 20 samples for percentile display.

```http
GET {P}/session-metrics?from=...&to=...&cohort=play_start
GET {P}/quality?from=...&to=...&mode=summary
GET {P}/quality?from=...&to=...&mode=series&interval=day
```

Quality report responses declare whether they use play-attempt or play-start cohorts. Sessions without observable quality data are unknown, not zero. Quality statistics remain observational, not synthetic SLA measurements.

UI: Watch Time uses the new cohort-correct durations; Playback quality uses these samples, percentiles and rates. Part 1 `playback_ms` continues to represent period activity time and is not silently replaced with lifetime time for a start cohort.

## 10. Additional filters, sorting and exports

### Shared filter contract

Extend compatible report routes with validated country, campaign, referrer origin, device, browser, OS, surface, video, media revision and preview filters. Publish a capability matrix for every endpoint; unsupported combinations return 400 instead of being ignored.

- Use exact normalized matches; bound values and list sizes. Do not accept arbitrary SQL expressions or column names.
- Same-field multi-values use OR; different fields use AND. Document URL encoding and empty/missing/Unknown semantics.
- Cohort reports apply immutable entry/session attribution. Event-activity reports apply event attribution. Saved-lead reports apply the saved submission snapshot. Return `filter_basis` so the UI does not conflate these populations.
- Under country/campaign filters, authoritative saved forms must use their snapshot predicates. Do not attach unfiltered PostgreSQL totals to filtered ClickHouse rows.
- A CTA or chapter filter affects relevant entity reports, not unrelated workspace totals. Entity dimensions require compatible endpoints.
- Page URL/referrer matching uses origins only; do not reintroduce full URLs or sensitive query strings.
- Add preview context issued by authorized owner-preview routes. A public `is_preview=false` claim is not an authorization signal. Exclusion is prospective; older unmarked traffic cannot be reliably reclassified.

### Sorting and pagination

Allow explicit sort keys appropriate to each route: views, playing time, submissions, clicks, selected rates or entity position. Use a stable entity-ID tie-breaker and `order=asc|desc`.

Use an opaque cursor for advanced rankings, binding scope, filters, range, sort, model version and an `as_of` snapshot. Reject altered or incompatible cursors. Existing offset endpoints remain backward compatible; do not combine arbitrary offsets with a new cursor contract.

Cross-store sorting by saved submissions requires aggregating the complete eligible submission dataset before pagination. Fetching a view-ranked ClickHouse page, decorating it with leads, and sorting only that page is incorrect. Include videos with saved leads but no telemetry when the ranking is explicitly by saved submissions.

### Asynchronous exports

Exports must use the same report builder, authorization, filters, metric version and snapshot as the UI. Start with CSV and JSON; an XLSX option is later work.

```http
POST   {P}/exports
GET    {P}/exports/{exportId}
GET    {P}/exports/{exportId}/download
DELETE {P}/exports/{exportId}
```

Creation payload identifies report type, range, validated filters, columns, sort and format. Accept an idempotency key so repeated clicks do not create duplicate jobs. Respond 202 with ID and status URL. Status states: queued, running, completed, failed, canceled, expired. DELETE requests cancellation and removal of the artifact where supported; report the actual outcome of races with completion.

- Export full eligible report rows, not just the visible page. Apply bounded row/date/file limits; report truncation explicitly or fail with a narrower-range suggestion.
- Fix the snapshot at job creation. Include UTC boundaries, units, model version and generated time in a manifest or metadata section.
- Escape CSV correctly, prevent spreadsheet formula injection from user-controlled strings, and preserve raw numeric values separately from human-readable durations.
- Store artifacts privately. Download must reauthorize workspace access, then stream or issue a short-lived scoped URL. Revoke/cancel appropriately when access changes.
- Do not accept an arbitrary callback/download destination URL. Set file expiry, initially 24 hours, and enforce artifact cleanup.
- Default analytics exports contain aggregates only. Exporting lead answers is a separate existing Leads permission/data contract, not an analytics shortcut.
- Bound jobs per workspace and concurrent worker resources; expose useful errors without credentials or raw query contents.

UI: real filter controls and server-backed sortable headers; Export appears only after the job lifecycle and download behavior exist. Scope, dates and model version must match the screen being exported.

## 11. Proposed API inventory and response conventions

The advanced route families are separate from the seven existing Part 1 endpoints:

| Proposed suffix | Both scopes? | New capability |
|---|---|---|
| `/ctas` | Yes | CTA entity performance and series |
| `/chapters` | Yes | Chapter navigation and observed coverage |
| `/captions` | Yes | Track availability and usage |
| `/heatmap` | Video required | Actual observed timeline segments |
| `/funnels` | Yes | Ordered template-based session funnels |
| `/lead-attribution` | Yes | Saved submission attribution |
| `/session-metrics` | Yes | Cohort-correct watch duration |
| `/quality` | Yes | Advanced playback quality samples and rates |
| `/exports` and job paths | Yes | Create, inspect, download and cancel exports |

This is nine proposed route families, with multiple HTTP operations for exports, plus extensions to existing filters/sorts. It is not a claim that nine routes alone implement all measurement work.

Retain the `{success, data}` envelope. New reports should include applicable metadata:

```json
{
  "success": true,
  "data": {
    "scope": {"workspace_id": "<uuid>", "video_id": "<uuid-or-null>"},
    "range": {"from": "<RFC3339>", "to": "<RFC3339>"},
    "metric_version": 2,
    "time_basis": "play_start_cohort",
    "filter_basis": "session_entry",
    "as_of": "<RFC3339>",
    "observation_cutoff": "<RFC3339>",
    "provisional": true,
    "coverage": {"eligible_sessions": 100, "measured_sessions": 92},
    "items": [],
    "next_cursor": null
  }
}
```

This is a shape example with placeholders, not a literal live response. Only include relevant metadata for the endpoint. Return null plus reason/sample count for unavailable advanced metrics; distinguish a measured zero from unmeasurable history. All endpoint DTOs and validation must be finalized in OpenAPI or equivalent typed contracts before UI integration.

## 12. Storage, modularity and scaling plan

Suggested additions, using explicit migrations rather than destructive resets:

- PostgreSQL immutable media/experience revisions and entity snapshots.
- PostgreSQL submission-attribution snapshot keyed uniquely by submission ID.
- PostgreSQL transactional analytics outbox with retry/lease metadata.
- PostgreSQL export jobs with workspace ownership, request hash and artifact expiry.
- ClickHouse version 2 raw events or compatible additive columns with explicit parser/version.
- ClickHouse deduplicated played slices, derived session facts and bounded report aggregates.

Partition and index by the actual workspace/time/video query patterns. Retain raw data according to the existing 365-day policy initially; segment volume may warrant a shorter separately disclosed retention after measurement. Never allow the UI to request high-resolution history already discarded without an availability response.

Use small bounded modules: collector segment sampler, event validators, revision resolver, attribution service, outbox dispatcher, session reducer, entity report services, filter compiler, export worker and API DTOs. Keep the existing frontend `player/` collector separate from dashboard presentation.

Add workers with leases and resumable checkpoints; retries must not duplicate derived results. Start with correctness-first bounded queries, benchmark realistic data, then add tested aggregates. Do not enable unlimited high-cardinality grouping or pretend a range limit alone controls scan cost.

Monitor ingestion rejects/drops, segment bytes per playback hour, outbox age, consumer lag, duplicate conflicts, session rebuild delay, unmatched lead joins, report latency, export duration and artifact cleanup failures.

## 13. Delivery sequence

1. **Contracts and migrations:** definitions, version 2 schema, immutable revisions, capability matrix, sample DTOs and backward compatibility.
2. **Saved attribution:** transactional snapshot/outbox, idempotency, country provenance and reconciliation. This improves real campaign lead reporting independently of advanced browser collection.
3. **Entity collection:** CTA exposure and chapter/caption identity, metadata validation and revision-aware reports.
4. **Segments and session facts:** continuity sampler, deduplication, source selection, provisional/finalized lifecycle and heatmaps.
5. **Funnels and advanced quality:** compatible session cohorts, ordered joins to saved submissions, sample counts and percentiles.
6. **Shared filters/ranking:** endpoint capability validation, matching cross-store predicates, stable cursor/snapshot handling.
7. **Exports and frontend:** authenticated job lifecycle, then enable the corresponding controls inside the existing ten pages.
8. **Staged rollout:** deploy readers/validators/workers before enabling version 2 emitters; gate capture by feature flag and monitor sample traffic before broad enablement.

Rollback disables new collection while preserving old readers and Part 1 reporting. Do not drop version 2 tables or overwrite historical event meaning to roll back a UI release. Mark the start date of each new measurement; do not synthesize historical segments, ordered funnels or attribution.

## 14. Acceptance and regression tests

### Event and measurement correctness

- Duplicate batches, worker redelivery and outbox retries do not increase totals.
- Out-of-order arrival produces the same finalized results; event-ID conflicts are detected.
- CTA rename/deletion and video replacement retain correct historical labels/revisions.
- Fast CTA clicks qualify exposure; repeated clicks do not inflate exposed-session rates.
- Chapter seek clicks do not count skipped content as watched.
- Default captions and manual selections remain distinct; disabled captions stop track-time accumulation.
- Seek 5s → 50s never paints the skipped interval in the heatmap.
- Pause, buffer, suspension, rate change, replay and overlapping slices preserve wall time and coverage correctly.
- Version 2 sessions are not counted from both heartbeats and segments.

### Cohorts, attribution and quality

- Sessions beginning before From do not enter play-start cohort means; their in-range activity can still appear in Part 1 period watch time.
- Sessions crossing midnight or To follow declared observation windows without arbitrary truncation.
- Zero denominators, missing samples and small percentile samples return honest status.
- Before-video lead gates use the correct funnel template.
- Funnels reject reversed step ordering and deduplicate repeated conversions.
- Saved lead counts survive blocked browser telemetry; unmatched funnel joins are visible.
- Submission retries cannot rewrite attribution; legacy records remain unattributed.
- Forged country forwarding headers are ignored without trusted ingress configuration.
- Attribution report totals reconcile at a common snapshot, including Unknown/unattributed rows.

### Authorization, filters and exports

- Every report/export denies foreign workspace/video IDs and changed ownership.
- Cursor/filter/sort tampering is rejected; identical keys have stable ordering.
- Saved-submission ranking includes eligible videos without telemetry and sorts before pagination.
- Country filters never leave saved form totals unfiltered.
- Export matches the report's scope/range/filters/snapshot and includes all eligible pages.
- Formula-like labels cannot execute as spreadsheet formulas; aggregate exports contain no lead answers.
- Canceled, failed and expired jobs clean up correctly; expired artifacts cannot be downloaded.

### Product acceptance

- Both workspace and video pages expose identical metric definitions and shared From/To behavior.
- No unavailable legacy measurement is displayed as a confirmed zero.
- Dotted Map uses country-level attribution only, with Unknown shown outside geographic markers.
- Watch Time distinguishes period activity totals from start-cohort average duration.
- Live reports remain distinct from historical funnels and quality cohorts.
- Existing forms, player behavior, Part 1 metrics and Leads/CRM workflows remain functional.

## 15. Definition of done

Part 2 is complete only when capture, validation, persistence, deduplication, reports, documentation and actual UI states agree. A newly drawn widget or an API returning an empty placeholder is not a finished capability. Publish concrete request/response examples, tested limits and metric version changes in the API guide as each feature ships, then remove its future-only warning from the design specification.
