package service

import (
	"context"
	"fmt"
	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
	"os"
	"testing"
	"time"
)

func TestWorkerLeaseAndRetryPostgres(t *testing.T) {
	if os.Getenv("LEADS_DATABASE_TEST") != "1" {
		t.Skip("requires local PostgreSQL")
	}
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", os.Getenv("DB_HOST"), os.Getenv("DB_PORT"), os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_NAME"))
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{NamingStrategy: schema.NamingStrategy{SingularTable: true}, Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		t.Fatal(err)
	}
	tx := db.Begin()
	defer tx.Rollback()
	ctx := context.Background()
	box := testBox(t)
	secret, _ := box.Seal("test-signing-secret")
	integration := domain.LeadIntegration{ID: uuid.New(), WorkspaceID: uuid.New(), VideoID: uuid.New(), Name: "Rollback test", Kind: "webhook", Endpoint: "https://example.com", SecretCipher: secret, Enabled: true, Version: 1}
	if err := tx.Create(&integration).Error; err != nil {
		t.Fatal(err)
	}
	job, _ := makeDelivery(integration, &domain.LeadFormSubmission{ID: uuid.New()}, true)
	job.NextAttemptAt = time.Now().AddDate(-10, 0, 0)
	if err := tx.Create(&job).Error; err != nil {
		t.Fatal(err)
	}
	s := &Service{DB: tx, Secrets: box}
	claimed, err := s.claim(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if claimed.ID != job.ID || claimed.Status != "delivering" || claimed.Attempts != 1 || claimed.LeaseToken == uuid.Nil {
		t.Fatal("claim did not reserve test delivery")
	}
	stale := *claimed
	stale.LeaseToken = uuid.New()
	if err := s.finish(ctx, stale, SendResult{}, time.Second); err != nil {
		t.Fatal(err)
	}
	var persisted domain.LeadDelivery
	tx.First(&persisted, "id=?", job.ID)
	if persisted.Status != "delivering" {
		t.Fatal("stale lease overwrote result")
	}
	if err := s.finish(ctx, *claimed, SendResult{Status: 429, Error: "rate limited", Retry: true, RetryAfter: time.Minute}, time.Second); err != nil {
		t.Fatal(err)
	}
	tx.First(&persisted, "id=?", job.ID)
	if persisted.Status != "retrying" || time.Until(persisted.NextAttemptAt) < 59*time.Second {
		t.Fatal("retry not persisted")
	}
	var attempts int64
	tx.Model(&domain.LeadDeliveryAttempt{}).Where("delivery_id=?", job.ID).Count(&attempts)
	if attempts != 1 {
		t.Fatal("attempt log incorrect")
	}
	if err := s.Retry(ctx, integration.VideoID, job.ID); err == nil {
		t.Fatal("active job allowed manual retry")
	}
	tx.Model(&persisted).Update("status", "failed")
	if err := s.Retry(ctx, integration.VideoID, job.ID); err != nil {
		t.Fatal(err)
	}
	tx.First(&persisted, "id=?", job.ID)
	if persisted.Status != "queued" || persisted.CycleAttempts != 0 {
		t.Fatal("manual retry failed")
	}
}
