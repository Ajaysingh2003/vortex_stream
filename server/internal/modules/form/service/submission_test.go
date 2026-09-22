package services

import (
	"testing"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	formdto "github.com/ajaysingh2003/vortex-stream/internal/modules/form/dto"
	"github.com/google/uuid"
)

func TestValidateSubmission(t *testing.T) {
	formID, emailID, choiceID, checkID := uuid.New(), uuid.New(), uuid.New(), uuid.New()
	form := domain.LeadForm{ID: formID, AllowSkip: true, Fields: []domain.LeadFormField{
		{ID: emailID, Label: "Email", Type: "text"},
		{ID: choiceID, Label: "Team", Type: "dropdown", Options: []domain.LeadFormFieldOption{{Label: "Small"}, {Label: "Large"}}},
		{ID: checkID, Label: "Interests", Type: "checkbox", Options: []domain.LeadFormFieldOption{{Label: "Video"}, {Label: "Ads"}}},
	}}
	tests := []struct {
		name   string
		change func(*formdto.SubmitFormReq, *domain.LeadForm)
		valid  bool
	}{
		{"valid lead", func(_ *formdto.SubmitFormReq, _ *domain.LeadForm) {}, true},
		{"blank required answer", func(r *formdto.SubmitFormReq, _ *domain.LeadForm) { r.Answers[emailID.String()] = "  " }, false},
		{"invalid email", func(r *formdto.SubmitFormReq, _ *domain.LeadForm) { r.Answers[emailID.String()] = "not-an-email" }, false},
		{"unknown field", func(r *formdto.SubmitFormReq, _ *domain.LeadForm) {
			delete(r.Answers, emailID.String())
			r.Answers[uuid.New().String()] = "test@example.com"
		}, false},
		{"unknown option", func(r *formdto.SubmitFormReq, _ *domain.LeadForm) { r.Answers[choiceID.String()] = "Forged" }, false},
		{"empty checkbox", func(r *formdto.SubmitFormReq, _ *domain.LeadForm) { r.Answers[checkID.String()] = "[]" }, false},
		{"duplicate checkbox", func(r *formdto.SubmitFormReq, _ *domain.LeadForm) { r.Answers[checkID.String()] = `["Ads","Ads"]` }, false},
		{"foreign form", func(r *formdto.SubmitFormReq, _ *domain.LeadForm) { r.FormID = uuid.New() }, false},
		{"missing identity", func(r *formdto.SubmitFormReq, _ *domain.LeadForm) { r.SessionID = uuid.Nil }, false},
		{"allowed skip", func(r *formdto.SubmitFormReq, _ *domain.LeadForm) { r.Skipped = true; r.Answers = nil }, true},
		{"required form cannot skip", func(r *formdto.SubmitFormReq, f *domain.LeadForm) {
			r.Skipped = true
			r.Answers = nil
			f.AllowSkip = false
		}, false},
		{"skip cannot carry answers", func(r *formdto.SubmitFormReq, _ *domain.LeadForm) { r.Skipped = true }, false},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			candidate := form
			req := formdto.SubmitFormReq{ID: uuid.New(), FormID: formID, SessionID: uuid.New(), Answers: map[string]string{emailID.String(): "test@example.com", choiceID.String(): "Small", checkID.String(): `["Ads"]`}}
			test.change(&req, &candidate)
			err := validateSubmission(&candidate, &req)
			if (err == nil) != test.valid {
				t.Fatalf("valid=%v, error=%v", test.valid, err)
			}
		})
	}
}
