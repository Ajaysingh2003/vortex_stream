package services

import (
	"context"
	"errors"
	"math"
	"strings"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/form/dto"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func validateForm(data *dto.CreateFormReq) error {
	bad := func(message string) error { return &utils.ApiError{Code: 400, Message: message} }
	if data.Placement != "before_video" && data.Placement != "during_video" && data.Placement != "after_video" {
		return bad("Invalid form placement.")
	}
	if data.Placement == "during_video" && (data.ShowAt == nil || math.IsNaN(*data.ShowAt) || math.IsInf(*data.ShowAt, 0) || *data.ShowAt < 0) {
		return bad("A valid display time is required.")
	}
	if len(data.Fields) > 50 {
		return bad("A form can contain up to 50 fields.")
	}
	seen := map[uuid.UUID]bool{}
	for _, field := range data.Fields {
		if field.ID == uuid.Nil || seen[field.ID] {
			return bad("Field identifiers must be unique.")
		}
		seen[field.ID] = true
		if strings.TrimSpace(field.Label) == "" || len(field.Label) > 200 {
			return bad("Every field needs a label of up to 200 characters.")
		}
		if field.Type != "text" && field.Type != "dropdown" && field.Type != "checkbox" {
			return bad("Unsupported field type.")
		}
		if field.Type != "text" && (len(field.Options) == 0 || len(field.Options) > 100) {
			return bad("Choice fields need between 1 and 100 options.")
		}
		labels := map[string]bool{}
		for _, option := range field.Options {
			label := strings.TrimSpace(option.Label)
			if label == "" || len(label) > 200 || labels[label] {
				return bad("Options need distinct, nonempty labels of up to 200 characters.")
			}
			labels[label] = true
		}
	}
	return nil
}

func (r *formServiceRepo) Create(ctx context.Context, data *dto.CreateFormReq, userID uuid.UUID) error {
	if err := validateForm(data); err != nil {
		return err
	}
	if _, err := r.workspaceRepo.GetWorkspaceWithUserId(ctx, data.WorkspaceID, userID); err != nil {
		return err
	}
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Lock the video first to serialize creation of the first form too.
		var video domain.Video
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ? AND workspace_id = ?", data.VideoID, data.WorkspaceID).First(&video).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return &utils.ApiError{Code: 404, Message: "Video not found."}
			}
			return err
		}
		var form domain.LeadForm
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Preload("Fields.Options").Where("video_id = ?", data.VideoID).First(&form).Error
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		if errors.Is(err, gorm.ErrRecordNotFound) {
			form = domain.LeadForm{ID: uuid.New(), VideoID: data.VideoID, WorkspaceID: data.WorkspaceID, Version: 0}
		}
		existing := map[uuid.UUID]domain.LeadFormField{}
		for _, field := range form.Fields {
			existing[field.ID] = field
		}
		form.Placement = data.Placement
		form.ShowAt = data.ShowAt
		form.AllowSkip = data.AllowSkip
		form.Version++
		if err := tx.Omit("Fields").Save(&form).Error; err != nil {
			return err
		}
		// Snapshot legacy answers before a rename. Never delete fields referenced by old responses.
		if err := tx.Exec(`UPDATE lead_form_answer a SET label=f.label,type=f.type,position=f.position FROM lead_form_field f WHERE a.field_id=f.id AND f.form_id=? AND (a.label IS NULL OR a.label='')`, form.ID).Error; err != nil {
			return err
		}
		if err := tx.Model(&domain.LeadFormField{}).Where("form_id = ?", form.ID).Update("archived", true).Error; err != nil {
			return err
		}
		for index, input := range data.Fields {
			id := input.ID
			if old, ok := existing[id]; ok {
				// A type change creates a new column and mapping identity; the old field stays archived.
				if old.Type != input.Type {
					id = uuid.New()
				}
			} else {
				var count int64
				if err := tx.Model(&domain.LeadFormField{}).Where("id = ?", id).Count(&count).Error; err != nil {
					return err
				}
				if count > 0 {
					return &utils.ApiError{Code: 400, Message: "Field belongs to another form."}
				}
			}
			field := domain.LeadFormField{ID: id, FormID: form.ID, Label: strings.TrimSpace(input.Label), Type: input.Type, Position: index + 1, Archived: false}
			if err := tx.Omit("Options").Save(&field).Error; err != nil {
				return err
			}
			if err := tx.Where("field_id = ?", id).Delete(&domain.LeadFormFieldOption{}).Error; err != nil {
				return err
			}
			if input.Type != "text" {
				for _, option := range input.Options {
					value := domain.LeadFormFieldOption{ID: uuid.New(), FieldID: id, Label: strings.TrimSpace(option.Label)}
					if err := tx.Create(&value).Error; err != nil {
						return err
					}
				}
			}
		}
		return nil
	})
}
