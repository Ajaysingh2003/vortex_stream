package service

import (
	"context"
	"errors"
	"log"
	"math/rand/v2"
	"time"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const MaxAttempts = 8

func retryDelay(attempt int) time.Duration {
	return min(30*time.Second*time.Duration(1<<min(attempt, 10)), 6*time.Hour) + time.Duration(rand.IntN(15))*time.Second
}
func (s *Service) claim(ctx context.Context) (*domain.LeadDelivery, error) {
	var job domain.LeadDelivery
	err := s.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		now := time.Now().UTC()
		err := tx.Model(&domain.LeadDelivery{}).Joins("JOIN lead_integration i ON i.id = lead_delivery.integration_id AND i.enabled=true").Where("((lead_delivery.status IN ('queued','retrying') AND lead_delivery.next_attempt_at <= ?) OR (lead_delivery.status='delivering' AND lead_delivery.lease_until < ?))", now, now).Order("lead_delivery.next_attempt_at ASC").Clauses(clause.Locking{Strength: "UPDATE", Table: clause.Table{Name: clause.CurrentTable}, Options: "SKIP LOCKED"}).First(&job).Error
		if err != nil {
			return err
		}
		lease := now.Add(2 * time.Minute)
		job.Status = "delivering"
		job.LeaseUntil = &lease
		job.LeaseToken = uuid.New()
		job.Attempts++
		job.CycleAttempts++
		return tx.Save(&job).Error
	})
	if err != nil {
		return nil, err
	}
	return &job, nil
}
func (s *Service) finish(ctx context.Context, job domain.LeadDelivery, result SendResult, duration time.Duration) error {
	now := time.Now().UTC()
	status := "delivered"
	var delivered *time.Time
	next := now
	if result.Error != "" {
		status = "failed"
		if result.Retry && job.CycleAttempts < MaxAttempts {
			status = "retrying"
			next = now.Add(max(retryDelay(job.CycleAttempts), result.RetryAfter))
		}
	} else {
		delivered = &now
	}
	return s.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		update := tx.Model(&domain.LeadDelivery{}).Where("id=? AND lease_token=? AND status='delivering'", job.ID, job.LeaseToken).Updates(map[string]interface{}{"status": status, "lease_until": nil, "last_error": result.Error, "http_status": result.Status, "delivered_at": delivered, "next_attempt_at": next})
		if update.Error != nil {
			return update.Error
		}
		if update.RowsAffected == 0 {
			return nil
		}
		return tx.Create(&domain.LeadDeliveryAttempt{ID: uuid.New(), DeliveryID: job.ID, Attempt: job.Attempts, HTTPStatus: result.Status, Error: result.Error, DurationMs: duration.Milliseconds()}).Error
	})
}
func (s *Service) process(ctx context.Context, job domain.LeadDelivery) {
	started := time.Now()
	var integration domain.LeadIntegration
	result := SendResult{}
	err := s.DB.WithContext(ctx).Where("id=?", job.IntegrationID).First(&integration).Error
	switch {
	case err != nil:
		result = SendResult{Error: "Connection no longer exists."}
	case !integration.Enabled:
		result = SendResult{Error: "Connection was paused before delivery."}
	case integration.Version != job.IntegrationVersion:
		result = SendResult{Error: "Connection configuration changed. Retry to use the current configuration."}
	case job.CycleAttempts > MaxAttempts:
		result = SendResult{Error: "Delivery exceeded its retry limit. Retry manually after checking the destination."}
	default:
		requestCtx, cancel := context.WithTimeout(ctx, 60*time.Second)
		result = s.Sender.Send(requestCtx, integration, job)
		cancel()
	}
	// A cancelled process leaves the lease intact for the next worker to recover.
	if ctx.Err() != nil {
		return
	}
	if err := s.finish(ctx, job, result, time.Since(started)); err != nil {
		log.Printf("lead delivery %s: unable to persist outcome", job.ID)
	}
}
func (s *Service) Run(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()
	for {
		for i := 0; i < 10 && ctx.Err() == nil; i++ {
			job, err := s.claim(ctx)
			if errors.Is(err, gorm.ErrRecordNotFound) {
				break
			}
			if err != nil {
				log.Print("lead delivery worker: unable to claim work")
				break
			}
			s.process(ctx, *job)
		}
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}
