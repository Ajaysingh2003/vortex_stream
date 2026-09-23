package clickhouse

import (
	"context"
	"encoding/json"
	events "github.com/ajaysingh2003/vortex-stream/internal/modules/analytics/domain"
	dto "github.com/ajaysingh2003/vortex-stream/internal/modules/analytics/dto"
	"github.com/google/uuid"
	"os"
	"testing"
	"time"
)

func TestDashboardClickHouse(t *testing.T) {
	if os.Getenv("ANALYTICS_DATABASE_TEST") != "1" {
		t.Skip("requires isolated development ClickHouse")
	}
	ctx := context.Background()
	c, err := Connect(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer c.Close()
	w, v := uuid.New(), uuid.New()
	defer c.Conn.Exec(ctx, "ALTER TABLE analytics_events DELETE WHERE workspace_id=? SETTINGS mutations_sync=1", w)
	now := time.Now().UTC().Add(-10 * time.Second)
	viewer := uuid.NewString()
	s1, s2 := uuid.NewString(), uuid.NewString()
	ev := []events.Event{}
	add := func(name, s string, p map[string]interface{}, at time.Time) {
		b, _ := json.Marshal(p)
		position, duration := int64(10000), int64(10000)
		ev = append(ev, events.Event{EventID: uuid.New(), EventName: name, EventVersion: 1, OccurredAt: at, AnonymousID: viewer, SessionID: uuid.NewString(), PlaybackSessionID: s, WorkspaceID: &w, VideoID: &v, Country: "IN", PositionMS: &position, DurationMS: &duration, Properties: b})
	}
	for _, s := range []string{s1, s2} {
		add("player_loaded", s, map[string]interface{}{}, now)
		add("play_started", s, map[string]interface{}{}, now)
		add("playback_heartbeat", s, map[string]interface{}{"watch_ms": 10000, "active": true}, now)
	}
	add("video_completed", s1, map[string]interface{}{"active": false}, now.Add(time.Second))
	add("cta_displayed", s1, map[string]interface{}{}, now)
	add("cta_clicked", s1, map[string]interface{}{}, now)
	add("lead_form_opened", s1, map[string]interface{}{}, now)
	add("lead_form_submitted", s1, map[string]interface{}{"submission_id": uuid.NewString()}, now)
	if err := c.InsertEvents(ctx, ev); err != nil {
		t.Fatal(err)
	}
	if err := c.InsertEvents(ctx, ev); err != nil {
		t.Fatal(err)
	}
	r := dto.DateRange{From: now.Add(-time.Hour), To: time.Now().Add(time.Second)}
	rows, err := c.Dashboard(ctx, w, &v, r, "summary", "day", 100, 0)
	if err != nil {
		t.Fatal(err)
	}
	if len(rows) != 1 {
		t.Fatal(rows)
	}
	m := rows[0].Metrics
	if m.Views != 2 || m.UniqueViewers != 1 || m.PlaybackMS != 20000 || m.Completions != 1 || m.CompletionRate != 50 || m.CTARate != 100 || m.FormConversionRate != 100 {
		t.Fatalf("wrong dedup/cohort metrics: %+v", m)
	}
	for _, dimension := range []string{"country", "referrer", "video", "series", "surface"} {
		rows, err := c.Dashboard(ctx, w, &v, r, dimension, "hour", 100, 0)
		if err != nil || len(rows) != 1 {
			t.Fatal(dimension, rows, err)
		}
	}
	live, err := c.Live(ctx, w, &v)
	if err != nil {
		t.Fatal(err)
	}
	if live.ActiveSessions != 1 || live.UniqueViewers != 1 {
		t.Fatal(live)
	}
	concurrency, err := c.Concurrency(ctx, w, &v, r)
	if err != nil || len(concurrency) == 0 {
		t.Fatal(concurrency, err)
	}
	retention, err := c.Engagement(ctx, w, v, r)
	if err != nil || len(retention) != 6 {
		t.Fatal(retention, err)
	}
}
func TestDimensionAllowlist(t *testing.T) {
	if _, err := DashboardDimension("country; DROP TABLE analytics_events", "day"); err == nil {
		t.Fatal("SQL input accepted")
	}
	if _, err := DashboardDimension("series", "month"); err == nil {
		t.Fatal("unbounded interval")
	}
}
