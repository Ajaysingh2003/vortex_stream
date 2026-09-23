# Rowley analytics — dashboard design and implementation specification

Status: design specification, not a claim that these dashboard screens are implemented.
Updated: 23 September 2026.
Audience: product designers, frontend engineers, Gemini, Anti-Gravity, and other UI generation tools.

## 1. Purpose and source of truth

Build an analytics dashboard that helps a workspace owner answer five questions:

1. Are people finding and playing my videos?
2. How long do they watch, and where do they stop?
3. Which videos and campaigns generate leads?
4. Where does my audience come from?
5. Is playback working, and is anyone watching now?

The product has two equal, connected scopes: all videos in one workspace and one video belonging to that workspace. The single-video page must feel like a focused version of the workspace dashboard, with the same vocabulary, controls, and metric definitions.

Use [docs/analytics-api.md](docs/analytics-api.md) as the API contract and [ANALYTICS.md](ANALYTICS.md) for the collection architecture. If a visual idea requires data the API does not return, identify the dependency before implementing it. Never invent data or silently substitute a different metric.

The supplied Gumlet screenshots establish feature coverage, not Rowley's visual identity. Reuse Rowley's existing console shell, lime primary color, typography, and components. Do not copy Gumlet's purple theme or introduce a new application shell.

This document proposes frontend routes and components. Existing reporting endpoints are already implemented; the proposed dashboard routes are new work.

## 2. Visual direction: an everyday professional tool

The dashboard should feel maintained by a product team: calm, readable, precise, and useful during repeated daily visits. Information gets visual emphasis in proportion to its importance. The chart and tables occupy most of the page; decoration occupies almost none.

### Design systems to use together

These are complementary layers of one Rowley design system, not competing visual themes.

| Layer | Use | Avoid |
|---|---|---|
| Product foundation | Existing console layout, sidebar, breadcrumbs, workspace identity, theme tokens | A second sidebar inside analytics or a standalone marketing layout |
| Component system | Existing shadcn/Radix-based Button, Tabs, Select, Popover, Tooltip, Table, Skeleton, Sheet and Dialog | Importing a second complete UI kit |
| Data presentation | Any suitable chart library, with shared Rowley styling; TanStack Table for reusable data tables | Hand-drawn chart screenshots, mismatched table patterns, a chart library per widget |
| Geography | Installed `dotted-map` package with real country aggregates | Decorative network arcs, rotating globes, unrelated map libraries |
| Interaction system | Shared focus, loading, error, selection and disabled states | Clickable-looking elements without a working action |
| Content system | Short factual labels and explicit metric definitions | Promotional headings, exaggerated insights, or made-up conclusions |

Design alternatives considered: a colorful card grid is easy to scan but adds unnecessary visual noise; a dense spreadsheet-only layout is precise but weak for trends; a decorative dark monitoring wall overemphasizes live activity. Use a restrained console dashboard with a dominant trend chart and compact supporting tables. Respect the existing dark theme when enabled; do not force dark mode specifically for analytics.

### Rules for avoiding generic AI-generated UI

- Start with the owner's questions, not a symmetrical collection of cards.
- Use a plain title such as “Analytics.” Do not write “Unlock powerful insights” or “Your command center.”
- Do not add sparkle icons, AI badges, gradient headlines, glass panels, glowing borders, floating blobs, oversized pills, or decorative grid backgrounds.
- Do not put every number in a differently colored card. Metric cards can have no icon at all.
- Do not animate numbers counting up on load. Values should be readable immediately and remain stable during refresh.
- Use genuine differences in content density: a wide trend chart, a country list beside its map, and a dense video table. Do not force every section into an identical square.
- Give sections specific names: “Views over time,” “Audience by country,” “Videos,” “Form submissions.”
- Do not render fake “AI insights,” invented percentage changes, sample avatars, or country activity in a production empty state.
- Avoid meaningless precision. A rate is normally `42.6%`, not `42.638291%`.
- Use borders and whitespace for grouping. Reserve shadows for floating menus and overlays.
- Choose one icon family within analytics, matching nearby console controls. Do not mix outline, filled, and multicolored icons.
- A beautiful screenshot is insufficient: verify loading, errors, long titles, no activity, scope switching, mobile layout, and keyboard use.

## 3. Foundation tokens and component styling

Inspect these files before coding:

- `fronted/src/app/globals.css`: colors, surfaces, radii and theme tokens.
- `fronted/src/app/layout.tsx`: Inter and Instrument Sans font setup.
- `fronted/src/components/ui/`: shared primitives.
- `fronted/src/modules/console/component/ConsoleLayout.tsx`: application shell.
- `fronted/src/modules/leads/components/LeadsTable.tsx`: existing TanStack Table conventions.
- `fronted/src/modules/analytics/component/Map.tsx`: existing decorative map, with limitations described below.

### Color and contrast

| Role | Rule |
|---|---|
| Page and panels | `bg-background`, `bg-card`, `text-foreground` |
| Secondary surfaces | `bg-muted` or existing `bg-surface`, used sparingly |
| Dividers | `border-border`, one-pixel borders |
| Supporting text | `text-muted-foreground`; never use near-invisible labels |
| Primary action | `bg-primary` with a verified contrasting foreground |
| Selected control | Subtle primary tint, visible border or underline, and explicit selected state |
| Chart series | Dark readable stroke in light mode; light readable stroke in dark mode; primary used for selection/accent |
| Previous period | Muted dashed stroke with a legend label |
| Positive/negative change | Accessible semantic text plus an arrow/sign; color is supplementary |
| Error | Existing destructive styling with a readable message and retry action |

Current light-theme `--primary` is lime `#d1ff46`. The current `--primary-foreground` is very light and is unsuitable for text on that lime background. Follow the existing Leads pattern with a dark label, then verify both themes; do not blindly pair these two tokens. If a shared token correction is needed, review its effects across the application rather than making unrelated global changes during analytics work.

