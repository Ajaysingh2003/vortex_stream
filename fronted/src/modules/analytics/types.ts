export type AnalyticsTab =
  | "overview"
  | "live"
  | "audience"
  | "engagement"
  | "conversions"
  | "playback"
  | "form_submissions"
  | "cta_clicks"
  | "watch_time"
  | "views";

export interface DateRange {
  from: string; // YYYY-MM-DD or RFC3339
  to: string;
}

export interface ScopeMetadata {
  workspace_id: string;
  video_id?: string;
}

export interface CoverageMetadata {
  eligible_sessions: number;
  measured_sessions: number;
  coverage_ratio: number;
}

export interface ReportMetadata {
  scope: ScopeMetadata;
  range: DateRange;
  metric_version: number;
  time_basis?: string;
  filter_basis?: string;
  as_of: string;
  observation_cutoff?: string;
  provisional?: boolean;
  coverage?: CoverageMetadata;
  next_cursor?: string;
}

export interface MetricValues {
  views?: number;
  unique_viewers?: number;
  impressions?: number;
  playback_ms?: number;
  completions?: number;
  completion_rate?: number;
  replays?: number;
  average_progress_percent?: number;
  form_submissions?: number;
  form_skips?: number;
  form_opens?: number;
  form_starts?: number;
  form_failures?: number;
  form_conversion_rate?: number;
  cta_clicks?: number;
  cta_displays?: number;
  cta_click_rate?: number;
  cta_clicking_sessions?: number;
  cta_exposed_sessions?: number;
  form_opened_sessions?: number;
  form_converted_sessions?: number;
  impression_play_sessions?: number;
  play_rate?: number;
  average_startup_ms?: number;
  buffer_events?: number;
  buffer_ms?: number;
  errors?: number;
  end_screen_displays?: number;
  end_screen_clicks?: number;
}

export interface SummaryReport {
  current: MetricValues;
  previous?: MetricValues;
  delta?: MetricValues;
  metadata?: ReportMetadata;
}

export interface SeriesPoint {
  key: string;
  metrics: MetricValues;
}

export interface SeriesReport {
  items: SeriesPoint[];
  metadata?: ReportMetadata;
}

export interface BreakdownItem {
  key: string;
  metrics: MetricValues;
}

export interface BreakdownReport {
  items: BreakdownItem[];
  metadata?: ReportMetadata;
}

export interface VideoRankingRow {
  video_id: string;
  title: string;
  metrics: MetricValues;
}

export interface VideoRankingReport {
  items: VideoRankingRow[];
  metadata?: ReportMetadata;
}

export interface LiveReport {
  active_sessions: number;
  unique_viewers: number;
  as_of: string;
  window_seconds: number;
  countries: Array<{
    key?: string;
    country?: string;
    active_sessions: number;
    unique_viewers?: number;
  }>;
  videos: Array<{
    key?: string;
    video_id?: string;
    title?: string;
    active_sessions: number;
    unique_viewers?: number;
  }>;
}

export interface ConcurrencyPoint {
  key: string;
  active_sessions: number;
  unique_viewers: number;
}

export interface EngagementBucket {
  bucket: number; // 0, 25, 50, 75, 90, 100
  sessions: number;
  percent: number;
}

export interface CTARow {
  video_id: string;
  cta_id: string;
  experience_revision_id?: string;
  title: string;
  url_origin: string;
  position?: string;
  exposure_events: number;
  exposed_sessions: number;
  click_events: number;
  clicking_sessions: number;
  click_rate: number;
  avg_time_to_click_ms: number;
  time_to_click_samples: number;
  post_click_saved_leads?: number;
}

export interface CTASeriesPoint {
  key: string;
  entity_key: string;
  exposure_events: number;
  click_events: number;
  click_rate: number;
}

export interface CTAPerformanceReport extends ReportMetadata {
  items?: CTARow[];
  series?: CTASeriesPoint[];
}

