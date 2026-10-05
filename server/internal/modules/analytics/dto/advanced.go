package dto

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/url"
	"time"

	"github.com/google/uuid"
)

type ScopeMetadata struct {
	WorkspaceID uuid.UUID  `json:"workspace_id"`
	VideoID      *uuid.UUID `json:"video_id,omitempty"`
}

type CoverageMetadata struct {
	EligibleSessions uint64  `json:"eligible_sessions"`
	MeasuredSessions uint64  `json:"measured_sessions"`
	CoverageRatio    float64 `json:"coverage_ratio"`
}

type ReportMetadata struct {
	Scope             ScopeMetadata     `json:"scope"`
	Range             DateRange         `json:"range"`
	MetricVersion     int               `json:"metric_version"`
	TimeBasis         string            `json:"time_basis,omitempty"`
	FilterBasis       string            `json:"filter_basis,omitempty"`
	AsOf              time.Time         `json:"as_of"`
	ObservationCutoff *time.Time        `json:"observation_cutoff,omitempty"`
	Provisional       bool              `json:"provisional,omitempty"`
	Coverage          *CoverageMetadata `json:"coverage,omitempty"`
	NextCursor        *string           `json:"next_cursor,omitempty"`
}

type AnalyticsEnvelope struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
}

type FilterParams struct {
	Country              string     `json:"country,omitempty"`
	Referrer             string     `json:"referrer,omitempty"`
	Device               string     `json:"device,omitempty"`
	Browser              string     `json:"browser,omitempty"`
	OS                   string     `json:"os,omitempty"`
	UTMSource            string     `json:"utm_source,omitempty"`
	UTMMedium            string     `json:"utm_medium,omitempty"`
	UTMCampaign          string     `json:"utm_campaign,omitempty"`
	Surface              string     `json:"surface,omitempty"`
	VideoID              *uuid.UUID `json:"video_id,omitempty"`
	MediaRevisionID      string     `json:"media_revision_id,omitempty"`
	CTAID                string     `json:"cta_id,omitempty"`
	ChapterID            string     `json:"chapter_id,omitempty"`
	SubtitleTrackID      string     `json:"subtitle_track_id,omitempty"`
	IsPreview            *bool      `json:"is_preview,omitempty"`
}

// Capability matrix defines supported filters per endpoint family
var endpointCapabilities = map[string]map[string]bool{
	"summary":          {"country": true, "referrer": true, "device": true, "browser": true, "os": true, "utm_source": true, "utm_medium": true, "utm_campaign": true, "surface": true, "video_id": true, "is_preview": true},
	"series":           {"country": true, "referrer": true, "device": true, "browser": true, "os": true, "utm_source": true, "utm_medium": true, "utm_campaign": true, "surface": true, "video_id": true, "is_preview": true},
	"breakdown":        {"country": true, "referrer": true, "device": true, "browser": true, "os": true, "utm_source": true, "utm_medium": true, "utm_campaign": true, "surface": true, "video_id": true, "is_preview": true},
	"videos":           {"country": true, "referrer": true, "device": true, "browser": true, "os": true, "utm_source": true, "utm_medium": true, "utm_campaign": true, "surface": true, "is_preview": true},
	"ctas":             {"cta_id": true, "video_id": true, "country": true, "device": true, "utm_campaign": true},
	"chapters":         {"chapter_id": true, "video_id": true},
	"captions":         {"subtitle_track_id": true, "video_id": true},
	"heatmap":          {"media_revision_id": true, "video_id": true},
	"funnels":          {"video_id": true, "country": true, "device": true, "utm_campaign": true},
	"lead-attribution": {"dimension": true, "video_id": true},
	"session-metrics":  {"video_id": true, "country": true, "device": true, "browser": true, "os": true},
	"quality":          {"video_id": true, "country": true, "device": true, "browser": true, "os": true},
	"exports":          {"country": true, "referrer": true, "device": true, "browser": true, "os": true, "utm_source": true, "utm_medium": true, "utm_campaign": true, "surface": true, "video_id": true, "media_revision_id": true, "cta_id": true, "chapter_id": true, "subtitle_track_id": true},
}

