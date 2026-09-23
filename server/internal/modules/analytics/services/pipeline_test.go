package services

import (
	"context"
	"encoding/json"
	"fmt"
	model "github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	events "github.com/ajaysingh2003/vortex-stream/internal/modules/analytics/domain"
	dto "github.com/ajaysingh2003/vortex-stream/internal/modules/analytics/dto"
	users "github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/analyticsauth"
	ch "github.com/ajaysingh2003/vortex-stream/internal/shared/config/clickhouse"
	natsConfig "github.com/ajaysingh2003/vortex-stream/internal/shared/config/nats"
	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
	"os"
	"testing"
	"time"
)

func TestAnalyticsPipeline(t *testing.T) {
	if os.Getenv("ANALYTICS_DATABASE_TEST") != "1" {
		t.Skip("requires local PostgreSQL, NATS, ClickHouse and analytics worker")
	}
	ctx := context.Background()
	db, err := gorm.Open(postgres.Open(fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", os.Getenv("DB_HOST"), os.Getenv("DB_PORT"), os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_NAME"))), &gorm.Config{NamingStrategy: schema.NamingStrategy{SingularTable: true}, Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		t.Fatal(err)
	}
	tx := db.Begin()
	defer tx.Rollback()
	user := model.User{ID: uuid.New(), Email: uuid.NewString() + "@example.test", Password: "not-a-login"}
	workspace := model.Workspaces{ID: uuid.New(), UserID: user.ID, Name: "Analytics rollback test"}
	video := model.Video{ID: uuid.New(), WorkspaceID: workspace.ID, Title: "Analytics test", Status: model.StatusReady, VideoKey: "qa", MasterKey: "qa"}
	form := model.LeadForm{ID: uuid.New(), WorkspaceID: workspace.ID, VideoID: video.ID, Placement: "before_video"}
	lead := model.LeadFormSubmission{ID: uuid.New(), FormID: form.ID, VideoID: video.ID, SessionID: uuid.New(), FormVersion: 1}
	for _, record := range []interface{}{&user, &workspace, &video, &form, &lead} {
		if err := tx.Create(record).Error; err != nil {
			t.Fatal(err)
		}
	}
	client, err := ch.Connect(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()
	defer client.Conn.Exec(ctx, "ALTER TABLE analytics_events DELETE WHERE workspace_id=? SETTINGS mutations_sync=1", workspace.ID)
	bus, err := natsConfig.Connect()
	if err != nil {
		t.Fatal(err)
	}
	defer bus.Close()
	s := New(bus, client, users.NewPostgresWorkspaceRepository(tx), tx)
	event := validEvent()
	event.VideoID = &video.ID
	event.PlaybackToken, _ = analyticsauth.Issue(video.ID, workspace.ID)
	event.EventName = "play_started"
	event.Properties = json.RawMessage(`{"active":true}`)
	wrong := uuid.New()
	event.WorkspaceID = &wrong
	batch := []events.Event{event}
	if err := s.PrepareViewerBatch(ctx, batch); err != nil {
		t.Fatal(err)
	}
	if *batch[0].WorkspaceID != workspace.ID {
		t.Fatal("workspace not resolved server side")
	}
	if err := s.PublishBatch(ctx, batch); err != nil {
		t.Fatal(err)
	}
	if err := s.PublishBatch(ctx, batch); err != nil {
		t.Fatal(err)
	}
	r := dto.DateRange{From: time.Now().Add(-time.Hour), To: time.Now().Add(time.Hour)}
	var report *dto.SummaryReport
	deadline := time.Now().Add(15 * time.Second)
	for time.Now().Before(deadline) {
		report, err = s.Summary(ctx, workspace.ID, &video.ID, r)
		if err != nil {
			t.Fatal(err)
		}
		if report.Current.Views == 1 {
			break
		}
		time.Sleep(300 * time.Millisecond)
	}
	if report.Current.Views != 1 || report.Current.FormSubmissions != 1 {
		t.Fatalf("pipeline or saved forms failed: %+v", report)
	}
	if err := s.AuthorizeReport(ctx, uuid.New(), workspace.ID, &video.ID); err == nil {
		t.Fatal("cross-account analytics allowed")
	}
	rows, err := s.DashboardRows(ctx, workspace.ID, &video.ID, r, "series", "hour", 800, 0)
	if err != nil || len(rows) < 2 {
		t.Fatal(rows, err)
	}
	var saved uint64
	for _, row := range rows {
		saved += row.Metrics.FormSubmissions
	}
	if saved != 1 {
		t.Fatal("saved submission missing from timeseries")
	}
}
