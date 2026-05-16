package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	// "github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type FolderRepository interface {

	Create(ctx context.Context, folder *domain.Folder) (*domain.Folder, error)

	GetByID(ctx context.Context, id uuid.UUID) (*domain.Folder, error)

	GetRootFolders(ctx context.Context, workspaceID uuid.UUID) ([]domain.Folder, error)

	GetChildren(ctx context.Context, parentID uuid.UUID) ([]domain.Folder, error)

	GetChildrenPaginated(ctx  context.Context,
    parentID uuid.UUID,
    workspaceID uuid.UUID,
    afterID  *uuid.UUID,
    limit    int) ([]domain.Folder,error)

	GetWithVideos(ctx context.Context, id uuid.UUID) (*domain.Folder, error)

	Update(ctx context.Context, folder *domain.Folder) (*domain.Folder, error)

	Delete(ctx context.Context, id uuid.UUID) error

	Move(ctx context.Context, id uuid.UUID, newParentID *uuid.UUID) error

	UpdatePosition(ctx context.Context, id uuid.UUID, position int) error

	CountChildren(ctx context.Context,parentID uuid.UUID) (int64 , error)

	// ExistsByNameAndParent(ctx context.Context, name string, workspaceID uuid.UUID, parentID *uuid.UUID) (bool, error)

}


type postgresFolderRepository struct {
	db *gorm.DB
}


func NewFolderRepo(db *gorm.DB) FolderRepository {
	return &postgresFolderRepository{db: db}
}

func (r *postgresFolderRepository) Create (ctx context.Context,folder *domain.Folder) (*domain.Folder,error){

	if err:=r.db.WithContext(ctx).Create(folder).Error; err != nil{
		return nil, err
	}

	return folder,nil
}


func (r *postgresFolderRepository)  GetByID (ctx context.Context,id uuid.UUID) (*domain.Folder,error) {
	var folder domain.Folder

	err:=r.db.WithContext(ctx).Where("id = ? ", id).First(&folder).Error

	if err != nil {
		return nil, err
	}

	return  &folder,nil
}

func (r *postgresFolderRepository)  GetRootFolders (ctx context.Context,workspaceID uuid.UUID) ([]domain.Folder,error) {
	var folder []domain.Folder

	err:=r.db.WithContext(ctx).Where("workspace_id = ? AND parent_id IS NULL ", workspaceID).Order("position ASC, created_at ASC").Find(&folder).Error
	
	if err != nil {
		return nil, err
	}

	return  folder,nil
}

func (r *postgresFolderRepository) GetChildren (ctx context.Context, parentID uuid.UUID) ([]domain.Folder, error) {
	var folders []domain.Folder
	err := r.db.WithContext(ctx).
		Where("parent_id = ?", parentID).
		Order("position ASC, created_at ASC").
		Find(&folders).Error

	if err != nil {
		return nil, err
	}
	return folders, nil
}

func (r *postgresFolderRepository) GetWithVideos(ctx context.Context, id uuid.UUID) (*domain.Folder, error) {
	var folder domain.Folder
	err := r.db.WithContext(ctx).
		Preload("Videos").
		Preload("Children").
		Where("id = ?", id).
		First(&folder).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &folder, nil
}

func (r *postgresFolderRepository) Update(ctx context.Context, folder *domain.Folder) (*domain.Folder, error) {
	err := r.db.WithContext(ctx).
		Model(&domain.Folder{}).
		Where("id = ?", folder.ID).
		Updates(map[string]interface{}{
			"name":     folder.Name,
			"position": folder.Position,
		}).Error

	if err != nil {
		return nil, err
	}
	return folder, nil
}

func (r *postgresFolderRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).
		Where("id = ?", id).
		Delete(&domain.Folder{}).Error
}

func (r *postgresFolderRepository) Move(ctx context.Context, id uuid.UUID, newParentID *uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&domain.Folder{}).
		Where("id = ?", id).
		Update("parent_id", newParentID).Error
}

func (r *postgresFolderRepository) UpdatePosition(ctx context.Context, id uuid.UUID, position int) error {
	return r.db.WithContext(ctx).
		Model(&domain.Folder{}).
		Where("id = ?", id).
		Update("position", position).Error
}

func (r *postgresFolderRepository) GetChildrenPaginated(
    ctx      context.Context,
    parentID uuid.UUID,
    workspaceID uuid.UUID,
    afterID  *uuid.UUID,
    limit    int,
) ([]domain.Folder, error) {

    query := r.db.WithContext(ctx).
        Where("parent_id = ? AND workspace_id = ?", parentID, workspaceID).
        Order("position ASC, created_at ASC").
        Limit(limit)

    if afterID != nil {
        var cursorFolder domain.Folder
        err := r.db.WithContext(ctx).
            Select("position", "created_at").
            First(&cursorFolder, "id = ?", *afterID).Error
        if err != nil {
            return nil, fmt.Errorf("invalid cursor: %w", err)
        }

        query = query.Where(
            "(position, created_at) > (?, ?)",
            cursorFolder.Position,
            cursorFolder.CreatedAt,
        )
    }

    var folders []domain.Folder
    if err := query.Find(&folders).Error; err != nil {
        return nil, fmt.Errorf("failed to fetch folders: %w", err)
    }
    return folders, nil
}

func (r *postgresFolderRepository) CountChildren(ctx context.Context,parentID uuid.UUID) (int64 ,error) {
	var count int64

	err := r.db.WithContext(ctx).
        Model(&domain.Folder{}).
        Where("parent_id = ?", parentID).
        Count(&count).Error

		if err != nil {
        return 0, fmt.Errorf("failed to count children: %w", err)
    }

	return count, nil

}