func ValidateCapabilities(endpoint string, f FilterParams) error {
	allowed, ok := endpointCapabilities[endpoint]
	if !ok {
		return nil
	}
	check := func(name string, hasVal bool) error {
		if hasVal && !allowed[name] {
			return fmt.Errorf("filter %q is not supported for %s endpoint", name, endpoint)
		}
		return nil
	}
	if err := check("country", f.Country != ""); err != nil {
		return err
	}
	if err := check("referrer", f.Referrer != ""); err != nil {
		return err
	}
	if err := check("device", f.Device != ""); err != nil {
		return err
	}
	if err := check("browser", f.Browser != ""); err != nil {
		return err
	}
	if err := check("os", f.OS != ""); err != nil {
		return err
	}
	if err := check("utm_source", f.UTMSource != ""); err != nil {
		return err
	}
	if err := check("utm_medium", f.UTMMedium != ""); err != nil {
		return err
	}
	if err := check("utm_campaign", f.UTMCampaign != ""); err != nil {
		return err
	}
	if err := check("surface", f.Surface != ""); err != nil {
		return err
	}
	if err := check("cta_id", f.CTAID != ""); err != nil {
		return err
	}
	if err := check("chapter_id", f.ChapterID != ""); err != nil {
		return err
	}
	if err := check("subtitle_track_id", f.SubtitleTrackID != ""); err != nil {
		return err
	}
	if err := check("media_revision_id", f.MediaRevisionID != ""); err != nil {
		return err
	}
	if err := check("is_preview", f.IsPreview != nil); err != nil {
		return err
	}
	return nil
}

type CursorPayload struct {
	Offset int    `json:"o"`
	AsOf   int64  `json:"t"`
	Sort   string `json:"s"`
	Order  string `json:"d"`
}

func EncodeCursor(offset int, asOf time.Time, sort, order string) string {
	p := CursorPayload{Offset: offset, AsOf: asOf.Unix(), Sort: sort, Order: order}
	b, _ := json.Marshal(p)
	return base64.RawURLEncoding.EncodeToString(b)
}

func DecodeCursor(c string) (*CursorPayload, error) {
	if c == "" {
		return nil, nil
	}
	b, err := base64.RawURLEncoding.DecodeString(c)
	if err != nil {
		return nil, fmt.Errorf("invalid cursor encoding")
	}
	var p CursorPayload
	if err := json.Unmarshal(b, &p); err != nil || p.Offset < 0 {
		return nil, fmt.Errorf("invalid cursor payload")
	}
	return &p, nil
}

// CTA Performance DTOs
type CTARow struct {
	VideoID              uuid.UUID `json:"video_id"`
	CTAID                string    `json:"cta_id"`
	ExperienceRevisionID string    `json:"experience_revision_id"`
	Title                string    `json:"title"`
	URLOrigin            string    `json:"url_origin"`
	Position             string    `json:"position,omitempty"`
	ExposureEvents       uint64    `json:"exposure_events"`
	ExposedSessions      uint64    `json:"exposed_sessions"`
	ClickEvents          uint64    `json:"click_events"`
	ClickingSessions     uint64    `json:"clicking_sessions"`
	ClickRate            float64   `json:"click_rate"`
	AvgTimeToClickMS     float64   `json:"avg_time_to_click_ms"`
	TimeToClickSamples   uint64    `json:"time_to_click_samples"`
	PostClickSavedLeads  uint64    `json:"post_click_saved_leads"`
}

type CTASeriesPoint struct {
	Key             string  `json:"key"`
	EntityKey       string  `json:"entity_key"`
	ExposureEvents  uint64  `json:"exposure_events"`
	ClickEvents     uint64  `json:"click_events"`
	ClickRate       float64 `json:"click_rate"`
}

type CTAPerformanceReport struct {
	ReportMetadata
	Items  []CTARow         `json:"items,omitempty"`
	Series []CTASeriesPoint `json:"series,omitempty"`
}

// Chapters DTOs
type ChapterRow struct {
	VideoID                uuid.UUID `json:"video_id"`
	ChapterID              string    `json:"chapter_id"`
	Title                  string    `json:"title"`
	StartMS                int64     `json:"start_ms"`
	EndMS                  int64     `json:"end_ms"`
	DurationMS             int64     `json:"duration_ms"`
	NavigationClicks       uint64    `json:"navigation_clicks"`
	NavigatingSessions     uint64    `json:"navigating_sessions"`
	ViewingSessions        uint64    `json:"viewing_sessions"`
	PlaybackMS             uint64    `json:"playback_ms"`
	UniqueMediaCoverageMS  int64     `json:"unique_media_coverage_ms"`
	ReplayCoverageMS       int64     `json:"replay_coverage_ms"`
	CompletedSessions      uint64    `json:"completed_sessions"`
	CompletionRate         float64   `json:"completion_rate"`
}

