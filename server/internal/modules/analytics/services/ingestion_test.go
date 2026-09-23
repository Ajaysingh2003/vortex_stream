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
