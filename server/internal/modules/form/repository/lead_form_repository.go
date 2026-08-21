package repository

import (
	"context"
	"errors"
	"math"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	formdto "github.com/ajaysingh2003/vortex-stream/internal/modules/form/dto"
	// "github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type LeadFormRepository interface {
	CreateTx(ctx context.Context, tx *gorm.DB, form *domain.LeadForm) (*domain.LeadForm, error)
	Create(ctx context.Context, form *domain.LeadForm) (*domain.LeadForm, error)
	GetByID(ctx context.Context, id uuid.UUID) (*domain.LeadForm, error)
	GetByVideoID(ctx context.Context, videoID uuid.UUID) (*domain.LeadForm, error)
	GetOverviewByWorkspaceID(ctx context.Context, workspaceID uuid.UUID, recentLimit int) (*formdto.LeadFormOverviewDTO, error)
	Update(ctx context.Context, lead *domain.LeadForm) error
	Delete(ctx context.Context, id uuid.UUID) error
	UpsertTx(ctx context.Context, tx *gorm.DB, form *domain.LeadForm) (*domain.LeadForm, error)
}

type postgresLeadFormRepository struct {
	db *gorm.DB
}

func NewPostgresLeadFormRepository(db *gorm.DB) LeadFormRepository {
	return &postgresLeadFormRepository{db: db}
}

func (r *postgresLeadFormRepository) CreateTx(ctx context.Context, tx *gorm.DB, form *domain.LeadForm) (*domain.LeadForm, error) {

	if err := tx.WithContext(ctx).Create(form).Error; err != nil {
		return nil, err
	}
	return form, nil
}

func (r *postgresLeadFormRepository) Create(ctx context.Context, form *domain.LeadForm) (*domain.LeadForm, error) {
	result := r.db.WithContext(ctx).Create(form)

	if result.Error != nil {
		return nil, result.Error
	}

	return form, nil
}

