package repository

import (
	"context"
	"errors"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"gorm.io/gorm"
)

type AccountRepository interface {
	Create (tx *gorm.DB, account *domain.Account) error
	FindByProviderAndID (provider string, providerID string) (*domain.Account, error)
	FindByUserAndProvider (userID, provider string) (*domain.Account, error)
	DeleteByUserAndProvider (tx *gorm.DB, userID, provider string) error
	CreateTx (ctx context.Context,tx *gorm.DB,account *domain.Account) (*domain.Account,error)
}

type accountRepo struct {
	db *gorm.DB
}

func NewAccountRepo(db *gorm.DB) AccountRepository {
	return &accountRepo{db: db}
}

func (r *accountRepo) Create (tx *gorm.DB, account *domain.Account) error {
	if tx == nil {
		tx = r.db
	}
	return tx.Create(account).Error
}

func (r *accountRepo) FindByProviderAndID (provider string, providerID string) (*domain.Account, error) {
	var acc domain.Account
	err := r.db.
		Where("provider = ? AND provider_id = ?", provider, providerID).
		First(&acc).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	
	return &acc, err
}


func (r *accountRepo) FindByUserAndProvider (userID, provider string) (*domain.Account, error) {
	var acc domain.Account
	err := r.db.
		Where("user_id = ? AND provider = ?", userID, provider).
		First(&acc).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &acc, err
}

func (r *accountRepo) DeleteByUserAndProvider (
	tx *gorm.DB,
	userID string,
	provider string,
) error {
	if tx == nil {
		tx = r.db
	}

	return tx.
		Where("user_id = ? AND provider = ?", userID, provider).
		Delete(&domain.Account{}).
		Error
}


func (r *accountRepo) CreateTx (ctx context.Context,tx *gorm.DB,account *domain.Account) (*domain.Account,error) {

	if err := tx.WithContext(ctx).Create(account).Error; err != nil {
        return nil, err
    }
	
	
    return account, nil

}
