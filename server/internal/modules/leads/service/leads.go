package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Service struct {
	DB      *gorm.DB
	Secrets *SecretBox
	Sender  *Sender
}

func New(db *gorm.DB) *Service {
	box := NewSecretBox()
	return &Service{DB: db, Secrets: box, Sender: NewSender(box)}
}
func bad(code int, message string) error { return &utils.ApiError{Code: code, Message: message} }
func (s *Service) Authorize(ctx context.Context, workspaceID, videoID, userID uuid.UUID) (*domain.Video, error) {
	var video domain.Video
	err := s.DB.WithContext(ctx).Model(&domain.Video{}).Joins("JOIN workspaces w ON w.id = video.workspace_id").Where("video.id = ? AND video.workspace_id = ? AND w.user_id = ? AND w.deleted_at IS NULL", videoID, workspaceID, userID).First(&video).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, bad(404, "Video not found in your workspace.")
	}
	return &video, err
}

type Filter struct {
	Page   int    `form:"page"`
	Limit  int    `form:"limit"`
	Search string `form:"search"`
	Status string `form:"status"`
	From   string `form:"from"`
	To     string `form:"to"`
	AsOf   string `form:"asOf"`
}

func (f *Filter) Validate() error {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit == 0 {
		f.Limit = 25
	}
	if f.Limit < 1 || f.Limit > 100 || f.Page > 100000 || len(f.Search) > 200 {
		return bad(400, "Invalid pagination or search.")
	}
	if f.Status != "" && f.Status != "all" && f.Status != "completed" && f.Status != "skipped" {
		return bad(400, "Invalid status.")
	}
	for _, value := range []string{f.From, f.To, f.AsOf} {
		if value != "" {
			if _, err := time.Parse(time.RFC3339Nano, value); err != nil {
				return bad(400, "Invalid date filter.")
			}
		}
	}
	if f.AsOf == "" {
		f.AsOf = time.Now().UTC().Format(time.RFC3339Nano)
	}
	if f.From != "" && f.To != "" {
		from, _ := time.Parse(time.RFC3339Nano, f.From)
		to, _ := time.Parse(time.RFC3339Nano, f.To)
		if from.After(to) {
			return bad(400, "Start date must precede end date.")
		}
	}
	return nil
}
func filtered(db *gorm.DB, videoID uuid.UUID, f Filter) *gorm.DB {
	q := db.Model(&domain.LeadFormSubmission{}).Where("video_id = ? AND created_at <= ?", videoID, f.AsOf)
	if f.Status == "completed" {
		q = q.Where("skipped = false")
	}
	if f.Status == "skipped" {
		q = q.Where("skipped = true")
	}
	if f.From != "" {
		q = q.Where("created_at >= ?", f.From)
	}
	if f.To != "" {
		q = q.Where("created_at < ?", f.To)
	}
	if term := strings.TrimSpace(f.Search); term != "" {
		escaped := strings.NewReplacer(`\`, `\\`, "%", `\%`, "_", `\_`).Replace(term)
		q = q.Where("EXISTS (SELECT 1 FROM lead_form_answer a WHERE a.submission_id = lead_form_submission.id AND a.value ILIKE ?)", "%"+escaped+"%")
	}
	return q
}

type Field struct {
	ID       uuid.UUID `json:"id"`
	Label    string    `json:"label"`
	Type     string    `json:"type"`
	Position int       `json:"position"`
	Archived bool      `json:"archived"`
}
type Row struct {
	domain.LeadFormSubmission
	Deliveries []domain.LeadDelivery `json:"deliveries"`
}
type Summary struct {
	Completed int64 `json:"completed"`
	Skipped   int64 `json:"skipped"`
	Pending   int64 `json:"pending"`
	Failed    int64 `json:"failed"`
}
type Page struct {
	Items      []Row   `json:"items"`
	Fields     []Field `json:"fields"`
	Total      int64   `json:"total"`
	Page       int     `json:"page"`
	Limit      int     `json:"limit"`
	AsOf       string  `json:"asOf"`
	Summary    Summary `json:"summary"`
	VideoTitle string  `json:"videoTitle"`
}

func (s *Service) Fields(ctx context.Context, videoID uuid.UUID) ([]Field, error) {
	fields := []Field{}
	// UNION retains even legacy orphaned answers. Identity is always the UUID, never label or position.
	err := s.DB.WithContext(ctx).Raw(`SELECT id,label,type,position,archived FROM (
 SELECT f.id,f.label,f.type,f.position,f.archived FROM lead_form_field f JOIN lead_form form ON form.id=f.form_id WHERE form.video_id=?
 UNION ALL
 SELECT a.field_id AS id, COALESCE(NULLIF(MAX(a.label),''),'Removed field') AS label, COALESCE(NULLIF(MAX(a.type),''),'text') AS type, MIN(a.position) AS position, true AS archived
 FROM lead_form_answer a JOIN lead_form_submission s ON s.id=a.submission_id LEFT JOIN lead_form_field f ON f.id=a.field_id WHERE s.video_id=? AND f.id IS NULL GROUP BY a.field_id
 ) fields ORDER BY archived ASC,position ASC,id ASC`, videoID, videoID).Scan(&fields).Error
	return fields, err
}
func normalizeAnswers(items []domain.LeadFormSubmission) {
	for i := range items {
		if items[i].Answers == nil {
			items[i].Answers = []domain.LeadFormAnswer{}
		}
		for j := range items[i].Answers {
			a := &items[i].Answers[j]
			if a.Label == "" {
				a.Label = "Removed field"
			}
			if a.Type == "" {
				a.Type = "text"
			}
		}
	}
}
func (s *Service) List(ctx context.Context, videoID uuid.UUID, f Filter) (*Page, error) {
	db := s.DB.WithContext(ctx)
	result := &Page{Page: f.Page, Limit: f.Limit, AsOf: f.AsOf, Items: []Row{}}
	if err := filtered(db, videoID, f).Count(&result.Total).Error; err != nil {
		return nil, err
	}
	fields, err := s.Fields(ctx, videoID)
	if err != nil {
		return nil, err
	}
	result.Fields = fields
	var items []domain.LeadFormSubmission
	if err := filtered(db, videoID, f).Order("created_at DESC,id DESC").Limit(f.Limit).Offset((f.Page-1)*f.Limit).Preload("Answers", func(db *gorm.DB) *gorm.DB { return db.Order("position ASC,id ASC") }).Find(&items).Error; err != nil {
		return nil, err
	}
	normalizeAnswers(items)
	ids := []uuid.UUID{}
	for _, item := range items {
		ids = append(ids, item.ID)
	}
	deliveries := []domain.LeadDelivery{}
	if len(ids) > 0 {
		if err := db.Where("submission_id IN ?", ids).Find(&deliveries).Error; err != nil {
			return nil, err
		}
	}
	for _, item := range items {
		row := Row{LeadFormSubmission: item, Deliveries: []domain.LeadDelivery{}}
		for _, delivery := range deliveries {
			if delivery.SubmissionID != nil && *delivery.SubmissionID == item.ID {
				row.Deliveries = append(row.Deliveries, delivery)
			}
		}
		result.Items = append(result.Items, row)
	}
	if err := db.Model(&domain.LeadFormSubmission{}).Select("count(*) FILTER (WHERE skipped = false) AS completed, count(*) FILTER (WHERE skipped = true) AS skipped").Where("video_id = ?", videoID).Scan(&result.Summary).Error; err != nil {
		return nil, err
	}
	var deliverySummary Summary
	if err := db.Model(&domain.LeadDelivery{}).Select("count(*) FILTER (WHERE status IN ('queued','retrying','delivering')) AS pending, count(*) FILTER (WHERE status='failed') AS failed").Where("video_id = ? AND is_test = false", videoID).Scan(&deliverySummary).Error; err != nil {
		return nil, err
	}
	result.Summary.Pending = deliverySummary.Pending
	result.Summary.Failed = deliverySummary.Failed
	return result, nil
}
func (s *Service) RecentDeliveries(ctx context.Context, videoID uuid.UUID) ([]domain.LeadDelivery, error) {
	rows := []domain.LeadDelivery{}
	err := s.DB.WithContext(ctx).Where("video_id = ?", videoID).Order("created_at DESC,id DESC").Limit(100).Find(&rows).Error
	return rows, err
}
func (s *Service) Attempts(ctx context.Context, videoID, id uuid.UUID) ([]domain.LeadDeliveryAttempt, error) {
	var delivery domain.LeadDelivery
	if err := s.DB.WithContext(ctx).Where("id = ? AND video_id = ?", id, videoID).First(&delivery).Error; err != nil {
		return nil, bad(404, "Delivery not found.")
	}
	rows := []domain.LeadDeliveryAttempt{}
	err := s.DB.WithContext(ctx).Where("delivery_id = ?", id).Order("created_at DESC").Limit(100).Find(&rows).Error
	return rows, err
}
func fieldHeader(f Field) string {
	label := f.Label
	if f.Archived {
		label += " (archived)"
	}
	return fmt.Sprintf("%s [%s]", label, f.ID.String())
}
