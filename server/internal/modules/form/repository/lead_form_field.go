package repository

import (
	"context"
	"errors"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	// "github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type LeadFormFieldRepository interface {
	CreateTx(ctx context.Context,tx *gorm.DB,field *domain.LeadFormField) (*domain.LeadFormField, error)
	Create(ctx context.Context, field *domain.LeadFormField) (*domain.LeadFormField,error) 
	GetByID(ctx context.Context, id uuid.UUID) (*domain.LeadFormField, error)
	Update(ctx context.Context, field *domain.LeadFormField) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type postgresLeadFormFieldRepository struct {
	db *gorm.DB
}

func NewPostgresLeadFormFieldRepository(db *gorm.DB) LeadFormFieldRepository {
	return &postgresLeadFormFieldRepository{db: db}
}

func (r *postgresLeadFormFieldRepository) CreateTx(ctx context.Context,tx *gorm.DB,field *domain.LeadFormField)(*domain.LeadFormField, error){

	if err := tx.WithContext(ctx).Create(field).Error; err != nil {
        return nil, err
    }
    return field, nil
}

func (r *postgresLeadFormFieldRepository) Create(ctx context.Context, field *domain.LeadFormField) (*domain.LeadFormField, error) {
	result := r.db.WithContext(ctx).Create(field)

	if result.Error != nil {
		return nil, result.Error
	}

	return field, nil
}

func (r *postgresLeadFormFieldRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.LeadFormField, error) {
	var formField domain.LeadFormField
	
	if err := r.db.WithContext(ctx).First(&formField, "id = ?", id).Error; err != nil {

		if (errors.Is(err,gorm.ErrRecordNotFound)) {
			return nil ,nil
		}
		return nil, err
	}
	return &formField, nil
}

func (r *postgresLeadFormFieldRepository) Update(ctx context.Context, field *domain.LeadFormField) error {
	return r.db.WithContext(ctx).Save(field).Error
}

func (r *postgresLeadFormFieldRepository) Delete(ctx context.Context, id uuid.UUID) error {
	
	return r.db.WithContext(ctx).Delete(&domain.LeadFormField{}, "id = ?", id).Error
}

