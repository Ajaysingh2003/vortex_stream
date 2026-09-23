package dto

import "time"

type Metrics struct {
	ImpressionPlays       uint64  `json:"impression_play_sessions"`
	FormOpenedSessions    uint64  `json:"form_opened_sessions"`
	FormConvertedSessions uint64  `json:"form_converted_sessions"`
	Views                 uint64  `json:"views"`
	UniqueViewers         uint64  `json:"unique_viewers"`
	Impressions           uint64  `json:"impressions"`
	PlaybackMS            uint64  `json:"playback_ms"`
	Completions           uint64  `json:"completions"`
	Replays               uint64  `json:"replays"`
	CTADisplays           uint64  `json:"cta_displays"`
	CTAClicks             uint64  `json:"cta_clicks"`
	CTAExposedSessions    uint64  `json:"cta_exposed_sessions"`
	CTAClickingSessions   uint64  `json:"cta_clicking_sessions"`
	FormOpens             uint64  `json:"form_opens"`
	FormStarts            uint64  `json:"form_starts"`
	FormFailures          uint64  `json:"form_failures"`
	ObservedSubmissions   uint64  `json:"observed_form_submissions"`
	FormSubmissions       uint64  `json:"form_submissions"`
	FormSkips             uint64  `json:"form_skips"`
	Errors                uint64  `json:"errors"`
	BufferEvents          uint64  `json:"buffer_events"`
	BufferMS              uint64  `json:"buffer_ms"`
	StartupMS             float64 `json:"average_startup_ms"`
	AverageProgress       float64 `json:"average_progress_percent"`
	CompletionRate        float64 `json:"completion_rate"`
	PlayRate              float64 `json:"play_rate"`
	CTARate               float64 `json:"cta_click_rate"`
	FormConversionRate    float64 `json:"form_conversion_rate"`
	EndScreenDisplays     uint64  `json:"end_screen_displays"`
	EndScreenClicks       uint64  `json:"end_screen_clicks"`
}

func (m *Metrics) Rates() {
	if m.Views > 0 {
		m.CompletionRate = float64(m.Completions) / float64(m.Views) * 100
	}
	if m.Impressions > 0 {
		m.PlayRate = float64(m.ImpressionPlays) / float64(m.Impressions) * 100
	}
	if m.CTAExposedSessions > 0 {
		m.CTARate = float64(m.CTAClickingSessions) / float64(m.CTAExposedSessions) * 100
	}
	if m.FormOpenedSessions > 0 {
		m.FormConversionRate = float64(m.FormConvertedSessions) / float64(m.FormOpenedSessions) * 100
	}
}

type MetricRow struct {
	Key     string  `json:"key"`
	Title   string  `json:"title,omitempty"`
	Metrics Metrics `json:"metrics"`
}
type SummaryReport struct {
	Range         DateRange           `json:"range"`
	PreviousRange DateRange           `json:"previous_range"`
	Current       Metrics             `json:"current"`
	Previous      Metrics             `json:"previous"`
	Change        map[string]*float64 `json:"change_percent"`
	GeneratedAt   time.Time           `json:"generated_at"`
}
type LiveReport struct {
	AsOf           time.Time `json:"as_of"`
	WindowSeconds  int       `json:"window_seconds"`
	ActiveSessions uint64    `json:"active_sessions"`
	UniqueViewers  uint64    `json:"unique_viewers"`
	Countries      []LiveRow `json:"countries"`
	Videos         []LiveRow `json:"videos"`
}
type LiveRow struct {
	Key            string `json:"key"`
	ActiveSessions uint64 `json:"active_sessions"`
	UniqueViewers  uint64 `json:"unique_viewers"`
}
type Engagement struct {
	Bucket   string  `json:"bucket"`
	Sessions uint64  `json:"sessions"`
	Percent  float64 `json:"percent"`
}
