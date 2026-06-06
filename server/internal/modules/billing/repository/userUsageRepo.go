package repository

import (
	"context"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type UsageRepository interface {
	CreateTx (ctx context.Context,tx *gorm.DB,usage *domain.UserUsageCounters) (*domain.UserUsageCounters,error)
	UpsertTx(ctx context.Context, tx *gorm.DB, usage *domain.UserUsageCounters) (error)
	GetByUserID (ctx context.Context,userID uuid.UUID) (*domain.UserUsageCounters,error)
	Create (ctx context.Context,usage *domain.UserUsageCounters) (*domain.UserUsageCounters,error)
	Update (ctx context.Context,usage *domain.UserUsageCounters) (*domain.UserUsageCounters,error)
}


type postgresUsageRepository struct {
	db *gorm.DB
}

func NewPostgresUsageRepository(db *gorm.DB) UsageRepository {
	return &postgresUsageRepository{db: db}
}


func (r *postgresUsageRepository) CreateTx (ctx context.Context,tx *gorm.DB,usage *domain.UserUsageCounters) (*domain.UserUsageCounters,error) {

	if err := tx.WithContext(ctx).Create(usage).Error; err != nil {
		return nil, err
	}
	return usage, nil
}

func (r *postgresUsageRepository) UpsertTx(ctx context.Context, tx *gorm.DB, usage *domain.UserUsageCounters) (error) {
	err := tx.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "user_id"}}, 

			DoUpdates: clause.AssignmentColumns([]string{
				"id",
				"storage_bytes_used",
				"playback_minutes_used",
				"subtitle_generations_used",
				"reset_at",
				"updated_at",
			}),
		}).
		Create(usage).Error

	if err != nil {
		return err
	}
	

	return nil
}


func (r *postgresUsageRepository) GetByUserID (ctx context.Context,userID uuid.UUID) (*domain.UserUsageCounters,error) {

	var usage domain.UserUsageCounters

	err := r.db.WithContext(ctx).Where("user_id = ? ", userID).First(&usage).Error

	if err != nil {
		return nil, err
	}
	return &usage, nil
}

func (r *postgresUsageRepository) Create (ctx context.Context,usage *domain.UserUsageCounters) (*domain.UserUsageCounters,error) {

	result := r.db.WithContext(ctx).Create(usage)

	if result.Error != nil {
		return nil, result.Error
	}
	return usage, nil
}

func (r *postgresUsageRepository) Update (ctx context.Context,usage *domain.UserUsageCounters) (*domain.UserUsageCounters,error) {

	result := r.db.WithContext(ctx).Save(usage)

	if result.Error != nil {
		return nil, result.Error
	}
	return usage, nil
}