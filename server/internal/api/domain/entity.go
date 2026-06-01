package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type UserRole string

type VideoStatus string

const (
	StatusPending VideoStatus = "PENDING"

	StatusQueue VideoStatus = "QUEUE"

	StatusProcessing VideoStatus = "PROCESSING"

	StatusReady VideoStatus = "READY"

	StatusFailed VideoStatus = "FAILED"
)

const (
	RoleUser UserRole = "User"

	RoleAdmin UserRole = "Admin"
)

type OAuthProvider string

type Folder struct {
	ID uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	// Part 1 of the unique workspace-parent-name composite index
	WorkspaceID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_workspace_parent_name" json:"workspaceId"`
	// Part 2 of the composite index (Pointer allows NULL for root folders)
	ParentID *uuid.UUID `gorm:"type:uuid;uniqueIndex:idx_workspace_parent_name" json:"parentId"`
	Position int        `gorm:"default:0" json:"position"`
	// Part 3 of the composite index
	Name      string    `gorm:"type:varchar(255);not null;uniqueIndex:idx_workspace_parent_name" json:"name"`
	Children  []Folder  `gorm:"foreignKey:ParentID;constraint:onDelete:CASCADE;" json:"children,omitempty"`
	Videos    []Video   `gorm:"foreignKey:FolderID;constraint:onDelete:CASCADE;" json:"videos,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

const (
	ProviderGoogle OAuthProvider = "GOOGLE"
	ProviderGitHub OAuthProvider = "GITHUB"
	ProviderEmail  OAuthProvider = "Email"
)

type PlanTier string

const (
	Free     PlanTier = "FREE"
	Starter  PlanTier = "STARTER"
	Pro      PlanTier = "PRO"
	Business PlanTier = "BUSINESS"
)

type Subscription struct {
	ID                   uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID               uuid.UUID `gorm:"type:uuid;index" json:"userId"`
	StripeSubscriptionID string    `gorm:"type:varchar(255);not null" json:"stripe_subscription_id"`
	StripePriceID        string    `gorm:"type:varchar(255);not null" json:"stripe_price_id"`
	Plan                 PlanTier  `gorm:"type:varchar(50);not null;default:'free'" json:"plan"`
	Status               string    `gorm:"type:varchar(50);not null;default:'active'" josn:"status"`
	PeriodStart          time.Time `gorm:"type:timestamptz;not null" json:"period_start"`
	PeriodEnd            time.Time `gorm:"type:timestamptz;not null" json:"period_end"`
	CreatedAt            time.Time `json:"createdAt"`
	UpdatedAt            time.Time `json:"updatedAt"`
}

type UserUsageCounters struct {
	UserID                  uuid.UUID      `gorm:"type:uuid;primaryKey" json:"user_id"`
	StorageBytesUsed        int64          `gorm:"type:bigint;default:0" json:"storage_bytes_used"`
	PlaybackMinutesUsed     int            `gorm:"type:integer;default:0" json:"playback_minutes_used"`
	SubtitleGenerationsUsed int            `gorm:"type:integer;default:0" json:"subtitle_generations_used"`
	ResetAt                 time.Time      `gorm:"type:timestamptz;not null" json:"reset_at"`
	UpdatedAt               time.Time      `gorm:"type:timestamptz;default:CURRENT_TIMESTAMP" json:"updated_at"`
	DeletedAt               gorm.DeletedAt `gorm:"index" json:"-"`
}
type Workspaces struct {
	ID   uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Name string    `gorm:"type:varchar(255);not null" json:"name"`

	UserID uuid.UUID `gorm:"type:uuid;index" json:"userId"`
	User   *User     `gorm:"foreignKey:UserID;references:ID" json:"user,omitempty"`

	IsDefault bool           `gorm:"default:false" json:"isDefault"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Videos    []Video        `gorm:"foreignKey:WorkspaceID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"videos,omitempty"`
	Folders []Folder `gorm:"foreignKey:WorkspaceID" json:"folders,omitempty"`
	PlayerSettings *PlayerSettings `gorm:"foreignKey:WorkspaceId;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"playerSettings,omitempty"`
}