Lime on white is also too weak for a thin chart line or essential map detail. Use a dark outline/contrasting stroke. Do not adopt old purple `--brand-primary` values or marketing gradient classes as analytics styling. Use the current console's semantic tokens.

### Typography, spacing and sizing

- Use the fonts already loaded by the app; add no font dependency. Confirm computed font styles because global aliases can override font variables.
- Page title: 24–28 px, semibold. Section heading: 15–16 px, semibold.
- Metric value: 28–32 px, medium/semibold, tabular numerals.
- Body, filters and table cells: 13–14 px. Supporting labels: 12–13 px. Do not shrink essential text below 12 px.
- Use a 4 px spacing scale: 4, 8, 12, 16, 24, 32. Panel padding: 20–24 px desktop, 16 px mobile.
- Content width: fill the console area up to approximately 1440 px; center within larger screens.
- Page gutters: 24–32 px desktop, 16 px mobile. Main section gap: 24 px; related controls: 8–12 px.
- Use existing `rounded-lg`/`rounded-xl` tokens, generally around 10–14 px. Do not create oversized 24 px corners on every panel.
- Desktop controls: roughly 36–40 px tall; touch targets at least 44 px where practical. Table rows: approximately 48–56 px.
- Keep labels, values, comparison lines and table headers aligned across columns. All layout columns need `min-w-0` to prevent overflow.

## 4. Workspace and video information architecture

### Proposed canonical frontend routes

```text
/console/workspaces/[workspaceId]/analytics
/console/workspaces/[workspaceId]/analytics/[videoId]
```

Both live inside the existing console layout. Explicit workspace IDs make bookmarks and shared internal links unambiguous. The current app resolves workspace context with `trpc.user.getWorkspace`; it does not justify inventing an unimplemented multi-workspace switcher. When several accessible workspaces are supported, use the real workspace list and authorization checks.

Optional convenience entry `/console/analytics` may resolve the current workspace and redirect to its canonical route. Do not maintain a second implementation there. A video-detail “Analytics” link should point to the canonical video route, not create another dashboard under content-library routes.

### Navigation behavior

- Workspace breadcrumb: `Workspace name / Analytics`.
- Video breadcrumb: `Workspace name / Analytics / Video title`.
- Video page includes “All videos” as a clear link back to workspace analytics, preserving historical date range and suitable tab selection.
- A video title, small thumbnail if available, and “Open video” link establish identity. Do not add a large autoplaying preview above the analytics.
- Clicking a title in the workspace video table opens its single-video analytics.
- Changing workspace clears the selected video and old data immediately. Never carry a video ID into another workspace's requests.
- Wrong-workspace, missing and inaccessible videos get a scoped unavailable state. Never fall back silently to workspace totals.
- Keep the existing console shell. When entering analytics, render the ten analytics destinations as a scoped group in the existing sidebar, with a clear back-to-console action. Do not add a second full-height sidebar beside it. On mobile, use a labeled section selector or the existing sidebar Sheet; do not squeeze ten labels into one tab row.

### Canonical tabs: same ten destinations in both scopes

Preserve these values as stable URL identifiers. Use the user's chosen order and icons; pluralize the submission label for clarity. No extra top-level tab is required: impressions and unique viewers belong under Views, geography under Audience, retention under Engagement, and video rankings within workspace reports.

```tsx
import {
  LayoutDashboard, Radio, Users, ChartNoAxesCombined,
  MousePointerClick, Activity, FormInput, Timer, Eye,
} from "lucide-react";

const ANALYTICS_TABS = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "live", label: "Real-time", icon: Radio },
  { value: "audience", label: "Audience", icon: Users },
  { value: "engagement", label: "Engagement", icon: ChartNoAxesCombined },
  { value: "conversions", label: "Conversions", icon: MousePointerClick },
  { value: "playback", label: "Playback quality", icon: Activity },
  { value: "form_submissions", label: "Form Submissions", icon: FormInput },
  { value: "cta_clicks", label: "CTA Clicks", icon: MousePointerClick },
  { value: "watch_time", label: "Watch Time", icon: Timer },
  { value: "views", label: "Views", icon: Eye },
] as const;
```

All ten pages use the same scope-aware data layer. Conversions is a summary of conversion activity with links to the dedicated forms and CTA pages; Engagement covers completion/progress, while Watch Time focuses on duration. Avoid three pages showing the same generic dashboard.

| Tab value | Workspace | Single video | Time behavior |
|---|---|---|---|
| `overview` | Totals, main trend, country preview, video ranking | Totals/trend for this video, progress preview | Shared From/To |
| `live` | Current sessions, unique browsers, countries, active videos | Same, restricted to this video | Now plus independent recent concurrency range |
| `audience` | Countries, referrers, device/browser/OS, campaigns, placement | Same dimensions for this video | Shared From/To |
| `engagement` | Completion, replays, progress averages, per-video comparison | Same plus six retention buckets | Shared From/To |
| `conversions` | Saved leads and observed form/CTA/end-screen summary | Same plus link to this video's Leads page | Shared From/To |
| `playback` | Startup, buffers, errors and trends | Same for this video | Shared From/To |
| `form_submissions` | Saved submission/skip totals, trend, video contribution | Same plus existing Leads navigation | Shared From/To, submission time |
| `cta_clicks` | CTA displays/clicks, exposed/clicking sessions, rate | Same for this video | Shared From/To |
| `watch_time` | Playing time, time trend, video/country contribution | Same without workspace video ranking | Shared From/To |
| `views` | Views, unique viewers, impressions, play rate | Same for this video | Shared From/To |

Store tab and chart selection in the URL when useful. An example:

```text
/console/workspaces/<workspaceId>/analytics/<videoId>?tab=overview&from=2026-09-17&to=2026-09-23&interval=day&metric=views
```

Validate all URL values. Unsupported values fall back to documented defaults without crashing the screen. Browser back/forward must restore controls and data consistently.

## 5. Layout specification

