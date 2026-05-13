package repository

import (
	"context"
	"errors"
	"fmt"
	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type WorkshopRepository interface {
	
	CreateTx (ctx context.Context,tx *gorm.DB,workspace *domain.Workspaces) (*domain.Workspaces,error)
	Create (ctx context.Context,workspace *domain.Workspaces) (*domain.Workspaces,error)
	GetByID (ctx context.Context,ID uuid.UUID) (*domain.Workspaces,error)
	GetByUserID (ctx context.Context,userId uuid.UUID) ([]domain.Workspaces,error)
	GetDefaultWorkspace (ctx context.Context,userID uuid.UUID) (*domain.Workspaces,error)
	GetWorkspaceWithUserId (ctx context.Context,id uuid.UUID,userId uuid.UUID) (*domain.Workspaces,error)
}

type postgresWorkspaceRepository struct {
	db *gorm.DB
}

func NewPostgresWorkspaceRepository(db *gorm.DB) WorkshopRepository {
	return &postgresWorkspaceRepository{db: db}
}

func (r *postgresWorkspaceRepository) CreateTx (ctx context.Context,tx *gorm.DB,workspace *domain.Workspaces) (*domain.Workspaces,error) {

	if err := tx.WithContext(ctx).Create(workspace).Error; err != nil {
        return nil, err
    }
	
    return workspace, nil

}

func (r *postgresWorkspaceRepository) Create (ctx context.Context,workspace *domain.Workspaces) (*domain.Workspaces,error) {


	result:=r.db.WithContext(ctx).Create(workspace)

	if result.Error != nil {
        return nil, result.Error
    }

	return workspace, nil

}

func (r *postgresWorkspaceRepository) GetByID (ctx context.Context,ID uuid.UUID) (*domain.Workspaces,error) {

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

func (r *postgresWorkspaceRepository) GetByUserID (ctx context.Context, userId uuid.UUID) ([]domain.Workspaces, error) {
    var data []domain.Workspaces

    result := r.db.WithContext(ctx).
        Where("user_id = ?", userId).
        Order("created_at DESC").
        Find(&data)

    if result.Error != nil {
        return nil, result.Error
    }

    return data, nil
}

func (r *postgresWorkspaceRepository) GetDefaultWorkspace (ctx context.Context,userID uuid.UUID) (*domain.Workspaces,error){

	var workspace domain.Workspaces

	err:=r.db.WithContext(ctx).Where("is_default = ? AND user_id = ? ",true,userID).First(&workspace).Error

		if err!=nil{
		if errors.Is(err, gorm.ErrRecordNotFound){
			return  nil,fmt.Errorf("no workspace associated with this user ")
		}
		return  nil,err
	}

	return  &workspace,nil

}

func ( r *postgresWorkspaceRepository) GetWorkspaceWithUserId (ctx context.Context,id uuid.UUID,userId uuid.UUID) (*domain.Workspaces,error){
	var workspace domain.Workspaces
	fmt.Print(id,userId,"leah jaye")

	err:=r.db.WithContext(ctx).Where( " id = ? AND user_id = ?", id,userId ).First(&workspace).Error

	if err != nil {
		if (errors.Is(err, gorm.ErrRecordNotFound)){
			return nil,&utils.ApiError{404,"workspace is not found"}
		}
		return nil, err
	}

	return  &workspace,nil


}
