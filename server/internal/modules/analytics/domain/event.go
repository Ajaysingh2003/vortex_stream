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
}

// Event is the stable envelope shared by the frontend, ingestion API, and worker.
// Properties intentionally remain JSON so new event-specific fields do not require
// a database migration.
type Event struct {
	PlaybackToken     string          `json:"playback_token,omitempty"`
	EventID           uuid.UUID       `json:"event_id"`
	EventName         string          `json:"event_name"`
	EventVersion      int             `json:"event_version"`
	OccurredAt        time.Time       `json:"occurred_at"`
	AnonymousID       string          `json:"anonymous_id,omitempty"`
	SessionID         string          `json:"session_id,omitempty"`
	PlaybackSessionID string          `json:"playback_session_id,omitempty"`
	UserID            *uuid.UUID      `json:"user_id,omitempty"`
	WorkspaceID       *uuid.UUID      `json:"workspace_id,omitempty"`
	VideoID           *uuid.UUID      `json:"video_id,omitempty"`
	PageURL           string          `json:"page_url,omitempty"`
	Referrer          string          `json:"referrer,omitempty"`
	UTMSource         string          `json:"utm_source,omitempty"`
	UTMMedium         string          `json:"utm_medium,omitempty"`
	UTMCampaign       string          `json:"utm_campaign,omitempty"`
	DeviceType        string          `json:"device_type,omitempty"`
	Browser           string          `json:"browser,omitempty"`
	OS                string          `json:"os,omitempty"`
	Country           string          `json:"country,omitempty"`
	PositionMS        *int64          `json:"position_ms,omitempty"`
	DurationMS        *int64          `json:"duration_ms,omitempty"`
	Properties        json.RawMessage `json:"properties,omitempty"`
}

func (e *Event) Normalize() error {
	e.EventName = strings.TrimSpace(e.EventName)
	if e.EventID == uuid.Nil {
		e.EventID = uuid.New()
	}
	if e.EventVersion == 0 {
		e.EventVersion = 1
	}
	if e.OccurredAt.IsZero() {
		e.OccurredAt = time.Now().UTC()
	}
	if _, ok := allowedEventNames[e.EventName]; !ok {
		return fmt.Errorf("unsupported event_name %q", e.EventName)
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
