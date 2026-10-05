package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

// LeadSubmissionAttribution holds the immutable attribution snapshot saved atomically
// with an accepted form submission. Contact and answer values are strictly excluded.
type LeadSubmissionAttribution struct {
	SubmissionID         uuid.UUID  `gorm:"type:uuid;primaryKey" json:"submission_id"`
	WorkspaceID          uuid.UUID  `gorm:"type:uuid;not null;index" json:"workspace_id"`
	VideoID              uuid.UUID  `gorm:"type:uuid;not null;index" json:"video_id"`
	FormID               uuid.UUID  `gorm:"type:uuid;not null;index" json:"form_id"`
	FormVersion          int        `gorm:"not null;default:1" json:"form_version"`
	Placement            string     `gorm:"type:varchar(50);not null" json:"placement"`
	SubmittedAt          time.Time  `gorm:"not null;index" json:"submitted_at"`
	PlaybackSessionID    *uuid.UUID `gorm:"type:uuid;index" json:"playback_session_id,omitempty"`
	MediaRevisionID      string     `gorm:"type:varchar(100)" json:"media_revision_id,omitempty"`
	ExperienceRevisionID string     `gorm:"type:varchar(100)" json:"experience_revision_id,omitempty"`
	Country              string     `gorm:"type:varchar(10);not null;default:'Unknown';index" json:"country"`
	CountrySource        string     `gorm:"type:varchar(50);not null;default:'unresolved'" json:"country_source"`
	PageOrigin           string     `gorm:"type:varchar(2048)" json:"page_origin,omitempty"`
	ReferrerOrigin       string     `gorm:"type:varchar(2048)" json:"referrer_origin,omitempty"`
	UTMSource            string     `gorm:"type:varchar(255)" json:"utm_source,omitempty"`
	UTMMedium            string     `gorm:"type:varchar(255)" json:"utm_medium,omitempty"`
	UTMCampaign          string     `gorm:"type:varchar(255);index" json:"utm_campaign,omitempty"`
	Surface              string     `gorm:"type:varchar(50)" json:"surface,omitempty"`
	AttributionVersion   int        `gorm:"not null;default:1" json:"attribution_version"`
	Skipped              bool       `gorm:"not null;default:false;index" json:"skipped"`
	CreatedAt            time.Time  `json:"created_at"`
}

func (LeadSubmissionAttribution) TableName() string {
	return "lead_submission_attribution"
}

// AnalyticsOutbox records transactional analytics events to be published reliably to NATS.
type AnalyticsOutbox struct {
	ID            uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	EventType     string         `gorm:"type:varchar(100);not null;index" json:"event_type"`
	SubmissionID  uuid.UUID      `gorm:"type:uuid;not null;index" json:"submission_id"`
	Payload       datatypes.JSON `gorm:"type:jsonb;not null" json:"payload"`
	Status        string         `gorm:"type:varchar(50);not null;default:'queued';index" json:"status"`
	Attempts      int            `gorm:"not null;default:0" json:"attempts"`
	NextAttemptAt time.Time      `gorm:"index" json:"next_attempt_at"`
	LeaseUntil    *time.Time     `json:"-"`
	LeaseToken    *uuid.UUID     `gorm:"type:uuid" json:"-"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	PublishedAt   *time.Time     `json:"published_at,omitempty"`
}

func (AnalyticsOutbox) TableName() string {
	return "analytics_outbox"
}

// AnalyticsExport tracks asynchronous report export jobs.
type AnalyticsExport struct {
	ID             uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	WorkspaceID    uuid.UUID      `gorm:"type:uuid;not null;index" json:"workspace_id"`
	VideoID        *uuid.UUID     `gorm:"type:uuid;index" json:"video_id,omitempty"`
	UserID         uuid.UUID      `gorm:"type:uuid;not null;index" json:"user_id"`
	ReportType     string         `gorm:"type:varchar(100);not null" json:"report_type"`
	Format         string         `gorm:"type:varchar(10);not null;default:'csv'" json:"format"`
	Params         datatypes.JSON `gorm:"type:jsonb;not null" json:"params"`
	IdempotencyKey string         `gorm:"type:varchar(255);index" json:"idempotency_key,omitempty"`
	Status         string         `gorm:"type:varchar(50);not null;default:'queued';index" json:"status"`
	Progress       int            `gorm:"not null;default:0" json:"progress"`
	FilePath       string         `gorm:"type:varchar(1024)" json:"-"`
	FileSize       int64          `gorm:"not null;default:0" json:"file_size"`
	RowCount       int64          `gorm:"not null;default:0" json:"row_count"`
	ErrorMessage   string         `gorm:"type:text" json:"error_message,omitempty"`
	ExpiresAt      time.Time      `gorm:"not null;index" json:"expires_at"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	CompletedAt    *time.Time     `json:"completed_at,omitempty"`
}

func (AnalyticsExport) TableName() string {
	return "analytics_exports"
}

// VideoMediaRevision stores immutable media revisions for a video.
type VideoMediaRevision struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	VideoID        uuid.UUID `gorm:"type:uuid;not null;index" json:"video_id"`
	RevisionNumber int       `gorm:"not null;default:1" json:"revision_number"`
	DurationMS     int64     `gorm:"not null;default:0" json:"duration_ms"`
	VideoKey       string    `gorm:"type:varchar(1024)" json:"video_key"`
	MasterKey      string    `gorm:"type:varchar(1024)" json:"master_key"`
	CreatedAt      time.Time `json:"created_at"`
}

func (VideoMediaRevision) TableName() string {
	return "video_media_revisions"
}

// VideoExperienceRevision stores snapshots of published interactive configurations.
type VideoExperienceRevision struct {
	ID             uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	VideoID        uuid.UUID      `gorm:"type:uuid;not null;index" json:"video_id"`
	RevisionNumber int            `gorm:"not null;default:1" json:"revision_number"`
	Metadata       datatypes.JSON `gorm:"type:jsonb" json:"metadata"`
	CreatedAt      time.Time      `json:"created_at"`
}

func (VideoExperienceRevision) TableName() string {
	return "video_experience_revisions"
}
