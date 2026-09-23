package service

import (
	"context"
	"regexp"
	"strings"
	"time"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type IntegrationInput struct {
	Name     string            `json:"name"`
	Kind     string            `json:"kind"`
	Endpoint string            `json:"endpoint"`
	Secret   string            `json:"secret"`
	Mapping  map[string]string `json:"mapping"`
	Enabled  bool              `json:"enabled"`
	Version  int               `json:"version"`
}
type IntegrationView struct {
	domain.LeadIntegration
	SecretConfigured bool `json:"secretConfigured"`
}
type IntegrationList struct {
	Items           []IntegrationView `json:"items"`
	EncryptionReady bool              `json:"encryptionReady"`
}

func (s *Service) Integrations(ctx context.Context, videoID uuid.UUID) (*IntegrationList, error) {
	rows := []domain.LeadIntegration{}
	if err := s.DB.WithContext(ctx).Where("video_id=?", videoID).Order("created_at ASC").Find(&rows).Error; err != nil {
		return nil, err
	}
	result := &IntegrationList{Items: []IntegrationView{}, EncryptionReady: s.Secrets.Ready()}
	for _, row := range rows {
		result.Items = append(result.Items, IntegrationView{row, row.SecretCipher != ""})
	}
	return result, nil
}

var propertyPattern = regexp.MustCompile(`^[a-z][a-z0-9_]{0,99}$`)

func (s *Service) SaveIntegration(ctx context.Context, workspaceID, videoID, id uuid.UUID, input IntegrationInput) (*IntegrationView, error) {
	input.Name = strings.TrimSpace(input.Name)
	input.Endpoint = strings.TrimSpace(input.Endpoint)
	if input.Name == "" || len(input.Name) > 100 {
		return nil, bad(400, "Enter a connection name of up to 100 characters.")
	}
	if input.Kind != "webhook" && input.Kind != "hubspot" {
		return nil, bad(400, "Unsupported integration.")
	}
	if len(input.Secret) > 4096 || len(input.Mapping) > 50 {
		return nil, bad(400, "Invalid credentials or field mapping.")
	}
	if input.Kind == "webhook" {
		if err := validateEndpoint(input.Endpoint); err != nil {
			return nil, err
		}
	} else {
		input.Endpoint = "https://api.hubapi.com"
	}
	result := domain.LeadIntegration{}
	err := s.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Limit creation safely under concurrent requests and serialize against form edits.
		var video domain.Video
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id=? AND workspace_id=?", videoID, workspaceID).First(&video).Error; err != nil {
			return err
		}
		if id == uuid.Nil {
			var count int64
			if err := tx.Model(&domain.LeadIntegration{}).Where("video_id=?", videoID).Count(&count).Error; err != nil {
				return err
			}
			if count >= 5 {
				return bad(400, "Up to five connections are supported per video.")
			}
			result = domain.LeadIntegration{ID: uuid.New(), WorkspaceID: workspaceID, VideoID: videoID}
		} else {
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id=? AND video_id=?", id, videoID).First(&result).Error; err != nil {
				return bad(404, "Connection not found.")
			}
			if input.Version != result.Version {
				return bad(409, "This connection changed. Reload before saving.")
			}
			if input.Kind != result.Kind {
				return bad(400, "Create a new connection to change the provider.")
			}
		}
		if input.Secret != "" {
			if len(input.Secret) < 16 {
				return bad(400, "Use a token or signing secret of at least 16 characters.")
			}
			encrypted, err := s.Secrets.Seal(input.Secret)
			if err != nil {
				return err
			}
			result.SecretCipher = encrypted
		}
		if result.SecretCipher == "" {
			return bad(400, "A token or signing secret is required.")
		}
		if input.Enabled && !s.Secrets.Ready() {
			return bad(503, "Configure the server encryption key before enabling connections.")
		}
		mapping := datatypes.JSONMap{}
		if input.Kind == "hubspot" {
			hasEmail := false
			properties := map[string]bool{}
			for fieldID, property := range input.Mapping {
				fieldUUID, err := uuid.Parse(fieldID)
				if err != nil || !propertyPattern.MatchString(property) || properties[property] {
					return bad(400, "Use distinct, valid HubSpot property names.")
				}
				properties[property] = true
				var count int64
				if err := tx.Model(&domain.LeadFormField{}).Joins("JOIN lead_form form ON form.id=lead_form_field.form_id").Where("lead_form_field.id=? AND form.video_id=?", fieldUUID, videoID).Count(&count).Error; err != nil {
					return err
				}
				if count == 0 {
					return bad(400, "A mapped field no longer belongs to this video.")
				}
				mapping[fieldID] = property
				if property == "email" {
					hasEmail = true
				}
			}
			if !hasEmail {
				return bad(400, "Map a form field to the HubSpot email property.")
			}
		}
		result.Name = input.Name
		result.Kind = input.Kind
		result.Endpoint = input.Endpoint
		result.Enabled = input.Enabled
		result.Mapping = mapping
		result.Version++
		return tx.Save(&result).Error
	})
	if err != nil {
		return nil, err
	}
	return &IntegrationView{result, true}, nil
}
func (s *Service) TestIntegration(ctx context.Context, videoID, id uuid.UUID) error {
	return s.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var integration domain.LeadIntegration
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id=? AND video_id=? AND enabled=true", id, videoID).First(&integration).Error; err != nil {
			return bad(409, "Enable the connection to test it.")
		}
		var count int64
		if err := tx.Model(&domain.LeadDelivery{}).Where("integration_id=? AND is_test=true AND (created_at > ? OR status IN ('queued','retrying','delivering'))", id, time.Now().Add(-30*time.Second)).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			return bad(429, "A connection check is already pending or was just requested. Please wait before testing again.")
		}
		job, err := makeDelivery(integration, &domain.LeadFormSubmission{VideoID: videoID, Answers: []domain.LeadFormAnswer{}}, true)
		if err != nil {
			return err
		}
		return tx.Create(&job).Error
	})
}
