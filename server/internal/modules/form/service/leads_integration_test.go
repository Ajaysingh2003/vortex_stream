package services

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"strings"
	"testing"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/form/dto"
	leads "github.com/ajaysingh2003/vortex-stream/internal/modules/leads/service"
	users "github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

// Runs against the local migrated database only when explicitly enabled. All fixtures roll back.
func TestLeadHistoryAndOutboxPostgres(t *testing.T) {
	if os.Getenv("LEADS_DATABASE_TEST") != "1" {
		t.Skip("set LEADS_DATABASE_TEST=1 with DB_* environment to run PostgreSQL integration checks")
	}
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", os.Getenv("DB_HOST"), os.Getenv("DB_PORT"), os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_NAME"))
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{NamingStrategy: schema.NamingStrategy{SingularTable: true}, Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		t.Fatal(err)
	}
	tx := db.Begin()
	defer tx.Rollback()
	ctx := context.Background()
	user := domain.User{ID: uuid.New(), Email: uuid.NewString() + "@example.test", Password: "not-a-login"}
	workspace := domain.Workspaces{ID: uuid.New(), UserID: user.ID, Name: "Leads rollback test"}
	video := domain.Video{ID: uuid.New(), WorkspaceID: workspace.ID, Title: "Leads rollback test", VideoKey: "test", MasterKey: "test"}
	for _, row := range []interface{}{&user, &workspace, &video} {
		if err := tx.Create(row).Error; err != nil {
			t.Fatal(err)
		}
	}
	svc := &formServiceRepo{db: tx, workspaceRepo: users.NewPostgresWorkspaceRepository(tx)}
	fieldID := uuid.New()
	request := &dto.CreateFormReq{VideoID: video.ID, WorkspaceID: workspace.ID, Placement: "before_video", AllowSkip: true, Fields: []dto.CreateFieldReq{{ID: fieldID, Label: "Email", Type: "text"}}}
	if err := svc.Create(ctx, request, user.ID); err != nil {
		t.Fatal(err)
	}
	var form domain.LeadForm
	if err := tx.Where("video_id=?", video.ID).First(&form).Error; err != nil {
		t.Fatal(err)
	}
	connection := domain.LeadIntegration{ID: uuid.New(), WorkspaceID: workspace.ID, VideoID: video.ID, Name: "Test", Kind: "webhook", Endpoint: "https://example.com", Enabled: true, Version: 1}
	if err := tx.Create(&connection).Error; err != nil {
		t.Fatal(err)
	}
	submission := &dto.SubmitFormReq{ID: uuid.New(), FormID: form.ID, FormVersion: form.Version, SessionID: uuid.New(), Answers: map[string]string{fieldID.String(): "qa@example.test"}}
	if err := svc.Submit(ctx, video.ID, submission); err != nil {
		t.Fatal(err)
	}
	if err := svc.Submit(ctx, video.ID, submission); err != nil {
		t.Fatal(err)
	}
	var count int64
	tx.Model(&domain.LeadDelivery{}).Where("video_id=?", video.ID).Count(&count)
	if count != 1 {
		t.Fatalf("duplicate retry created %d deliveries", count)
	}
	request.Fields[0].Label = "Work email"
	request.Fields = append(request.Fields, dto.CreateFieldReq{ID: uuid.New(), Label: "Company", Type: "text"})
	if err := svc.Create(ctx, request, user.ID); err != nil {
		t.Fatal(err)
	}
	stale := *submission
	stale.ID = uuid.New()
	if err := svc.Submit(ctx, video.ID, &stale); err == nil {
		t.Fatal("stale form accepted")
	}
	leadsvc := leads.New(tx)
	filter := leads.Filter{Page: 1, Limit: 25}
	if err := filter.Validate(); err != nil {
		t.Fatal(err)
	}
	page, err := leadsvc.List(ctx, video.ID, filter)
	if err != nil {
		t.Fatal(err)
	}
	if page.Total != 1 || page.Summary.Completed != 1 || page.Summary.Pending != 1 || len(page.Fields) != 2 || page.Items[0].Answers[0].Label != "Email" || page.Items[0].Answers[0].FieldID != fieldID {
		t.Fatalf("history or summary changed: %+v", page)
	}
	request.Fields = request.Fields[1:]
	if err := svc.Create(ctx, request, user.ID); err != nil {
		t.Fatal(err)
	}
	page, err = leadsvc.List(ctx, video.ID, filter)
	if err != nil {
		t.Fatal(err)
	}
	found := false
	for _, field := range page.Fields {
		if field.ID == fieldID && field.Archived {
			found = true
		}
	}
	if !found {
		t.Fatal("removed field lost")
	}
	if err := leadsvc.QueueSelected(ctx, video.ID, []uuid.UUID{submission.ID}); err != nil {
		t.Fatal(err)
	}
	tx.Model(&domain.LeadDelivery{}).Where("video_id=?", video.ID).Count(&count)
	if count != 1 {
		t.Fatal("historical send duplicated event")
	}
	var csv bytes.Buffer
	if err := leadsvc.WriteCSV(ctx, &csv, video.ID, filter, page.Fields); err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(csv.String(), "qa@example.test") || !strings.Contains(csv.String(), "Email") {
		t.Fatal("export lost historical answer")
	}
	if _, err := leadsvc.Authorize(ctx, workspace.ID, video.ID, uuid.New()); err == nil {
		t.Fatal("cross-user access allowed")
	}
}
