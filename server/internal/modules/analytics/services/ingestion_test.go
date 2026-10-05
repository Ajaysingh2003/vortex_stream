package services

import (
	"encoding/json"
	events "github.com/ajaysingh2003/vortex-stream/internal/modules/analytics/domain"
	"github.com/google/uuid"
	"testing"
	"time"
)

func validEvent() events.Event {
	v := uuid.New()
	return events.Event{EventID: uuid.New(), VideoID: &v, EventName: "playback_heartbeat", EventVersion: 1, OccurredAt: time.Now().UTC(), AnonymousID: uuid.NewString(), SessionID: uuid.NewString(), PlaybackSessionID: uuid.NewString(), Properties: json.RawMessage(`{"watch_ms":10000,"active":true,"email":"private@example.com"}`)}
}
func TestViewerValidation(t *testing.T) {
	for _, test := range []struct {
		name   string
		mutate func(*events.Event)
	}{{"future", func(e *events.Event) { e.OccurredAt = time.Now().Add(time.Hour) }}, {"old", func(e *events.Event) { e.OccurredAt = time.Now().Add(-25 * time.Hour) }}, {"missing identity", func(e *events.Event) { e.AnonymousID = "" }}, {"administrative event", func(e *events.Event) { e.EventName = "user_registered" }}, {"excessive time", func(e *events.Event) { e.Properties = json.RawMessage(`{"watch_ms":15001}`) }}, {"unbounded property", func(e *events.Event) { e.Properties = json.RawMessage(`{"watch_ms":-1}`) }}, {"wrong time event", func(e *events.Event) { e.EventName = "play_started" }}} {
		t.Run(test.name, func(t *testing.T) {
			e := validEvent()
			test.mutate(&e)
			if ValidateViewerEvent(&e, time.Now()) == nil {
				t.Fatal("invalid event accepted")
			}
		})
	}
	e := validEvent()
	user := uuid.New()
	e.UserID = &user
	e.PageURL = "https://user:password@example.com/private/email?q=secret#fragment"
	if err := ValidateViewerEvent(&e, time.Now()); err != nil {
		t.Fatal(err)
	}
	if e.PageURL != "https://example.com" || e.UserID != nil {
		t.Fatal("unsafe identity or URL retained")
	}
	var props map[string]interface{}
	json.Unmarshal(e.Properties, &props)
	if _, ok := props["email"]; ok {
		t.Fatal("PII retained")
	}
}

func TestViewerValidationPart2(t *testing.T) {
	now := time.Now().UTC()
	v := uuid.New()

	// 1. Version 2 event acceptance
	v2Event := events.Event{
		EventID:              uuid.New(),
		VideoID:              &v,
		EventName:            "play_started",
		EventVersion:         2,
		OccurredAt:           now,
		AnonymousID:          uuid.NewString(),
		SessionID:            uuid.NewString(),
		PlaybackSessionID:    uuid.NewString(),
		EventSequence:        1,
		MediaRevisionID:      "rev-media-1",
		ExperienceRevisionID: "rev-exp-1",
		Properties:           json.RawMessage(`{}`),
	}
	if err := ValidateViewerEvent(&v2Event, now); err != nil {
		t.Fatalf("version 2 event should be accepted: %v", err)
	}

	// 2. Reject lead_submission_saved on public ingestion
	outboxEvent := v2Event
	outboxEvent.EventName = "lead_submission_saved"
	if err := ValidateViewerEvent(&outboxEvent, now); err == nil {
		t.Fatal("lead_submission_saved MUST be rejected on public ingestion")
	}

	// 3. Acceptance of playback_segments with valid slices
	segmentEvent := v2Event
	segmentEvent.EventName = "playback_segments"
	segmentEvent.Segments = []events.SegmentSlice{
		{StartMS: 0, EndMS: 5000, PlaybackMS: 5000, Rate: 1.0, Visibility: "visible"},
		{StartMS: 5000, EndMS: 10000, PlaybackMS: 5000, Rate: 1.0, Visibility: "visible"},
	}
	if err := ValidateViewerEvent(&segmentEvent, now); err != nil {
		t.Fatalf("valid playback_segments event should be accepted: %v", err)
	}

	// 4. Rejection of playback_segments with > 50 slices
	manySlices := make([]events.SegmentSlice, 51)
	for i := range manySlices {
		manySlices[i] = events.SegmentSlice{StartMS: int64(i * 1000), EndMS: int64((i + 1) * 1000), PlaybackMS: 1000}
	}
	tooManySlicesEvent := segmentEvent
	tooManySlicesEvent.Segments = manySlices
	if err := ValidateViewerEvent(&tooManySlicesEvent, now); err == nil {
		t.Fatal("playback_segments with > 50 slices must be rejected")
	}

	// 5. Rejection of invalid slice bounds (start > end)
	invalidSliceEvent := segmentEvent
	invalidSliceEvent.Segments = []events.SegmentSlice{{StartMS: 5000, EndMS: 2000, PlaybackMS: 3000}}
	if err := ValidateViewerEvent(&invalidSliceEvent, now); err == nil {
		t.Fatal("playback_segments with start > end must be rejected")
	}

	// 6. Acceptance of subtitle_track_selected
	subtitleEvent := v2Event
	subtitleEvent.EventName = "subtitle_track_selected"
	subtitleEvent.SubtitleTrackID = "en-1"
	subtitleEvent.Properties = json.RawMessage(`{"language":"en","source":"manual"}`)
	if err := ValidateViewerEvent(&subtitleEvent, now); err != nil {
		t.Fatalf("valid subtitle_track_selected should be accepted: %v", err)
	}

	// 7. Preview claim reset to false
	previewClaim := v2Event
	previewClaim.IsPreview = true
	if err := ValidateViewerEvent(&previewClaim, now); err != nil {
		t.Fatal(err)
	}
	if previewClaim.IsPreview != false {
		t.Fatal("unauthenticated public is_preview claim must be forced to false")
	}
}

