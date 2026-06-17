package repository

import (
	"context"
	"errors"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	// "github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type LeadFormRepository interface {
	CreateTx(ctx context.Context,tx *gorm.DB,form *domain.LeadForm) (*domain.LeadForm, error)
	Create(ctx context.Context, form *domain.LeadForm) (*domain.LeadForm,error) 
	GetByID(ctx context.Context, id uuid.UUID) (*domain.LeadForm, error)
	Update(ctx context.Context, lead *domain.LeadForm) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type postgresLeadFormRepository struct {
	db *gorm.DB
}

func NewPostgresLeadFormRepository(db *gorm.DB) LeadFormRepository {
	return &postgresLeadFormRepository{db: db}
}

func (r *postgresLeadFormRepository) CreateTx(ctx context.Context,tx *gorm.DB,form *domain.LeadForm)(*domain.LeadForm, error){

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

		if (errors.Is(err,gorm.ErrRecordNotFound)) {
			return nil ,nil
		}
		return nil, err
	}
	return &Leadform, nil
}

func (r *postgresLeadFormRepository) Update(ctx context.Context, form *domain.LeadForm) error {
	return r.db.WithContext(ctx).Save(form).Error
}

func (r *postgresLeadFormRepository) Delete(ctx context.Context, id uuid.UUID) error {
	
	return r.db.WithContext(ctx).Delete(&domain.LeadForm{}, "id = ?", id).Error
}