### Workspace Overview, desktop

```text
Existing console sidebar and header
Workspace / Analytics
Analytics                          Date range [Last 7 days]  UTC
Current section: Overview          (ten destinations in the sidebar)

Views              Unique viewers       Impressions        Playing time
12,480             9,230                18,740             186h 24m
comparison         comparison           comparison        comparison

Views over time                              Metric [Views]  [Daily]
[wide time-series chart; axes, hover values, restrained legend]

Audience by country
[Dotted Map, approximately 60% width] [ranked country list, 40%]

Videos                                             [pagination]
Title                   Views    Unique viewers    Playing time    Forms
...
```

Numbers above are wireframe examples only. They are not production fallback data.

Show form submissions, CTA clicks and completion in a compact supporting metrics row or their relevant tabs, rather than expanding the first viewport to twelve equal cards. No empty “Add report” tile in the initial release unless a real report-builder feature is implemented.

### Single-video Overview

Keep the same header, filters, four primary metrics and main chart. Replace the workspace video table with “Playback progress” and a compact conversions section. Include a link to the existing Leads page at `/console/content-library/video/[videoId]/leads`.

The date range and workspace remain visible when drilling into a video. Do not accidentally reset the date to the backend default of 30 days.

### Responsive rules

- Large desktop: four primary metrics in one row; map and country table side by side.
- Tablet: two-by-two metrics; controls wrap cleanly; map/list may stack if text becomes cramped.
- Mobile: two metric columns where values fit, otherwise one; analytics navigation uses the existing Sheet or a section selector; filters stack; map above the country list.
- Preserve table structure inside a labeled horizontal scroll region. Pin only the title column when it remains usable. Allow less important columns to be hidden through a real column control.
- Chart heights: approximately 300–340 px desktop, 220–260 px mobile. Do not compress labels to fit a fixed 16:9 ratio.
- No page-wide horizontal scrolling. Long titles truncate visually but remain available through an accessible label or detail link.

## 6. Metrics and honest presentation

| UI label | API value | Presentation |
|---|---|---|
| Views | `views` | Integer; actual playback sessions, not page visits |
| Unique viewers | `unique_viewers` | Approximate distinct browsers, not verified people |
| Impressions | `impressions` | Player sessions visible at least 50% |
| Playing time | `playback_ms` | Human-readable duration; axis units stated explicitly |
| Completed views | `completions` | Viewed sessions with an ended event |
| Completion rate | `completion_rate` | One decimal percent; scope/date cohort explained |
| Form submissions | `form_submissions` | Saved completed submissions, authoritative where available |
| CTA clicks | `cta_clicks` | Event count, distinct from clicking sessions |
| CTA click rate | `cta_click_rate` | Exposed sessions that clicked / exposed sessions |
| Form conversion rate | `form_conversion_rate` | Observed opened sessions that submitted / observed opened sessions |
| Average startup | `average_startup_ms` | Format in milliseconds or seconds; play request to playing signal |
| Buffering time | `buffer_ms` | Total observed buffering duration |
| Playback errors | `errors` | Event count; no invented error rate |
| Live playing sessions | `active_sessions` from `/live` | Separate from unique browsers; freshness displayed |

Formatting rules:

- Never render duration with a time-of-day formatter that wraps after 24 hours. `186h 24m` is valid.
- Use localized integers; compact notation is optional for crowded chart axes, with full values in tooltips.
- A rate with no denominator is shown as `—` with “Not enough activity,” even though the API returns zero. Use its documented denominator to make this distinction.
- A current/previous comparison of zero-to-zero is “No change.” Previous zero and current positive is “New.” Never show Infinity or calculate a fake percentage.
- For rates, express comparison differences in percentage points, e.g. `+2.1 pp`, unless explicitly calculating relative change.
- Higher errors/startup/buffering are worse; higher volume is not automatically proof of better campaign performance. Use restrained neutral changes for volume and clear labels for quality.
- Use API summary totals, not sums of daily unique viewers, averages of chart rates, or sums of per-video uniques.
- Do not claim the existing progress buckets are actual watched-segment heatmaps. Seeking forward affects maximum position reached.
- Saved form totals can exist before analytics collection began. Show those totals without fabricating matching historical impressions or countries.

### Conversions layout

Use two clearly separated sections:

1. **Saved submissions:** authoritative form totals and skips, with a time series and Leads link where supported.
2. **Observed interactions:** form opens, starts, failures, observational conversion rate, CTA displays/clicks/rate and end-screen actions.

Do not draw a connected funnel from unrelated aggregate counts. The current reports do not establish a complete sequential, cross-step campaign funnel. In particular, do not divide authoritative saved submissions by browser-observed opens and label the result as the API's conversion rate.

## 7. Time-series and chart system

