package dto

import "time"

type DateRange struct {
	From time.Time `json:"from"`
	To   time.Time `json:"to"`
}

type Overview struct {
	Range                  DateRange `json:"range"`
	QualifiedPlays         uint64    `json:"qualified_plays"`
	UniqueAnonymousViewers uint64    `json:"unique_anonymous_viewers"`
	UniquePlaybackSessions uint64    `json:"unique_playback_sessions"`
	Completions            uint64    `json:"completions"`
	CompletionRate         float64   `json:"completion_rate"`
	AverageProgress        float64   `json:"average_progress_percent"`
	TotalProgressEvents    uint64    `json:"total_progress_events"`
	CtaDisplays            uint64    `json:"cta_displays"`
	CtaClicks              uint64    `json:"cta_clicks"`
	FormSubmissions        uint64    `json:"form_submissions"`
	PlaybackErrors         uint64    `json:"playback_errors"`
	BufferEvents           uint64    `json:"buffer_events"`
}

type TimeSeriesPoint struct {
	Date                   time.Time `json:"date"`
	QualifiedPlays         uint64    `json:"qualified_plays"`
	UniqueAnonymousViewers uint64    `json:"unique_anonymous_viewers"`
	Completions            uint64    `json:"completions"`
	CtaClicks              uint64    `json:"cta_clicks"`
	FormSubmissions        uint64    `json:"form_submissions"`
	PlaybackErrors         uint64    `json:"playback_errors"`
	BufferEvents           uint64    `json:"buffer_events"`
}

type Retention struct {
	Bucket                 string  `json:"bucket"`
	UniquePlaybackSessions uint64  `json:"unique_playback_sessions"`
	Percentage             float64 `json:"percentage"`
}

type TechnicalBreakdown struct {
	Dimension       string  `json:"dimension"`
	QualifiedPlays  uint64  `json:"qualified_plays"`
	PlaybackErrors  uint64  `json:"playback_errors"`
	BufferEvents    uint64  `json:"buffer_events"`
	AverageProgress float64 `json:"average_progress_percent"`
}

type Funnel struct {
	Range              DateRange `json:"range"`
	CtaDisplays        uint64    `json:"cta_displays"`
	CtaClicks          uint64    `json:"cta_clicks"`
	LeadFormOpens      uint64    `json:"lead_form_opens"`
	LeadFormStarts     uint64    `json:"lead_form_starts"`
	LeadSubmissions    uint64    `json:"lead_submissions"`
	LeadFormFailures   uint64    `json:"lead_form_failures"`
	EndScreenDisplays  uint64    `json:"end_screen_displays"`
	EndScreenClicks    uint64    `json:"end_screen_clicks"`
	CtaClickRate       float64   `json:"cta_click_rate"`
	LeadConversionRate float64   `json:"lead_conversion_rate"`
}

type ConversionPoint struct {
	Date            time.Time `json:"date"`
	CtaDisplays     uint64    `json:"cta_displays"`
	CtaClicks       uint64    `json:"cta_clicks"`
	LeadSubmissions uint64    `json:"lead_submissions"`
	EndScreenClicks uint64    `json:"end_screen_clicks"`
}
