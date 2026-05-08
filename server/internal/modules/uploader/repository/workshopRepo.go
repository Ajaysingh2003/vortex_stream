package repository

import (
	"context"
	"errors"
	"fmt"
	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type WorkshopRepository interface {
	
	CreateTx (ctx context.Context,tx *gorm.DB,workspace *domain.Workspaces) (*domain.Workspaces,error)
	Create (ctx context.Context,workspace *domain.Workspaces) (*domain.Workspaces,error)
	GetByID (ctx context.Context,ID uuid.UUID) (*domain.Workspaces,error)

}

type postgresWorkspaceRepository struct {
	db *gorm.DB
}

func NewPostgresWorkspaceRepository(db *gorm.DB) WorkshopRepository {
	return &postgresWorkspaceRepository{db: db}
}

func (r *postgresWorkspaceRepository) CreateTx(ctx context.Context,tx *gorm.DB,workspace *domain.Workspaces) (*domain.Workspaces,error) {

	if err := tx.WithContext(ctx).Create(workspace).Error; err != nil {
        return nil, err
    }
	
    return workspace, nil

}

func (r *postgresWorkspaceRepository) Create(ctx context.Context,workspace *domain.Workspaces) (*domain.Workspaces,error) {


	result:=r.db.WithContext(ctx).Create(workspace)

	if result.Error != nil {
        return nil, result.Error
    }

	return workspace, nil

}


func (r *postgresWorkspaceRepository) GetByID(ctx context.Context,ID uuid.UUID) (*domain.Workspaces,error) {

	var space domain.Workspaces

	err:=r.db.WithContext(ctx).Where("id = ? ",ID).First(&space).Error

	if err!=nil{
		if errors.Is(err, gorm.ErrRecordNotFound){
			return  nil,fmt.Errorf("record not found")
		}
		return  nil,err
	}

	return &space,nil

}