func (r *postgresLeadFormRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.LeadForm, error) {
	var Leadform domain.LeadForm

	if err := r.db.WithContext(ctx).First(&Leadform, "id = ?", id).Error; err != nil {

		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &Leadform, nil
}

// func (r *postgresLeadFormRepository) GetByVideoID(ctx context.Context, videoID uuid.UUID) (*domain.LeadForm, error) {
// 	var Leadform domain.LeadForm

// 	if err := r.db.Preload("Fields.Options").WithContext(ctx).First(&Leadform, "video_id = ?", videoID).Error; err != nil {

// 		if (errors.Is(err,gorm.ErrRecordNotFound)) {
// 			return nil ,nil
// 		}
// 		return nil, err
// 	}
// 	return &Leadform, nil
// }

func (r *postgresLeadFormRepository) GetByVideoID(ctx context.Context, videoID uuid.UUID) (*domain.LeadForm, error) {
	var leadForm domain.LeadForm

	err := r.db.WithContext(ctx).
		Preload("Fields", func(db *gorm.DB) *gorm.DB {
			return db.Order("position ASC")
		}).
		Preload("Fields.Options").
		First(&leadForm, "video_id = ?", videoID).
		Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &leadForm, nil
}

func (r *postgresLeadFormRepository) GetOverviewByWorkspaceID(ctx context.Context, workspaceID uuid.UUID, recentLimit int) (*formdto.LeadFormOverviewDTO, error) {
	var counts struct {
		TotalForms           int64 `gorm:"column:total_forms"`
		TotalSubmissions     int64 `gorm:"column:total_submissions"`
		CompletedSubmissions int64 `gorm:"column:completed_submissions"`
		SkippedSubmissions   int64 `gorm:"column:skipped_submissions"`
	}

	if err := r.db.WithContext(ctx).
		Table("lead_form AS f").
		Select(`
			COUNT(DISTINCT f.id) AS total_forms,
			COUNT(s.id) AS total_submissions,
			COUNT(s.id) FILTER (WHERE s.skipped = FALSE) AS completed_submissions,
			COUNT(s.id) FILTER (WHERE s.skipped = TRUE) AS skipped_submissions`,
		).
		Joins("LEFT JOIN lead_form_submission AS s ON s.form_id = f.id").
		Where("f.workspace_id = ?", workspaceID).
		Scan(&counts).Error; err != nil {
		return nil, err
	}

	conversionRate := float64(0)
	if counts.TotalSubmissions > 0 {
		conversionRate = math.Round((float64(counts.CompletedSubmissions)*100/float64(counts.TotalSubmissions))*10) / 10
	}

	if recentLimit <= 0 {
		recentLimit = 5
	}

	var recent []formdto.RecentLeadSubmissionDTO
	if err := r.db.WithContext(ctx).
		Table("lead_form_submission AS s").
		Select(`
			s.id,
			f.video_id,
			COALESCE(v.title, 'Unknown video') AS video_title,
			s.skipped,
			CASE
				WHEN s.skipped = TRUE OR primary_answer.value IS NULL THEN 'Skipped'
				ELSE primary_answer.value
			END AS lead_identifier,
			f.created_at`).
		Joins("JOIN lead_form AS f ON f.id = s.form_id").
		Joins("LEFT JOIN video AS v ON v.id = f.video_id").
		Joins(`LEFT JOIN LATERAL (
			SELECT NULLIF(BTRIM(a.value), '') AS value
			FROM lead_form_answer AS a
			JOIN lead_form_field AS field ON field.id = a.field_id
			WHERE a.submission_id = s.id
			  AND NULLIF(BTRIM(a.value), '') IS NOT NULL
			ORDER BY
				CASE
					WHEN field.label ILIKE '%email%' THEN 0
					WHEN field.label ILIKE '%name%' THEN 1
					WHEN field.label ILIKE '%phone%' THEN 2
					WHEN field.label ILIKE '%contact%' THEN 3
					ELSE 4
				END,
				field.position ASC,
				field.id ASC
			LIMIT 1
		) AS primary_answer ON TRUE`).
		Where("f.workspace_id = ?", workspaceID).
		Order("f.created_at DESC").
		Limit(recentLimit).
		Scan(&recent).Error; err != nil {
		return nil, err
	}

	if recent == nil {
		recent = []formdto.RecentLeadSubmissionDTO{}
	}

	return &formdto.LeadFormOverviewDTO{
		TotalForms:           counts.TotalForms,
		TotalSubmissions:     counts.TotalSubmissions,
		CompletedSubmissions: counts.CompletedSubmissions,
		SkippedSubmissions:   counts.SkippedSubmissions,
		ConversionRate:       conversionRate,
		RecentSubmissions:    recent,
	}, nil
}

func (r *postgresLeadFormRepository) Update(ctx context.Context, form *domain.LeadForm) error {
	return r.db.WithContext(ctx).Save(form).Error
}

func (r *postgresLeadFormRepository) Delete(ctx context.Context, id uuid.UUID) error {

	return r.db.WithContext(ctx).Delete(&domain.LeadForm{}, "id = ?", id).Error
}

func (r *postgresLeadFormRepository) UpsertTx(ctx context.Context, tx *gorm.DB, form *domain.LeadForm) (*domain.LeadForm, error) {
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {

		err := tx.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "video_id"}},
			DoUpdates: clause.AssignmentColumns([]string{"placement", "show_at", "allow_skip", "updated_at"}),
		}).Create(form).Error

		if err != nil {
			return err
		}

		if err := tx.Where("form_id = ?", form.ID).Delete(&domain.LeadFormField{}).Error; err != nil {
			return err
		}

		// 3. Re-save the incoming fields list along with their nested option slices.
		// Because we're passing the pre-populated child entities attached to the form struct,
		// GORM natively iterates down the tree arrays and writes them out cleanly.
		if len(form.Fields) > 0 {
			if err := tx.Create(&form.Fields).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return form, nil
}
