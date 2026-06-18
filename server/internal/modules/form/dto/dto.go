package dto

import (
	"strings"
	"time"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/google/uuid"
)

type CreateFormReq struct {
	ID          uuid.UUID        `json:"id" validate:"required"`
	VideoID     uuid.UUID        `json:"video_id" validate:"required,uuid"`
	WorkspaceID uuid.UUID        `json:"workspace_id" validate:"required,uuid"`
	Placement   string           `json:"placement" validate:"required,oneof=before_video during_video after_video"`
	ShowAt      *float64         `json:"show_at" validate:"omitempty,required_if=Placement during_video"`
	AllowSkip   bool             `json:"allow_skip"`
	Fields      []CreateFieldReq `json:"fields" validate:"required,dive,required"`
}

// CreateFieldReq represents a single field layout config inside the Form creation payload.
type CreateFieldReq struct {
	ID       uuid.UUID         `json:"id" validate:"required"`
	Label    string            `json:"label" validate:"required"`
	Type     string            `json:"type" validate:"required,oneof=text dropdown checkbox"`
	Position int               `json:"position" validate:"required,min=1"`
	Options  []CreateOptionReq `json:"options" validate:"required_if=Type dropdown required_if=Type checkbox,dive"`
}

type CreateOptionReq struct {
	
	ID          uuid.UUID        `json:"id" validate:"required"`
	Label string `json:"label" validate:"required"`

}

func (dto *CreateFormReq) ToEntity() *domain.LeadForm {
	formID := uuid.New()
	fieldPtrs := dto.ToFieldEntities(formID)

	fields := make([]domain.LeadFormField, len(fieldPtrs))
	for i, ptr := range fieldPtrs {
		fields[i] = *ptr
	}

	return &domain.LeadForm{
		ID:          formID,
		VideoID:     dto.VideoID,
		WorkspaceID: dto.WorkspaceID,
		Placement:   dto.Placement,
		ShowAt:      dto.ShowAt,
		AllowSkip:   dto.AllowSkip,
		Fields:      fields,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
}

func (dto *CreateFormReq) ToFieldEntities(formID uuid.UUID) []*domain.LeadFormField {
	entities := make([]*domain.LeadFormField, len(dto.Fields))
	for i, f := range dto.Fields {
		fieldID := uuid.New()
		// fieldScope := generateScope(f.Label)

		var entityOptions []domain.LeadFormFieldOption
		if len(f.Options) > 0 {
			entityOptions = make([]domain.LeadFormFieldOption, len(f.Options))
			for j, opt := range f.Options {
				entityOptions[j] = domain.LeadFormFieldOption{
					ID:      uuid.New(),
					FieldID: fieldID,
					Label:   opt.Label,
					// Scope:   generateScope(opt.Label),
					// Position: opt.Position,
				}
			}
		}

		entities[i] = &domain.LeadFormField{
			ID:       fieldID,
			FormID:   formID,
			Label:    f.Label,
			// Scope:    fieldScope,
			Type:     f.Type,
			Position: f.Position,
			Options:  entityOptions,
		}
	}
	return entities
}

func generateScope(label string) string {
	cleaned := strings.TrimSpace(label)
	cleaned = strings.ToLower(cleaned)
	// Replace spaces with underscores
	return strings.ReplaceAll(cleaned, " ", "_")
}

func ToOptionEntities(fieldEntities []*domain.LeadFormField) []*domain.LeadFormFieldOption {
	var optionPtrs []*domain.LeadFormFieldOption
	for _, field := range fieldEntities {
		for i := range field.Options {
			// We must take the address of the array element directly using its index
			// to avoid capturing the iterator variable address.
			optionPtrs = append(optionPtrs, &field.Options[i])
		}
	}
	return optionPtrs
}
