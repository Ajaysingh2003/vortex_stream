package domain

import (
	"github.com/google/uuid"
	"gorm.io/datatypes"
	"time"
)

// Credentials are encrypted before persistence and never serialized to clients.
type LeadIntegration struct {
	ID           uuid.UUID         `gorm:"type:uuid;primaryKey" json:"id"`
	WorkspaceID  uuid.UUID         `gorm:"type:uuid;not null;index" json:"workspaceId"`
	VideoID      uuid.UUID         `gorm:"type:uuid;not null;index" json:"videoId"`
	Name         string            `gorm:"not null" json:"name"`
	Kind         string            `gorm:"not null" json:"kind"`
	Endpoint     string            `json:"endpoint"`
	SecretCipher string            `gorm:"not null" json:"-"`
	Mapping      datatypes.JSONMap `gorm:"type:jsonb;not null" json:"mapping"`
	Enabled      bool              `gorm:"not null" json:"enabled"`
	Version      int               `gorm:"not null;default:1" json:"version"`
	CreatedAt    time.Time         `json:"createdAt"`
	UpdatedAt    time.Time         `json:"updatedAt"`
}

// The outbox row is committed in the same transaction as the lead.
type LeadDelivery struct {
	ID                 uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	IntegrationID      uuid.UUID      `gorm:"type:uuid;not null;uniqueIndex:idx_lead_delivery_event" json:"integrationId"`
	SubmissionID       *uuid.UUID     `gorm:"type:uuid;uniqueIndex:idx_lead_delivery_event" json:"submissionId"`
	VideoID            uuid.UUID      `gorm:"type:uuid;not null;index" json:"videoId"`
	IntegrationVersion int            `gorm:"not null" json:"-"`
	IsTest             bool           `gorm:"not null;default:false" json:"isTest"`
	Payload            datatypes.JSON `gorm:"type:jsonb;not null" json:"-"`
	Status             string         `gorm:"not null;index:idx_lead_delivery_due" json:"status"`
	Attempts           int            `gorm:"not null;default:0" json:"attempts"`
	CycleAttempts      int            `gorm:"not null;default:0" json:"-"`
	NextAttemptAt      time.Time      `gorm:"index:idx_lead_delivery_due" json:"nextAttemptAt"`
	LeaseUntil         *time.Time     `json:"-"`
	LeaseToken         uuid.UUID      `gorm:"type:uuid" json:"-"`
	LastError          string         `json:"lastError"`
	HTTPStatus         int            `json:"httpStatus"`
	CreatedAt          time.Time      `json:"createdAt"`
	UpdatedAt          time.Time      `json:"updatedAt"`
	DeliveredAt        *time.Time     `json:"deliveredAt"`
}

type LeadDeliveryAttempt struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	DeliveryID uuid.UUID `gorm:"type:uuid;not null;index" json:"deliveryId"`
	Attempt    int       `json:"attempt"`
	HTTPStatus int       `json:"httpStatus"`
	Error      string    `json:"error"`
	DurationMs int64     `json:"durationMs"`
	CreatedAt  time.Time `json:"createdAt"`
}