export interface ChapterRow {
  video_id: string;
  chapter_id: string;
  title: string;
  start_ms: number;
  end_ms: number;
  duration_ms: number;
  navigation_clicks: number;
  navigating_sessions: number;
  viewing_sessions: number;
  playback_ms: number;
  unique_media_coverage_ms: number;
  replay_coverage_ms: number;
  completed_sessions: number;
  completion_rate: number;
}

export interface ChaptersReport extends ReportMetadata {
  items: ChapterRow[];
}

export interface CaptionTrackRow {
  video_id: string;
  track_id: string;
  language: string;
  label: string;
  source: string;
  sessions: number;
  caption_playback_ms: number;
  usage_rate: number;
}

export interface CaptionsReport extends ReportMetadata {
  captions_available_sessions: number;
  captions_enabled_sessions: number;
  manual_select_sessions: number;
  overall_usage_rate?: number;
  tracks: CaptionTrackRow[];
}

export interface HeatmapBin {
  bin_index: number;
  start_ms: number;
  end_ms: number;
  watching_sessions: number;
  playback_ms: number;
  unique_covered_media_ms: number;
  replayed_media_ms: number;
  retention_rate: number;
}

export interface HeatmapReport extends ReportMetadata {
  duration_ms: number;
  bins: number;
  eligible_sessions: number;
  measured_sessions: number;
  items: HeatmapBin[];
}

export interface FunnelStep {
  step_index: number;
  step_name: string;
  event_name: string;
  sessions: number;
  conversion_rate: number;
  step_conversion_rate: number;
  drop_off_rate: number;
  median_time_to_step_ms?: number;
  sample_count: number;
}

export interface FunnelReport extends ReportMetadata {
  template: string;
  window_minutes: number;
  entry_cohort_sessions: number;
  converted_sessions: number;
  overall_conversion_rate: number;
  steps: FunnelStep[];
}

export interface LeadAttributionRow {
  dimension_value: string;
  saved_submissions: number;
  skipped_submissions: number;
  total_submissions: number;
  share_percent: number;
}

export interface LeadAttributionReport extends ReportMetadata {
  dimension: string;
  total_saved_submissions: number;
  total_skipped_submissions: number;
  postgres_authoritative_total: number;
  reconciled: boolean;
  items: LeadAttributionRow[];
}

export interface SessionMetricsReport extends ReportMetadata {
  cohort: string;
  eligible_sessions: number;
  finalized_sessions: number;
  provisional_sessions: number;
  capped_sessions: number;
  average_observed_watch_ms: number;
  average_finalized_watch_ms: number;
  observation_cutoff: string;
}

export interface QualitySummary {
  cohort: string;
  eligible_sessions: number;
  started_sessions: number;
  startup_mean_ms: number;
  startup_median_ms?: number;
  startup_p95_ms?: number;
  startup_samples: number;
  rebuffer_median_ms?: number;
  rebuffer_p95_ms?: number;
  rebuffer_events: number;
  rebuffer_affected_sessions: number;
  rebuffer_ratio: number;
  playback_error_session_rate: number;
  failure_before_first_play_rate: number;
  insufficient_data: boolean;
}

export interface QualitySeriesPoint {
  key: string;
  startup_mean_ms: number;
  rebuffer_ratio: number;
  playback_error_session_rate: number;
  sessions: number;
}

export interface QualityReport extends ReportMetadata {
  summary?: QualitySummary;
  series?: QualitySeriesPoint[];
}

export interface ExportJobDTO {
  id: string;
  workspace_id: string;
  video_id?: string;
  report_type: string;
  format: string;
  status: string;
  progress: number;
  row_count: number;
  file_size: number;
  download_url?: string;
  error_message?: string;
  expires_at: string;
  created_at: string;
  completed_at?: string;
}

export interface FilterParams {
  country?: string;
  referrer?: string;
  device?: string;
  browser?: string;
  os?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  surface?: string;
  media_revision_id?: string;
  cta_id?: string;
  chapter_id?: string;
  subtitle_track_id?: string;
  is_preview?: boolean;
}
