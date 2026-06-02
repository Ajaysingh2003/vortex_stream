package repository

import (
	"context"
	"gorm.io/gorm/clause"
	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"gorm.io/gorm"
)

type SubscriptionRepository interface {
	CreateTx(ctx context.Context, tx *gorm.DB, subscription *domain.Subscription) (*domain.Subscription, error)
	UpsertTx(ctx context.Context, tx *gorm.DB, subscription *domain.Subscription) (*domain.Subscription, error)
	
	Create(ctx context.Context, subscription *domain.Subscription) (*domain.Subscription, error)
	Update(ctx context.Context, subscription *domain.Subscription) (*domain.Subscription, error)
	GetByID(ctx context.Context, ID string) (*domain.Subscription, error)
	GetByUserID(ctx context.Context, userID string) (*domain.Subscription, error)
}

type postgresSubscriptionRepository struct {
	db *gorm.DB
}

func NewPostgresSubscriptionRepository(db *gorm.DB) SubscriptionRepository {
	return &postgresSubscriptionRepository{db: db}
}

func (r *postgresSubscriptionRepository) CreateTx(ctx context.Context, tx *gorm.DB, subscription *domain.Subscription) (*domain.Subscription, error) {

	if err := tx.WithContext(ctx).Create(subscription).Error; err != nil {
		return nil, err
	}
	return subscription, nil
}
func (r *postgresSubscriptionRepository) UpsertTx(ctx context.Context, tx *gorm.DB, subscription *domain.Subscription) (*domain.Subscription, error) {
	err := tx.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "user_id"}}, 

			DoUpdates: clause.AssignmentColumns([]string{
				"stripe_subscription_id",
				"stripe_price_id",
				"plan",
				"status",
				"period_start",
				"period_end",
				"updated_at",
			}),
		}).
		Create(subscription).Error

	if err != nil {
		return nil, err
	}
	

	return subscription, nil
}

func (r *postgresSubscriptionRepository) Create(ctx context.Context, subscription *domain.Subscription) (*domain.Subscription, error) {

	result := r.db.WithContext(ctx).Create(subscription)

	if result.Error != nil {
		return nil, result.Error
	}
	return subscription, nil
}

func (r *postgresSubscriptionRepository) Update(ctx context.Context, subscription *domain.Subscription) (*domain.Subscription, error) {

	result := r.db.WithContext(ctx).Save(subscription)

	if result.Error != nil {
		return nil, result.Error
	}
	return subscription, nil
}

func (r *postgresSubscriptionRepository) GetByID(ctx context.Context, ID string) (*domain.Subscription, error) {

	var subscription domain.Subscription

	err := r.db.WithContext(ctx).Where("id = ? ", ID).First(&subscription).Error

	if err != nil {
		return nil, err
	}
	return &subscription, nil
}

func (r *postgresSubscriptionRepository) GetByUserID(ctx context.Context, userID string) (*domain.Subscription, error) {

	var subscription domain.Subscription

	err := r.db.WithContext(ctx).Where("user_id = ? ", userID).First(&subscription).Error

	if err != nil {
		return nil, err
	}
	return &subscription, nil
}
