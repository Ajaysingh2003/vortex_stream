package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/mail"
	"strings"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	formdto "github.com/ajaysingh2003/vortex-stream/internal/modules/form/dto"
	leads "github.com/ajaysingh2003/vortex-stream/internal/modules/leads/service"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func validateSubmission(form *domain.LeadForm, req *formdto.SubmitFormReq) error {
	invalid := func(message string) error { return &utils.ApiError{Code: 400, Message: message} }
	if req.ID == uuid.Nil || req.SessionID == uuid.Nil || req.FormID != form.ID || (req.FormVersion != 0 && req.FormVersion != form.Version) {
		return invalid("This form has changed. Please reload the video.")
	}
	if req.Skipped {
		if !form.AllowSkip {
			return invalid("Please complete the form to continue.")
		}
		if len(req.Answers) != 0 {
			return invalid("Skipped forms cannot include answers.")
		}
		return nil
	}
	if len(form.Fields) == 0 || len(req.Answers) != len(form.Fields) {
		return invalid("Please complete all fields.")
	}
	for _, field := range form.Fields {
		value := strings.TrimSpace(req.Answers[field.ID.String()])
		if value == "" || len(value) > 4000 {
			return invalid(fmt.Sprintf("Please enter a valid answer for %s.", field.Label))
		}
		switch field.Type {
		case "text":
			label := strings.ToLower(field.Label)
			if strings.Contains(label, "email") || strings.Contains(label, "e-mail") {
				address, err := mail.ParseAddress(value)
				if err != nil || address.Address != value {
					return invalid("Please enter a valid email address.")
				}
			}
		case "dropdown", "checkbox":
			values := []string{value}
			if field.Type == "checkbox" {
				if err := json.Unmarshal([]byte(value), &values); err != nil || len(values) == 0 {
					return invalid("Please select at least one option.")
				}
			}
			allowed := make(map[string]bool)
			for _, option := range field.Options {
				allowed[option.Label] = true
			}
			seen := make(map[string]bool)
			for _, selected := range values {
				if !allowed[selected] || seen[selected] {
					return invalid("An option has changed. Please reload the video.")
				}
				seen[selected] = true
			}
		default:
			return invalid("This form contains an unsupported field.")
		}
	}
	return nil
}

func (r *formServiceRepo) Submit(ctx context.Context, videoID uuid.UUID, req *formdto.SubmitFormReq) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var form domain.LeadForm
		// Serialise retries for the same form, and bind every answer to its saved schema.
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Preload("Fields", "archived = ?", false).Preload("Fields.Options").Where("video_id = ?", videoID).First(&form).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &utils.ApiError{Code: 404, Message: "Form not found."}
		}
		if err != nil {
			return err
		}
		var existing domain.LeadFormSubmission
		err = tx.First(&existing, "id = ?", req.ID).Error
		if err == nil {
			if existing.FormID == form.ID && existing.VideoID == videoID && existing.SessionID == req.SessionID {
				return nil
			}
			return &utils.ApiError{Code: 409, Message: "Invalid submission identifier."}
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		if err := validateSubmission(&form, req); err != nil {
			return err
		}
		submission := domain.LeadFormSubmission{ID: req.ID, FormID: form.ID, VideoID: videoID, SessionID: req.SessionID, Skipped: req.Skipped, FormVersion: form.Version, Placement: form.Placement}
		if !req.Skipped {
			for _, field := range form.Fields {
				submission.Answers = append(submission.Answers, domain.LeadFormAnswer{ID: uuid.New(), SubmissionID: req.ID, FieldID: field.ID, Label: field.Label, Type: field.Type, Position: field.Position, Value: strings.TrimSpace(req.Answers[field.ID.String()])})
			}
		}
		if err := tx.Create(&submission).Error; err != nil {
			return err
		}
		if submission.Skipped {
			return nil
		}
		return leads.Enqueue(tx, &submission)
	})
}