type PlayerSettings struct {
	ID uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`

	WorkspaceId uuid.UUID `gorm:"type:uuid;uniqueIndex" json:"workspaceId"`

	GeneralSettings  datatypes.JSON `json:"general_settings" gorm:"type:jsonb;default:'{}'"`
	ControlSettings  datatypes.JSON `json:"control_settings" gorm:"type:jsonb;default:'{}'"`
	BrandingSettings datatypes.JSON `json:"branding_settings" gorm:"type:jsonb;default:'{}'"`
	SecuritySettings datatypes.JSON `json:"security_settings" gorm:"type:jsonb;default:'{}'"`
	AdvancedSettings datatypes.JSON `json:"advanced_settings" gorm:"type:jsonb;default:'{}'"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// UserRole and VideoStatus remain exactly as you wrote them - they are perfect.

type User struct {
	// Changed ID back to uuid.UUID for consistency with Video and VideoResolution
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	Email     string         `gorm:"uniqueIndex;not null" json:"email"`
	Password  string         `gorm:"not null" json:"-"`
	Name      *string        `gorm:"type:varchar(255)" json:"name"`
	Avatar    *string        `gorm:"type:varchar(255)" json:"avatar"`
	Role      UserRole       `gorm:"type:varchar(20);default:'User'" json:"role"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	IsActive  bool           `gorm:"default:true" json:"isActive"`
	// Videos []Video `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"videos,omitempty"`
	Workspaces []Workspaces `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"workspaces,omitempty"`
	Accounts   []Account    `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"accounts,omitempty"`
}

type Account struct {
	ID         uuid.UUID     `gorm:"type:uuid;primaryKey" json:"id"`
	UserID     uuid.UUID     `gorm:"type:uuid;index" json:"userId"`
	Provider   OAuthProvider `gorm:"type:varchar(20);not null" json:"provider"`
	ProviderID string        `gorm:"uniqueIndex:idx_provider_user;not null" json:"providerId"`
	CreatedAt  time.Time
}

type Video struct {
	ID          uuid.UUID   `gorm:"type:uuid;primaryKey" json:"id"`
	Title       string      `gorm:"type:varchar(255);not null" json:"title"`
	FolderID    *uuid.UUID  `gorm:"type:uuid;index" json:"folderId"`
	WorkspaceID uuid.UUID   `gorm:"type:uuid;index" json:"WorkspaceId"`
	Workspace   *Workspaces `gorm:"foreignKey:WorkspaceID;references:ID" json:"workspace.omitempty"`
	// Paths in S3/MinIO
	VideoKey  string `gorm:"not null" json:"videoKey"`
	MasterKey string `gorm:"not null" json:"masterKey"`

	Size      int64  `json:"size"`
	Thumbnail string `json:"thumbnail"`
	Duration  int    `json:"duration"`
	IsPrivate bool   `gorm:"default:true" json:"isPrivate"`

	// Relationships
	// UserID    uuid.UUID `gorm:"type:uuid;index" json:"userId"`
	// User      *User     `gorm:"foreignKey:UserID;references:ID" json:"user,omitempty"`

	Status         VideoStatus       `gorm:"type:varchar(20);default:'PENDING'" json:"status"`
	Resolutions    []VideoResolution `gorm:"foreignKey:VideoID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"resolutions"`
	AllowedDomains []VideoDomain     `gorm:"foreignKey:VideoID;constraint:OnDelete:CASCADE" json:"allowedDomains,omitempty"`
	CreatedAt      time.Time         `json:"createdAt"`
	UpdatedAt      time.Time         `json:"updatedAt"`
	DeletedAt      gorm.DeletedAt    `gorm:"index" json:"-"`
}

type VideoResolution struct {
	ID      uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	VideoID uuid.UUID `gorm:"type:uuid;index" json:"videoId"`

	Resolution   string `gorm:"type:varchar(10)" json:"resolution"` // e.g., "1080p"
	PlaylistPath string `gorm:"not null" json:"playlistPath"`       // Path to the specific index.m3u8
	Size         int64  `json:"size"`

	CreatedAt time.Time `json:"createdAt"`
}

type VideoDomain struct {
	ID uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`

	// The allowed domain (e.g., "mycourse-site.com" or "localhost:3000")
	Domain string `gorm:"type:varchar(255);not null" json:"domain"`

	// Relationship to Video
	VideoID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_video_domain" json:"videoId"`

	// Adding the uniqueIndex name to both fields creates the composite unique constraint
	// This prevents the same domain from being added twice for the same video
	Video *Video `gorm:"foreignKey:VideoID;references:ID" json:"-"`

	CreatedAt time.Time `json:"createdAt"`
}