type ChaptersReport struct {
	ReportMetadata
	Items []ChapterRow `json:"items"`
}

// Captions DTOs
type CaptionTrackRow struct {
	VideoID           uuid.UUID `json:"video_id"`
	TrackID           string    `json:"track_id"`
	Language          string    `json:"language"`
	Label             string    `json:"label"`
	Source            string    `json:"source"`
	Sessions          uint64    `json:"sessions"`
	CaptionPlaybackMS uint64    `json:"caption_playback_ms"`
	UsageRate         float64   `json:"usage_rate"`
}

type CaptionsReport struct {
	ReportMetadata
	CaptionsAvailableSessions uint64            `json:"captions_available_sessions"`
	CaptionsEnabledSessions   uint64            `json:"captions_enabled_sessions"`
	ManualSelectSessions      uint64            `json:"manual_select_sessions"`
	OverallUsageRate          *float64          `json:"overall_usage_rate"`
	Tracks                    []CaptionTrackRow `json:"tracks"`
}

// Heatmap DTOs
type HeatmapBin struct {
	BinIndex             int     `json:"bin_index"`
	StartMS              int64   `json:"start_ms"`
	EndMS                int64   `json:"end_ms"`
	WatchingSessions     uint64  `json:"watching_sessions"`
	PlaybackMS           uint64  `json:"playback_ms"`
	UniqueCoveredMediaMS int64   `json:"unique_covered_media_ms"`
	ReplayedMediaMS      int64   `json:"replayed_media_ms"`
	RetentionRate        float64 `json:"retention_rate"`
}

type HeatmapReport struct {
	ReportMetadata
	DurationMS       int64        `json:"duration_ms"`
	Bins             int          `json:"bins"`
	EligibleSessions uint64       `json:"eligible_sessions"`
	MeasuredSessions uint64       `json:"measured_sessions"`
	Items            []HeatmapBin `json:"items"`
}

// Funnel DTOs
type FunnelStep struct {
	StepIndex          int      `json:"step_index"`
	StepName           string   `json:"step_name"`
	EventName          string   `json:"event_name"`
	Sessions           uint64   `json:"sessions"`
	ConversionRate     float64  `json:"conversion_rate"`
	StepConversionRate float64  `json:"step_conversion_rate"`
	DropOffRate        float64  `json:"drop_off_rate"`
	MedianTimeToStepMS *float64 `json:"median_time_to_step_ms"`
	SampleCount        uint64   `json:"sample_count"`
}

type FunnelReport struct {
	ReportMetadata
	Template              string       `json:"template"`
	WindowMinutes         int          `json:"window_minutes"`
	EntryCohortSessions   uint64       `json:"entry_cohort_sessions"`
	ConvertedSessions     uint64       `json:"converted_sessions"`
	OverallConversionRate float64      `json:"overall_conversion_rate"`
	Steps                 []FunnelStep `json:"steps"`
}

// Lead Attribution DTOs
type LeadAttributionRow struct {
	DimensionValue    string  `json:"dimension_value"`
	SavedSubmissions  uint64  `json:"saved_submissions"`
	SkippedSubmissions uint64  `json:"skipped_submissions"`
	TotalSubmissions  uint64  `json:"total_submissions"`
	SharePercent      float64 `json:"share_percent"`
}

type LeadAttributionReport struct {
	ReportMetadata
	Dimension                 string               `json:"dimension"`
	TotalSavedSubmissions     uint64               `json:"total_saved_submissions"`
	TotalSkippedSubmissions   uint64               `json:"total_skipped_submissions"`
	PostgresAuthoritativeTotal uint64               `json:"postgres_authoritative_total"`
	Reconciled                bool                 `json:"reconciled"`
	Items                     []LeadAttributionRow `json:"items"`
}

