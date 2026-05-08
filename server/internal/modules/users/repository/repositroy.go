package repository

import (
	"context"
	"errors"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRepository interface {
	
	CreateTx(ctx context.Context,tx *gorm.DB,user *domain.User) (*domain.User, error)
	Create(ctx context.Context, user *domain.User) (*domain.User,error) 
	GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error)
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
	Update(ctx context.Context, user *domain.User) error
	Delete(ctx context.Context, id uuid.UUID) error
}


type postgresUserRepository struct {
	db *gorm.DB
}

func NewPostgresUserRepository(db *gorm.DB) UserRepository {
	return &postgresUserRepository{db: db}
}

func (r *postgresUserRepository) CreateTx(ctx context.Context,tx *gorm.DB,user *domain.User)(*domain.User, error){

	if err := tx.WithContext(ctx).Create(user).Error; err != nil {
        return nil, err
    }
    return user, nil
}


func (r *postgresUserRepository) Create(ctx context.Context, user *domain.User) (*domain.User, error) {
	result := r.db.WithContext(ctx).Create(user)

	if result.Error != nil {
		return nil, result.Error
	}

	return user, nil
}
func (r *postgresUserRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	var user domain.User
	
	if err := r.db.WithContext(ctx).First(&user, "id = ?", id).Error; err != nil {

		if (errors.Is(err,gorm.ErrRecordNotFound)) {
			return nil ,nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *postgresUserRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	var user domain.User
	if err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil 
		}
		return nil, err
	}
	return &user, nil
}

func (r *postgresUserRepository) Update(ctx context.Context, user *domain.User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

func (r *postgresUserRepository) Delete(ctx context.Context, id uuid.UUID) error {
	
	return r.db.WithContext(ctx).Delete(&domain.User{}, "id = ?", id).Error
}