Any suitable maintained chart library may be used. The existing `recharts` dependency is a convenient option, not a requirement; do not confuse it with the similarly named `rechart` package. Prefer one primary library behind reusable chart containers and apply Rowley tokens consistently. Follow the library-selection, accessibility and polish requirements in [analytics_part_2.md](analytics_part_2.md#2a-frontend-settings-chart-library-freedom-and-visual-quality).

- Default historical range: last seven calendar days including today, explicitly sent to the API. Display “UTC”; the current day is partial.
- Presets: Today, Yesterday, Last 7 days, Last 30 days, Custom. Custom maximum 366 days.
- Default interval: daily. Offer hourly only up to 31 days; weekly uses Monday UTC. Explain disabled choices.
- Use one metric per main chart by default. Avoid dual-axis charts that make unrelated scales appear correlated.
- Counts use nonnegative axes and sensible integer ticks. Rates use a 0–100% axis. Durations display a labeled consistent unit for that chart.
- Use restrained lines or bars, light horizontal grid lines, no heavy vertical grid, and no large gradient area fill.
- Draw zero-filled successful series correctly. An API error or unavailable bucket is not zero; do not bridge unavailable data as if observed.
- A comparison toggle requires a separate previous-period `/series` request with equal-length bounds. Summary comparison fields do not contain a previous-period chart. Align by relative bucket and show actual dates in tooltips.
- Tooltips show date/time, full value and unit. Keyboard users must be able to obtain equivalent data through a compact accessible table.
- Chart selected metric persists across scope navigation only if valid in both scopes.
- No entrance animation on every polling refresh. Respect reduced motion for any optional transition.

### Shared shadcn From/To control — required on every historical page

Compose the range picker from existing shadcn `Button`, `Popover`, `Label`, `Input` and a range-mode `Calendar`. The official [Date Picker guide](https://ui.shadcn.com/docs/components/radix/date-picker) describes this composition; the [Calendar guide](https://ui.shadcn.com/docs/components/radix/calendar) covers the calendar component. The repository has Popover/Input/Button but no `components/ui/calendar.tsx` at the time of this specification. Add the compatible shadcn Calendar and its required dependency during UI implementation; do not import a nonexistent ready-made `DateRangePicker`.

Proposed desktop toolbar:

```text
Watch Time                   From [17 Sep 2026]  To [23 Sep 2026]
                             [Last 7 days ▾] [Daily ▾] [Apply]  UTC
```

The From and To fields control one shared range; clicking a calendar affordance opens a single range calendar. Two visible labels make the boundaries explicit. Desktop can show two calendar months; mobile uses one month in a properly sized popover or existing Sheet. Reuse shared borders, focus rings, buttons and typography. Apply uses `bg-primary` with a contrasting dark label. Do not build a custom untested calendar grid.

Behavior contract:

- Maintain `draftRange` while editing and `appliedRange` for requests. Apply commits both dates together, updates the URL, resets pagination and refreshes every widget on the active historical page.
- Cancel/Escape discards uncommitted edits and returns focus. An incomplete or invalid range keeps Apply disabled and displays a specific inline explanation.
- From must be on or before To; selecting the same date means that entire UTC day. Reject nonexistent typed dates, invalid timestamps and ranges over 366 days. Do not silently swap dates or interpret invalid input as today.
- Historical calendar dates cannot be later than today UTC. Exact-time mode cannot end after now. Raw telemetry retention is 365 days; explain that older event results may have expired, while saved form history can still exist.
- Presets fill both boundaries. Apply behavior is identical for presets and custom ranges. Reset restores the default seven-day range; it must not send missing parameters and fall back to the API's 30 days.
- Date-only values are calendar strings, not browser-local timestamps. Send `from=2026-09-17&to=2026-09-23` for inclusive UTC calendar days. Do not convert a date picker's local-midnight `Date` with `toISOString()` and accidentally shift the day.
- If exact hours/minutes are required, offer an explicit “Include time” mode using labeled shadcn time inputs. State UTC beside each boundary. Send RFC3339 timestamps: From inclusive, To exclusive. For example 09:00–12:00 sends `from=2026-09-23T09:00:00Z&to=2026-09-23T12:00:00Z`. Do not add a day to a timestamp To value.
- Display the applied range above reports and in chart descriptions. One range drives summary, series, breakdowns, ranking and retention; no panel may silently use its own default.
- All nine historical sections preserve this applied range when switching sections or entering/leaving a video. Real-time preserves it in state/URL for return navigation but does not apply it to `/live`.
- Changing to a range longer than 31 days switches an hourly interval to daily and explains the adjustment. A custom concurrency range remains independent and cannot exceed 48 hours.
- Comparison means the previous equal-length interval. Use `/summary.previous_range` to request the matching comparison series. Label actual boundaries, particularly when the current day is partial.
- A shareable URL contains applied values only, never half-edited draft input. Refresh, deep links and browser back/forward reconstruct the same valid range.

### Date and scope request example

The same query is used at either prefix. The page selection changes which metric is rendered, not the validity of the scope.

```text
Workspace watch time:
GET /api/v1/workspaces/{workspaceId}/analytics/summary?from=2026-09-17&to=2026-09-23
GET /api/v1/workspaces/{workspaceId}/analytics/series?from=2026-09-17&to=2026-09-23&interval=day

Video watch time:
GET /api/v1/workspaces/{workspaceId}/videos/{videoId}/analytics/summary?from=2026-09-17&to=2026-09-23
GET /api/v1/workspaces/{workspaceId}/videos/{videoId}/analytics/series?from=2026-09-17&to=2026-09-23&interval=day
```

Use `data.current.playback_ms` for the total, `data.previous.playback_ms` for comparison and each `data.items[].metrics.playback_ms` for the chart. Keep raw values in milliseconds until the presentation layer formats them. Selecting Watch Time does not require a new `/watch_time` backend route.

### Page-by-page data contracts for all ten destinations

Below, `P` means the active workspace or video API prefix. All historical calls carry the same applied `from` and `to`; `/series` also carries `interval`. Summary values come from `data.current`, previous values from `data.previous`, and series/breakdown rows from `data.items[].metrics`. Use the complete DTO in the API guide rather than inventing alternate field names.

#### Overview (`overview`)

- Cards: `views`, `unique_viewers`, `impressions`, `playback_ms` from `P/summary`; secondary totals `form_submissions`, `cta_clicks`, `completion_rate` link to their detail sections while preserving scope/range.
- Chart: `P/series`, initially `views`; allow the four primary metrics.
- Country preview: `P/breakdown?dimension=country`; workspace videos: workspace `/videos`.
- Video scope may show a small `P/engagement` preview; never request workspace-wide retention without selecting a video.

#### Real-time (`live`)

- Cards: `/live.active_sessions`, `unique_viewers`, `as_of`, `window_seconds`. The live response does not have a `current` wrapper.
- Country map/list: `/live.countries`; workspace active videos: `/live.videos`. Those rows contain IDs, so obtain titles through authorized video metadata rather than guessing names.
- Chart: `P/concurrency` with explicit recent timestamps, at most 48 hours; each item has `key`, `active_sessions`, `unique_viewers`. Zero-fill missing minutes only after a successful response.
- Do not use historical unique-viewer counts as live users, display historical comparison badges on these live cards, or imply exact instantaneous presence.

#### Audience (`audience`)

- Context totals: `unique_viewers` and `views` from `P/summary`.
- Main map/list: `P/breakdown?dimension=country`. Alternate dimension selector supports referrer, page, device, browser, OS, utm_source, utm_medium, utm_campaign and surface.
- Row values: views, unique viewers and playing time; optional explicitly labeled observed submissions. Surface distinguishes `embed` and `video_page`.
- A breakdown is an aggregate for the selected range. The API does not provide a per-country time series or country-filtered summary. Do not chart selected-country changes by reusing the global series.

#### Engagement (`engagement`)

- Cards: `completions`, `completion_rate`, `replays`, `average_progress_percent` from `P/summary`.
- Chart: selectable completion count/rate or replays from `P/series`. Explain bucket-specific cohorts and never average rate buckets into the total.
- Video scope: `P/engagement` supplies `bucket`, `sessions`, `percent` for discrete retention bars.
- Workspace scope: workspace `/videos` provides completion/progress columns in its view-ranked table. Selecting a video opens its retention detail. Do not average videos' retention curves to fabricate workspace retention.
- Zero-view ranges show no-data for rate/progress cards rather than suggesting measured 0% engagement.

#### Conversions (`conversions`)

- Cards: `form_submissions`, `cta_clicks`, `form_conversion_rate`, `cta_click_rate` from `P/summary`.
- Separate saved-submission and observed-interaction sections. Form sessions: `form_opened_sessions`, `form_converted_sessions`; CTA sessions: `cta_exposed_sessions`, `cta_clicking_sessions`.
- Trend: `P/series` with selector for saved submissions, CTA clicks or either observational rate; one unit at a time.
- Supporting values: `end_screen_displays`, `end_screen_clicks`; links to dedicated Forms and CTA pages.
- Do not imply these disconnected totals form a sequential funnel, attributable revenue, or CRM success metrics.

#### Playback quality (`playback`)

- Cards: `average_startup_ms`, `buffer_events`, `buffer_ms`, `errors` from `P/summary`.
- Chart: `P/series` with separate modes for startup duration, buffering duration, buffer count and error count. Keep duration and count units separate.
- Breakdown: `P/breakdown` by browser, OS or device, rendering quality fields from each row. Workspace video table can show the same fields using workspace `/videos`.
- Format startup in ms or seconds, buffering as duration, and counts as integers. Never average per-bucket startup means into the range mean; use summary.
- The current API does not expose startup sample counts. When returned average startup is zero, explain “No positive startup duration recorded”; do not claim zero-latency playback. If a dependable no-samples distinction is required, add the sample count to the backend first.
- Higher startup/buffering/errors is unfavorable, unlike completion rate. Do not show a green improvement badge for an increase. Do not invent p95 latency, bitrate, CDN-level error causes, or an error percentage without supporting data.

#### Form Submissions (`form_submissions`)

- Cards: saved `form_submissions`, saved `form_skips`, observed `form_opens`, observed `form_conversion_rate`. Clearly label each source.
- Chart: `P/series` saved submissions by hour/day/week, with an optional separate skips series in the same count unit.
- Supporting observed values: `form_starts`, `form_failures`, `observed_form_submissions` and session denominators.
- Workspace table: workspace `/videos`, showing saved submissions and skips alongside video title. It remains ranked by views; do not call it “Top videos by leads” without a supporting sort endpoint.
- Video scope: link to the existing Leads page for individual submitted answers and CRM delivery. Analytics returns aggregates, not contact rows; do not generate a fake submissions table from counts.
- Historical saved totals do not require telemetry, but the `/videos` ranking only includes videos with telemetry. Thus the ranking may not account for every historical submission; label this limitation rather than forcing totals to match.
- Country/referrer breakdowns can show `observed_form_submissions` only. Never label those as authoritative saved submissions when `saved_form_counts_available` is false.

#### CTA Clicks (`cta_clicks`)

- Cards: `cta_clicks`, `cta_displays`, `cta_click_rate`, `cta_clicking_sessions`; supporting denominator `cta_exposed_sessions`.
- Chart: `P/series` clicks/displays as counts, or CTA rate on a separate percent mode.
- Breakdowns: `P/breakdown` by country/referrer/campaign/device; select the CTA fields in each row. Server ordering remains views, not clicks.
- Workspace video comparison uses workspace `/videos`; video scope uses the same summary and breakdown endpoints restricted to that video.
- A per-CTA button/ID/destination report is not currently exposed. Although events carry CTA IDs, do not invent a `dimension=cta_id` endpoint, CTA heatmap, or per-button conversion table.

#### Watch Time (`watch_time`)

- Primary total: `playback_ms`; previous total and delta from `/summary`. Supporting context: `views`, `completions`, `completion_rate`.
- Chart: `P/series.metrics.playback_ms`, formatted as seconds/minutes/hours consistently for the visible range. Label “Playing time”; explain that Watch Time and Playing time refer to this same metric.
- Country/referrer/device contribution: `P/breakdown` with `playback_ms`. Workspace video table: workspace `/videos` with duration and views; server still ranks by views.
- Do not present `playback_ms / views` as a reliable average session duration: watch time may include sessions that started before the range, while views counts starts within it. Accurate average session duration requires a defined compatible session cohort and additional backend support.
- Playing time measures actual playing wall time, excluding pause/buffering/seeking. Do not use video length × views, maximum position, or completion percentage as a replacement.
- Display durations beyond 24 hours correctly. Tooltips retain exact duration; zero and unavailable are distinct states.

#### Views (`views`)

- Cards: `views`, `unique_viewers`, `impressions`, `play_rate`; supporting numerator `impression_play_sessions`.
- Chart: `P/series` with Views, Unique viewers, Impressions or Play rate selection. Use counts and percentages in separate modes.
- Workspace ranking: workspace `/videos` with the same fields; both scopes support country/referrer/campaign/surface breakdowns.
- Unique viewers are approximate browser counts. Never sum hourly/daily/video uniques to form the range total. A user may appear in several dimensional rows.
- All three volume metrics belong here; extra sidebar destinations for Impressions and Unique viewers are unnecessary.

### Data coverage and extension boundaries

The ten pages cover every current report family. Secondary metrics such as end-screen activity, form failures, startup delay, play rate and replays must be placed as specified rather than omitted just because they are not sidebar labels. Existing capture of chapters/captions does not automatically supply chapter-level or subtitle-level reporting endpoints.

The following require explicit backend work before UI exposure: per-CTA aggregation; per-chapter/caption reports; arbitrary breakdown filters and sorting; accurate mean watch duration; authoritative per-lead attribution; named-user journeys; sequential funnels; quality percentiles and compatible error-rate denominators. Country data also depends on production trusted-edge/GeoIP configuration. Mark these as unavailable capabilities in implementation notes, not fabricated widgets.

## 8. Dotted Map integration

Dotted Map is the chosen map package. It is already installed at version 3.1.0. The official library supports SVG generation, geographic pins and precomputed grids with a lighter browser import. Check the installed types before implementation; see the [official Dotted Map documentation](https://github.com/NTag/dotted-map).

### Existing component audit

`fronted/src/modules/analytics/component/Map.tsx` currently draws animated origin/destination arcs, glows and pulses. It is a decorative component, not a country analytics visualization. Its manual linear coordinate projection and separately fitted background can misalign markers. Do not copy that projection or use animated traffic arcs to imply viewer movements the API never measured.

Create an analytics-specific map adapter and presentation component. Other uses of the decorative map can remain unchanged.

### Data contract and geographic meaning

Historical map source: `/breakdown?dimension=country`, in the active workspace/video scope and date range.
Live map source: `/live.countries`, explicitly labeled as current activity.

The API supplies country codes and aggregates, not viewer coordinates. Add a reviewed, licensed ISO alpha-2 country lookup with display names and representative country points. Use the term “Country-level location.” A representative point does not identify a viewer's city, address or precise location. Keep the dataset source/license alongside the file.

Normalize into a presentation model such as:

```ts
type CountryActivity = {
  code: string;
  name: string;
  value: number;
  point?: { lat: number; lng: number };
};
```

Unknown or unmapped codes stay in the accessible country list and totals, without a geographic marker. Never place Unknown at `(0, 0)`, infer a country from language, or invent coordinates. Verify small territories and country-code exceptions in the lookup.

### Visual treatment

- Neutral, small land dots on the panel background. Clear country markers with a dark outline and restrained primary accent.
- Default measure: Views. Allow Unique viewers and Playing time using actual returned metrics. Keep map title, list header and tooltip units synchronized.
- Show a few graduated marker sizes, with a legend and capped square-root scaling. Do not enlarge one country until it hides neighboring countries.
- Represent data as country markers on the dotted basemap, not a filled-country choropleth that has not been implemented.
- Selected country has a clear outline and matching table-row emphasis. Hover, keyboard focus and table selection expose the same detail.
- Do not use pulsating dots for ordinary historical activity. Live mode needs a timestamp, not perpetual animation.
- Do not add zoom controls unless they genuinely zoom map and markers together. A fixed world map plus table is acceptable for the first release.
- Small and overlapping countries must remain discoverable in the table. Never move a marker geographically merely to make a design look cleaner.

### Implementation and performance

Precompute the base grid outside the render path using `getMapJSON`, then use `dotted-map/without-countries` for the browser adapter. Choose a moderate grid density and measure rendering cost. Use the library's pin/projection coordinates and image dimensions consistently for both map and overlays; do not combine an independently scaled image with hand-written latitude-to-pixel formulas.

Keep base geometry stable across polling. Build fresh data-dependent pins or reconcile them deliberately so repeated refreshes do not accumulate markers. Memoize by normalized dataset and theme. Lazy-load the map without delaying the summary or tables. Country selection must not regenerate the base world grid.

For interaction, render trusted geometry as React SVG elements with accessible controls, or a decorative SVG image accompanied by the fully operable country list. An `<img>` generated from an SVG string does not provide independently focusable country pins. Do not inject API labels into raw SVG markup.

### Country table and pagination

- Columns: Country, selected measure, and optionally share of views.
- Show top countries in the overview with “View all countries” opening the Audience tab.
- Breakdown requests allow at most 100 rows. Fetch additional pages before claiming the map covers all returned countries; do not assume one page represents the world.
- Only display a global share after loading the complete corresponding country dataset and defining its denominator, including Unknown. Country unique-viewer totals need not add up to workspace unique viewers, so do not label their shares as mutually exclusive percentages of all people.
- Map selection only highlights country detail locally. The current API does not support a global `country=...` report filter. Do not make the rest of the dashboard pretend to filter.
- A failed map load leaves the country table usable. A failed country request shows an error, not an empty world suggesting zero viewers.

## 9. Tables and breakdowns

Reuse TanStack Table and existing UI table primitives. Share header alignment, row hover, loading skeletons and pagination with the Leads/video tables.

Workspace video columns: title, views, unique viewers, playing time, completion rate, saved form submissions and CTA clicks. On small widths, prioritize title, views and forms. Numeric cells align right. Video titles are links with accessible names. Thumbnail URLs require a metadata source; the analytics video endpoint supplies title and ID, not thumbnails.

The API ranks video/breakdown rows by views. Do not show arbitrary server-sort controls or sort a single fetched page while implying the whole dataset was sorted. There is no total-result count: use Previous/Next and “Showing 1–25,” not a fabricated “Page 1 of 42.” A short response page is the end; an exactly full final page can require one additional request.

Search across every video requires an actual supporting endpoint or a complete authorized dataset. Do not label a current-page text filter “Search all videos.” Videos without telemetry may be absent from the ranked list; explain this in an empty state rather than claiming the workspace has no videos.

Audience breakdown options: country, referrer, page origin, device, browser, OS, UTM source, medium, campaign and surface. Use one labeled dimension selector rather than ten tiny tabs. Preserve `Direct / unknown` and `Unknown` labels accurately.

`form_submissions` and `form_skips` are not authoritative country/referrer/device breakdowns. When `saved_form_counts_available` is false, omit these columns; use explicitly labeled “Observed submissions” only if needed. Do not display placeholder zeroes as confirmed no leads.

## 10. Live and playback detail

Live tab has its own time context. Replace the historical date picker with “Now” and a recent concurrency range: last hour, six hours or 24 hours. Do not let users believe last month's dates filter live viewers.

Show:

- Live playing sessions, approximate unique browsers, and `as_of` time.
- “Based on recent playback activity; sessions expire after 90 seconds.”
- Country activity and active videos, scoped to the current workspace/video.
- Sampled activity per minute, labeled “Active sessions observed per minute.” It is not an exact historical peak.

Poll live about every 10 seconds while visible. A failure retains previous values only with a clear stale indicator; stop the “Live” treatment until a successful refresh. Do not use the fetch timestamp alone to claim the pipeline is healthy—worker delivery can lag.

Playback quality focuses on startup, buffer count/time and errors; Watch Time owns duration detail, and Engagement owns completion/replays/progress. Video retention uses six discrete buckets: 0, 25, 50, 75, 90, 100. Use labeled bars or points, not a fabricated second-by-second smooth heatmap. Explain that 100 means an ended event, while intermediate values are positions reached.

## 11. API wiring and state architecture

Backend prefixes:

```text
Workspace: /api/v1/workspaces/{workspaceId}/analytics
Video:     /api/v1/workspaces/{workspaceId}/videos/{videoId}/analytics
```

| Component | Endpoint |
|---|---|
| Primary cards, comparisons, quality/conversion totals | `/summary` |
| Main and conversion charts | `/series` |
| Country and audience tables | `/breakdown?dimension=...` |
| Workspace video ranking | Workspace `/videos` |
| Live totals, countries, videos | `/live` |
| Recent sampled concurrency | `/concurrency` with explicit range ≤48 hours |
| Video progress buckets | Video `/engagement` |

Use the existing authenticated server/tRPC flow; do not expose owner tokens in public player props, URL parameters or browser local storage. Public ingestion tokens are not report credentials. Use new endpoints rather than legacy overview/funnel routes with different counting semantics.

Resolve and authorize scope before fetching reports. Query keys must include authenticated account identity or an account-scoped cache, workspace ID, optional video ID, endpoint, date boundaries, interval, dimension and pagination as applicable. On logout/account change clear private cached data. Cancel obsolete requests when scope changes.

A single typed `AnalyticsScope` object should build endpoint prefixes and query keys. Do not let each widget infer workspace or video from its own independent state. Scope labels and rendered responses must always agree. Old workspace/video data must never remain under a new scope title while loading.

During a same-scope background refresh, retain data with a small updating indicator. During a date change, either show skeletons or explicitly mark previous values while loading; do not present them as the new range. Do not use unqualified `keepPreviousData` across workspace/video changes.

Historical data can refresh every 30 seconds while visible. Fetch detailed breakdowns only when relevant to the active tab. Stop background polling when the page is hidden. Cap retries, provide manual retry, and keep partial widget failures isolated.

Proposed module structure:

```text
fronted/src/modules/analytics/
  player/                       # Existing collection; keep separate
  server/procedures.ts          # Authenticated report access
  types.ts                      # Scope, DTOs, tab and metric definitions
  lib/scope.ts                  # Route and endpoint construction
  lib/format.ts                 # Counts, durations, rates, comparisons
  lib/date-range.ts              # Explicit UTC bounds and validation
  lib/country-activity.ts        # Country response adapter
  data/country-points.json       # Reviewed source and license required
  data/world-grid.json           # Generated static geometry
  hooks/use-analytics-reports.ts
  components/AnalyticsHeader.tsx
  components/AnalyticsFilters.tsx
  components/AnalyticsDateRange.tsx # Shared applied/draft range
  components/AnalyticsSectionNav.tsx # Same ten destinations in both scopes
  components/MetricCard.tsx
  components/AnalyticsChart.tsx
  components/CountryMap.tsx
  components/CountryTable.tsx
  components/VideoPerformanceTable.tsx
  components/ReportState.tsx
  views/WorkspaceAnalyticsView.tsx
  views/VideoAnalyticsView.tsx
  views/sections/                # Ten thin sections using shared reports
```

Adapt naming to repository conventions during implementation. Route files should resolve scope and render views; they should not contain map generation, SQL-like aggregation or large chart implementations.

## 12. Empty, loading, stale and error states

| State | UI behavior |
|---|---|
| First load | Stable skeletons matching final card/chart dimensions; no zeroes masquerading as loaded values |
| Successful no activity | Zero counts, factual “No activity in this date range,” and a functional date-range action |
| No video telemetry | Explain collection has not observed plays; do not imply no uploaded videos exist |
| Country unknown | Keep Unknown visible; “Country was unavailable for this activity” |
| Partial request failure | Keep successful sections; affected panel has a short error and Retry |
| Stale live data | Last known values visibly marked stale, timestamp retained |
| Invalid scope | “This video isn't available in this workspace,” with workspace navigation |
| Session expired | Existing sign-in flow; never replace private data with demo content |
| Slow query | Honest loading state and retry after timeout; no fake progress percentage |
| Unavailable capability | Omit the control or identify the dependency in implementation notes |

Examples of good copy: “No views in this date range.” “Country data is unavailable for some viewers.” “Couldn't load playback metrics. Try again.” Avoid celebratory illustrations, sales copy and giant empty-state artwork inside a working analytics screen.

## 13. Accessibility and interaction quality

- Semantic page headings and real table headers; tooltips supplement rather than replace labels.
- Keyboard-operable tabs, menus, date range, chart data access and country selection.
- Focus remains stable on refresh; dialogs return focus to their trigger.
- Selected metrics expose state through text and `aria-pressed` or appropriate tab semantics.
- Graphs have concise descriptions and equivalent tabular values. Do not announce every polling change through an aggressive live region.
- Check text contrast, control boundaries, focus rings, both themes and 200% zoom.
- Map dots and color changes are never the only means of understanding country activity.
- Touch users can select a country or data point without relying on hover.
- Use subtle 120–180 ms control transitions only where useful; respect `prefers-reduced-motion`.

## 14. Current limitations and future work

The initial dashboard must accurately reflect the implemented API. These are future capabilities, not invitations to draw nonfunctional UI:

- Exact watched-segment heatmaps and per-second retention.
- Sequential campaign funnels and revenue/ROI attribution.
- Authoritative saved-lead country/referrer attribution for historical records.
- Owner-preview exclusion: current console preview activity is included.
- A/B testing, report builders and saved custom dashboards.
- Arbitrary server sorting, global country/device filters and analytics exports.
- CRM delivery metrics inside analytics; the existing Leads integration screens have a separate contract.
- City-level maps, precise viewer coordinates and named viewer identification.

Do not show “Export report,” “Exclude my views,” “Filter all charts by country,” “Create experiment,” or “Save report” unless their actual behavior is implemented and verified. Basic scope, range, metric, dimension, interval, pagination and navigation controls must work in the first release.

## 15. Implementation order and acceptance criteria

1. Establish authenticated canonical routes and a single scope model. Verify cross-workspace isolation before styling.
2. Build shared header, filters, metric cards, formatting and report states using current console primitives.
3. Connect summary and series; implement workspace/video navigation with preserved dates.
4. Connect TanStack video and breakdown tables, respecting server pagination/ranking.
5. Implement Dotted Map from real country data and reviewed geographic lookup, with table fallback.
6. Complete all ten destinations using the page contracts below; share the date-range component and scope-aware query hooks.
7. Verify responsive layout, keyboard interaction, errors, stale data and performance.
8. Review the finished screens for unnecessary decoration, false claims and nonfunctional actions.

Acceptance checklist:

- [ ] All ten sections load real data in both scopes, using the documented response fields.
- [ ] From/To Apply, Cancel, same-day selection, invalid input, leap dates, UTC boundaries and back/forward are verified.
- [ ] Shared dates affect every historical widget; exact-time To is exclusive; Live uses its independent window.
- [ ] Hourly >31-day and concurrency >48-hour requests are prevented; no unsupported filters or sorts appear.
- [ ] Workspace totals contain only that workspace; single-video totals contain only the selected video.
- [ ] Scope changes never flash the previous scope's private data.
- [ ] Bookmarks and back/forward restore the correct tab, dates and metric.
- [ ] Playing time displays correctly beyond 24 hours; rates and previous-zero cases are honest.
- [ ] Summary unique viewers are never calculated by adding child rows.
- [ ] Country map and list agree; pagination, Unknown and unmapped codes are handled.
- [ ] Map markers align with the actual projection at desktop and mobile sizes.
- [ ] Country selection does not imply unsupported filtering of other widgets.
- [ ] Saved and observed form counts are clearly distinguished.
- [ ] Live mode uses current data and a separate ≤48-hour concurrency range.
- [ ] Empty, blocked, failing and stale requests cannot be mistaken for confirmed zero activity.
- [ ] Long video names, large totals, 1-row and multi-page datasets render cleanly.
- [ ] Layout checked around 1440, 1024, 768 and 390 px, in both supported themes.
- [ ] Controls are keyboard accessible and readable at 200% zoom.
- [ ] No fake production data, decorative network animation, giant hero, or dead button.
- [ ] Existing player collection and Leads functionality remain intact.

## 16. Copy-ready brief for Gemini, Anti-Gravity or another generator

> Build Rowley's analytics frontend from this specification and `docs/analytics-api.md`. Reuse the existing console shell, fonts, semantic tokens, shadcn/Radix primitives and TanStack Table. Any suitable chart library is allowed; customize it to match Rowley rather than adopting its default theme. The visual direction is a calm, precise working dashboard: neutral surfaces, restrained lime primary actions, aligned typography, a dominant trend chart and practical tables. Avoid generic AI-template decoration: no gradient heroes, glass panels, glowing borders, rainbow cards, animated counters, decorative world traffic, invented insights or fake production data.
>
> Implement two explicit scopes: `/console/workspaces/[workspaceId]/analytics` and `/console/workspaces/[workspaceId]/analytics/[videoId]`. Keep workspace identity visible, authorize the selected video, preserve date filters on drill-down, and isolate cache entries by scope. Share the same metric definitions and controls between both pages.
>
> Use `dotted-map` for a country-level audience map with real country aggregates, a reviewed country-point lookup, matching geographic projection, an accessible country table, and an Unknown bucket. No fabricated city locations or travel arcs. Build all ten destinations: Overview, Real-time, Audience, Engagement, Conversions, Playback quality, Form Submissions, CTA Clicks, Watch Time and Views. All historical destinations share shadcn From/To controls; Real-time separates current activity from its recent concurrency range. Use the page-by-page data contracts in this document and only supported API capabilities. Distinguish saved form totals from observational telemetry and progress buckets from actual watched-segment heatmaps.
>
> Implement real loading, empty, failure, stale and authorization states. Never replace failures with demo values. Do not invent unsupported backend filters, sorting, exports or report-builder controls. Keep code split into scope/data adapters, reusable chart/table/map components and thin route views. Finish by testing both scopes, mobile layouts, keyboard use, long labels, large durations, partial data and scope changes. Report any missing backend dependency explicitly.