// Session Metrics DTOs
type SessionMetricsReport struct {
	ReportMetadata
	Cohort                   string    `json:"cohort"`
	EligibleSessions         uint64    `json:"eligible_sessions"`
	FinalizedSessions        uint64    `json:"finalized_sessions"`
	ProvisionalSessions      uint64    `json:"provisional_sessions"`
	CappedSessions           uint64    `json:"capped_sessions"`
	AverageObservedWatchMS   float64   `json:"average_observed_watch_ms"`
	AverageFinalizedWatchMS  float64   `json:"average_finalized_watch_ms"`
	ObservationCutoff        time.Time `json:"observation_cutoff"`
}

// Playback Quality DTOs
type QualitySummary struct {
	Cohort                     string   `json:"cohort"`
	EligibleSessions           uint64   `json:"eligible_sessions"`
	StartedSessions            uint64   `json:"started_sessions"`
	StartupMeanMS              float64  `json:"startup_mean_ms"`
	StartupMedianMS            *float64 `json:"startup_median_ms"`
	StartupP95MS               *float64 `json:"startup_p95_ms"`
	StartupSamples             uint64   `json:"startup_samples"`
	RebufferMedianMS           *float64 `json:"rebuffer_median_ms"`
	RebufferP95MS              *float64 `json:"rebuffer_p95_ms"`
	RebufferEvents             uint64   `json:"rebuffer_events"`
	RebufferAffectedSessions   uint64   `json:"rebuffer_affected_sessions"`
	RebufferRatio              float64  `json:"rebuffer_ratio"`
	PlaybackErrorSessionRate   float64  `json:"playback_error_session_rate"`
	FailureBeforeFirstPlayRate float64  `json:"failure_before_first_play_rate"`
	InsufficientData           bool     `json:"insufficient_data"`
}

type QualitySeriesPoint struct {
	Key                      string  `json:"key"`
	StartupMeanMS            float64 `json:"startup_mean_ms"`
	RebufferRatio            float64 `json:"rebuffer_ratio"`
	PlaybackErrorSessionRate float64 `json:"playback_error_session_rate"`
	Sessions                 uint64  `json:"sessions"`
}

type QualityReport struct {
	ReportMetadata
	Summary *QualitySummary      `json:"summary,omitempty"`
	Series  []QualitySeriesPoint `json:"series,omitempty"`
}

// Export DTOs
type CreateExportReq struct {
	ReportType     string       `json:"report_type" binding:"required"`
	Format         string       `json:"format" binding:"omitempty,oneof=csv json"`
	From           string       `json:"from" binding:"required"`
	To             string       `json:"to" binding:"required"`
	Filters        FilterParams `json:"filters"`
	Sort           string       `json:"sort"`
	Order          string       `json:"order"`
	Interval       string       `json:"interval"`
	Dimension      string       `json:"dimension"`
	Template       string       `json:"template"`
	WindowMinutes  int          `json:"window_minutes"`
	IdempotencyKey string       `json:"idempotency_key"`
}

type ExportJobDTO struct {
	ID           uuid.UUID  `json:"id"`
	WorkspaceID  uuid.UUID  `json:"workspace_id"`
	VideoID      *uuid.UUID `json:"video_id,omitempty"`
	ReportType   string     `json:"report_type"`
	Format       string     `json:"format"`
	Status       string     `json:"status"`
	Progress     int        `json:"progress"`
	RowCount     int64      `json:"row_count"`
	FileSize     int64      `json:"file_size"`
	DownloadURL  string     `json:"download_url,omitempty"`
	ErrorMessage string     `json:"error_message,omitempty"`
	ExpiresAt    time.Time  `json:"expires_at"`
	CreatedAt    time.Time  `json:"created_at"`
	CompletedAt  *time.Time `json:"completed_at,omitempty"`
}

// SafeOriginHelper parses origin
func SafeOrigin(raw string) string {
	u, err := url.Parse(raw)
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" {
		return ""
	}
	return u.Scheme + "://" + u.Host
}

// EscapeCSVCell escapes formula injection characters for safe spreadsheet rendering
func EscapeCSVCell(cell string) string {
	if cell == "" {
		return cell
	}
	first := cell[0]
	if first == '=' || first == '+' || first == '-' || first == '@' || first == '\t' || first == '\r' {
		return "'" + cell
	}
	return cell
}
