package service

import (
	"context"
	"encoding/json"
	"time"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Event struct {
	ID            uuid.UUID                 `json:"id"`
	Type          string                    `json:"type"`
	SchemaVersion int                       `json:"schemaVersion"`
	CreatedAt     time.Time                 `json:"createdAt"`
	Test          bool                      `json:"test"`
	Data          domain.LeadFormSubmission `json:"data"`
}

func makeDelivery(integration domain.LeadIntegration, lead *domain.LeadFormSubmission, isTest bool) (domain.LeadDelivery, error) {
	id := uuid.New()
	event := Event{ID: id, Type: "lead.submitted", SchemaVersion: 1, CreatedAt: time.Now().UTC(), Test: isTest, Data: *lead}
	if isTest {
		event.Type = "integration.test"
	}
	payload, err := json.Marshal(event)
	var submissionID *uuid.UUID
	if !isTest {
		submissionID = &lead.ID
	}
	return domain.LeadDelivery{ID: id, IntegrationID: integration.ID, SubmissionID: submissionID, VideoID: integration.VideoID, IntegrationVersion: integration.Version, IsTest: isTest, Payload: datatypes.JSON(payload), Status: "queued", NextAttemptAt: time.Now().UTC()}, err
}

// Enqueue runs inside the submission transaction. External networking never happens here.
func Enqueue(tx *gorm.DB, lead *domain.LeadFormSubmission) error {
	if lead.Skipped {
		return nil
	}
	var integrations []domain.LeadIntegration
	if err := tx.Where("video_id = ? AND enabled = true", lead.VideoID).Find(&integrations).Error; err != nil {
		return err
	}
	for _, integration := range integrations {
		delivery, err := makeDelivery(integration, lead, false)
		if err != nil {
			return err
		}
		if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&delivery).Error; err != nil {
			return err
		}
	}
	return nil
}
func (s *Service) QueueSelected(ctx context.Context, videoID uuid.UUID, ids []uuid.UUID) error {
	if len(ids) == 0 || len(ids) > 100 {
		return bad(400, "Select between 1 and 100 leads.")
	}
	return s.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var count int64
		if err := tx.Model(&domain.LeadIntegration{}).Where("video_id=? AND enabled=true", videoID).Count(&count).Error; err != nil {
			return err
		}
		if count == 0 {
			return bad(409, "Enable an integration first.")
		}
		var leads []domain.LeadFormSubmission
		if err := tx.Where("video_id=? AND id IN ? AND skipped=false", videoID, ids).Preload("Answers").Find(&leads).Error; err != nil {
			return err
		}
		seen := map[uuid.UUID]bool{}
		for _, id := range ids {
			seen[id] = true
		}
		if len(leads) != len(seen) {
			return bad(400, "Only completed leads from this video can be sent.")
		}
		normalizeAnswers(leads)
		for i := range leads {
			if err := Enqueue(tx, &leads[i]); err != nil {
				return err
			}
		}
		return nil
	})
}
func (s *Service) Retry(ctx context.Context, videoID, id uuid.UUID) error {
	return s.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var job domain.LeadDelivery
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id=? AND video_id=?", id, videoID).First(&job).Error; err != nil {
			return bad(404, "Delivery not found.")
		}
		if job.Status != "failed" {
			return bad(409, "Only failed deliveries can be retried.")
		}
		var integration domain.LeadIntegration
		if err := tx.Where("id=? AND enabled=true", job.IntegrationID).First(&integration).Error; err != nil {
			return bad(409, "Enable the integration before retrying.")
		}
		return tx.Model(&job).Updates(map[string]interface{}{"status": "queued", "cycle_attempts": 0, "next_attempt_at": time.Now().UTC(), "integration_version": integration.Version, "last_error": "", "lease_until": nil}).Error
	})
}
