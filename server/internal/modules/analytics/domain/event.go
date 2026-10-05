package domain

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

const (
	Subject  = "analytics.events"
	Stream   = "ANALYTICS_EVENTS"
	Consumer = "analytics-clickhouse"
)

var allowedEventNames = map[string]struct{}{
	"playback_heartbeat": {}, "lead_form_skipped": {}, "pip_exited": {}, "player_loaded": {}, "play_started": {}, "play_resumed": {}, "play_paused": {},
	"video_progress": {}, "video_25_percent": {}, "video_50_percent": {},
	"video_75_percent": {}, "video_90_percent": {}, "video_completed": {},
	"video_replayed": {}, "video_abandoned": {}, "seek_forward": {},
	"seek_backward": {}, "quality_changed": {}, "playback_speed_changed": {},
	"mute_enabled": {}, "mute_disabled": {}, "fullscreen_entered": {},
	"fullscreen_exited": {}, "pip_entered": {}, "captions_enabled": {},
	"captions_disabled": {}, "chapter_clicked": {}, "thumbnail_clicked": {},
	"video_load_started": {}, "video_load_completed": {}, "first_frame_rendered": {},
	"buffer_started": {}, "buffer_ended": {}, "video_error": {},
	"quality_switch_failed": {}, "cdn_error": {}, "cta_displayed": {},
	"cta_clicked": {}, "cta_dismissed": {}, "lead_form_opened": {},
	"lead_form_started": {}, "lead_form_submitted": {}, "lead_form_failed": {},
	"end_screen_displayed": {}, "end_screen_clicked": {}, "share_clicked": {},
	"download_clicked": {}, "user_registered": {}, "user_logged_in": {},
	"workspace_created": {}, "video_upload_started": {}, "video_upload_completed": {},
	"video_upload_failed": {}, "video_published": {}, "video_deleted": {},
	"player_settings_updated": {}, "subscription_started": {},
	"subscription_cancelled": {}, "subscription_upgraded": {},
	"subscription_downgraded": {},
	// Part 2 additions
	"playback_segments": {}, "subtitle_track_selected": {}, "lead_submission_saved": {},
}

// SegmentSlice models a continuous slice of played media for actual watched-segment heatmaps.
type SegmentSlice struct {
	StartMS         int64   `json:"start_ms"`
	EndMS           int64   `json:"end_ms"`
	PlaybackMS      int64   `json:"playback_ms"`
	Rate            float64 `json:"rate,omitempty"`
	Visibility      string  `json:"visibility,omitempty"`
	SubtitleTrackID string  `json:"subtitle_track_id,omitempty"`
}

// Event is the stable envelope shared by the frontend, ingestion API, and worker.
// Properties intentionally remain JSON so event-specific flexible fields do not require
// database migration.
type Event struct {
	PlaybackToken        string          `json:"playback_token,omitempty"`
	EventID              uuid.UUID       `json:"event_id"`
	EventName            string          `json:"event_name"`
	EventVersion         int             `json:"event_version"`
	OccurredAt           time.Time       `json:"occurred_at"`
	ReceivedAt           time.Time       `json:"received_at,omitempty"`
	EventSequence        uint32          `json:"event_sequence,omitempty"`
	MediaRevisionID      string          `json:"media_revision_id,omitempty"`
	ExperienceRevisionID string          `json:"experience_revision_id,omitempty"`
	MonotonicElapsedMS   int64           `json:"monotonic_elapsed_ms,omitempty"`
	AnonymousID          string          `json:"anonymous_id,omitempty"`
	SessionID            string          `json:"session_id,omitempty"`
	PlaybackSessionID    string          `json:"playback_session_id,omitempty"`
	UserID               *uuid.UUID      `json:"user_id,omitempty"`
	WorkspaceID          *uuid.UUID      `json:"workspace_id,omitempty"`
	VideoID              *uuid.UUID      `json:"video_id,omitempty"`
	PageURL              string          `json:"page_url,omitempty"`
	Referrer             string          `json:"referrer,omitempty"`
	UTMSource            string          `json:"utm_source,omitempty"`
	UTMMedium            string          `json:"utm_medium,omitempty"`
	UTMCampaign          string          `json:"utm_campaign,omitempty"`
	DeviceType           string          `json:"device_type,omitempty"`
	Browser              string          `json:"browser,omitempty"`
	OS                   string          `json:"os,omitempty"`
	Country              string          `json:"country,omitempty"`
	Visibility           string          `json:"visibility,omitempty"`
	Surface              string          `json:"surface,omitempty"`
	IsPreview            bool            `json:"is_preview,omitempty"`
	CTAID                string          `json:"cta_id,omitempty"`
	ChapterID            string          `json:"chapter_id,omitempty"`
	SubtitleTrackID      string          `json:"subtitle_track_id,omitempty"`
	PositionMS           *int64          `json:"position_ms,omitempty"`
	DurationMS           *int64          `json:"duration_ms,omitempty"`
	Segments             []SegmentSlice  `json:"segments,omitempty"`
	Properties           json.RawMessage `json:"properties,omitempty"`
}

func (e *Event) Normalize() error {
	e.EventName = strings.TrimSpace(e.EventName)
	if e.EventID == uuid.Nil {
		e.EventID = uuid.New()
	}
	if e.EventVersion == 0 {
		e.EventVersion = 1
	}
	if e.EventVersion != 1 && e.EventVersion != 2 {
		return fmt.Errorf("unsupported event_version %d", e.EventVersion)
	}
	if e.OccurredAt.IsZero() {
		e.OccurredAt = time.Now().UTC()
	}
	if e.ReceivedAt.IsZero() {
		e.ReceivedAt = time.Now().UTC()
	}
	if _, ok := allowedEventNames[e.EventName]; !ok {
		return fmt.Errorf("unsupported event_name %q", e.EventName)
	}
	if len(e.Segments) > 50 {
		return fmt.Errorf("segments slice count %d exceeds maximum 50 slices", len(e.Segments))
	}
	for i, s := range e.Segments {
		if s.StartMS < 0 || s.EndMS < s.StartMS || s.PlaybackMS < 0 {
			return fmt.Errorf("invalid segment slice %d: start %d, end %d, playback %d", i, s.StartMS, s.EndMS, s.PlaybackMS)
		}
	}
	if e.Properties == nil {
		e.Properties = json.RawMessage(`{}`)
	}
	if !json.Valid(e.Properties) {
		return fmt.Errorf("properties must be valid JSON")
	}
	if len(e.Properties) > 16*1024 {
		return fmt.Errorf("properties exceeds 16 KiB")
	}
	return nil
}

type Batch struct {
	Events []Event `json:"events" binding:"required,min=1,max=100"`
}
