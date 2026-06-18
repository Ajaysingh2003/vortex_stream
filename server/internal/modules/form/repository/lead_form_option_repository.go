package repository

import (
	"context"
	"errors"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type LeadFormOptionRepository interface {
	CreateTx(ctx context.Context,tx *gorm.DB,option []*domain.LeadFormFieldOption) ([]*domain.LeadFormFieldOption, error)
	UpsertTx(ctx context.Context,tx *gorm.DB,option []*domain.LeadFormFieldOption) ([]*domain.LeadFormFieldOption, error)
	Create(ctx context.Context, option *domain.LeadFormFieldOption) (*domain.LeadFormFieldOption,error) 
	GetByID(ctx context.Context, id uuid.UUID) (*domain.LeadFormFieldOption, error)
	Update(ctx context.Context, lead *domain.LeadFormFieldOption) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type postgresLeadFormOptionRepository struct {
	db *gorm.DB
}

func NewPostgresLeadFormOptionRepository(db *gorm.DB) LeadFormOptionRepository {
	return &postgresLeadFormOptionRepository{db: db}
}

func (r *postgresLeadFormOptionRepository) UpsertTx(ctx context.Context, tx *gorm.DB, options []*domain.LeadFormFieldOption) ([]*domain.LeadFormFieldOption, error) {
	if len(options) == 0 {
		return options, nil
	}

	err := tx.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoUpdates: clause.AssignmentColumns([]string{"label"}),
	}).Create(&options).Error

	if err != nil {
		return nil, err
	}

	return options, nil
}

func (r *postgresLeadFormOptionRepository) CreateTx(ctx context.Context,tx *gorm.DB,option []*domain.LeadFormFieldOption)([]*domain.LeadFormFieldOption, error){

	if err := tx.WithContext(ctx).Create(option).Error; err != nil {
        return nil, err
    }
    return option, nil
}

func (r *postgresLeadFormOptionRepository) Create(ctx context.Context, option *domain.LeadFormFieldOption) (*domain.LeadFormFieldOption, error) {
	result := r.db.WithContext(ctx).Create(option)

	if result.Error != nil {
		return nil, result.Error
	}

	return option, nil
}

func (r *postgresLeadFormOptionRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.LeadFormFieldOption, error) {
	var fieldOption domain.LeadFormFieldOption
	
	if err := r.db.WithContext(ctx).First(&fieldOption, "id = ?", id).Error; err != nil {

		if (errors.Is(err,gorm.ErrRecordNotFound)) {
			return nil ,nil
		}
		return nil, err
	}
	return &fieldOption, nil
}

func (r *postgresLeadFormOptionRepository) Update(ctx context.Context, option *domain.LeadFormFieldOption) error {
	return r.db.WithContext(ctx).Save(option).Error
}

func (r *postgresLeadFormOptionRepository) Delete(ctx context.Context, id uuid.UUID) error {
	
	return r.db.WithContext(ctx).Delete(&domain.LeadFormFieldOption{}, "id = ?", id).Error
}

