package services

import (
	"context"
	"encoding/json"
	"time"

	model "github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	analyticsDomain "github.com/ajaysingh2003/vortex-stream/internal/modules/analytics/domain"
	natsConfig "github.com/ajaysingh2003/vortex-stream/internal/shared/config/nats"
	"github.com/google/uuid"
	"github.com/nats-io/nats.go"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type OutboxDispatcher struct {
	db   *gorm.DB
	nats *natsConfig.Client
}

func NewOutboxDispatcher(db *gorm.DB, natsClient *natsConfig.Client) *OutboxDispatcher {
	return &OutboxDispatcher{db: db, nats: natsClient}
}

func (d *OutboxDispatcher) Run(ctx context.Context) {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			d.dispatchBatch(ctx)
		}
	}
}

func (d *OutboxDispatcher) dispatchBatch(ctx context.Context) {
	if d.db == nil || d.nats == nil {
		return
	}
	now := time.Now().UTC()
	leaseToken := uuid.New()
	leaseUntil := now.Add(30 * time.Second)

	var leasedIDs []uuid.UUID
	err := d.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var items []model.AnalyticsOutbox
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE", Table: clause.Table{Name: "analytics_outbox"}}).
			Where("(status = 'queued' OR (status = 'failed' AND attempts < 10)) AND next_attempt_at <= ? AND (lease_until IS NULL OR lease_until < ?)", now, now).
			Limit(50).
			Find(&items).Error; err != nil {
			return err
		}
		if len(items) == 0 {
			return nil
		}
		for _, item := range items {
			leasedIDs = append(leasedIDs, item.ID)
		}
		return tx.Model(&model.AnalyticsOutbox{}).
			Where("id IN ?", leasedIDs).
			Updates(map[string]interface{}{
				"lease_token": &leaseToken,
				"lease_until": leaseUntil,
			}).Error
	})
	if err != nil || len(leasedIDs) == 0 {
		return
	}

	var items []model.AnalyticsOutbox
	if err := d.db.WithContext(ctx).Where("id IN ? AND lease_token = ?", leasedIDs, leaseToken).Find(&items).Error; err != nil {
		return
	}

	for _, item := range items {
		if err := d.publishItem(ctx, &item); err != nil {
			nextAttempt := time.Now().UTC().Add(time.Duration(1<<item.Attempts) * time.Second)
			_ = d.db.WithContext(ctx).Model(&item).Updates(map[string]interface{}{
				"status":          "failed",
				"attempts":        item.Attempts + 1,
				"next_attempt_at": nextAttempt,
				"lease_until":     nil,
				"lease_token":     nil,
			}).Error
		} else {
			publishedNow := time.Now().UTC()
			_ = d.db.WithContext(ctx).Model(&item).Updates(map[string]interface{}{
				"status":       "published",
				"published_at": &publishedNow,
				"lease_until":  nil,
				"lease_token":  nil,
			}).Error
		}
	}
}

func (d *OutboxDispatcher) publishItem(ctx context.Context, item *model.AnalyticsOutbox) error {
	var payload map[string]interface{}
	if err := json.Unmarshal(item.Payload, &payload); err != nil {
		return err
	}

	workspaceIDStr, _ := payload["workspace_id"].(string)
	videoIDStr, _ := payload["video_id"].(string)
	wsID, _ := uuid.Parse(workspaceIDStr)
	vidID, _ := uuid.Parse(videoIDStr)
	sessionID, _ := payload["playback_session_id"].(string)
	country, _ := payload["country"].(string)
	mediaRev, _ := payload["media_revision_id"].(string)
	expRev, _ := payload["experience_revision_id"].(string)
	utmSource, _ := payload["utm_source"].(string)
	utmMed, _ := payload["utm_medium"].(string)
	utmCamp, _ := payload["utm_campaign"].(string)
	surface, _ := payload["surface"].(string)

	event := analyticsDomain.Event{
		EventID:              uuid.New(),
		EventName:            "lead_submission_saved",
		EventVersion:         2,
		OccurredAt:           item.CreatedAt,
		ReceivedAt:           time.Now().UTC(),
		WorkspaceID:          &wsID,
		VideoID:              &vidID,
		PlaybackSessionID:    sessionID,
		MediaRevisionID:      mediaRev,
		ExperienceRevisionID: expRev,
		Country:              country,
		UTMSource:            utmSource,
		UTMMedium:            utmMed,
		UTMCampaign:          utmCamp,
		Surface:              surface,
		Properties:           json.RawMessage(item.Payload),
	}

	batch := analyticsDomain.Batch{
		Events: []analyticsDomain.Event{event},
	}
	body, err := json.Marshal(batch)
	if err != nil {
		return err
	}

	_, err = d.nats.JS.Publish(d.nats.Subject, body, nats.Context(ctx))
	return err
}
