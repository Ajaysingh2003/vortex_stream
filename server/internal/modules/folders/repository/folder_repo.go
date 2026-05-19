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

	CountChildren (ctx context.Context,parentID uuid.UUID) (int64 , error)

	CheckDuplicateName (ctx context.Context,name string,parentID *uuid.UUID,workspaceID uuid.UUID) (bool , error)
	GetAncestors (ctx context.Context,folderID uuid.UUID) ([]domain.Folder, error)
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
func (r *postgresFolderRepository) CheckDuplicateName(ctx context.Context, name string, parentID *uuid.UUID, workspaceID uuid.UUID) (bool, error) {
    var exists bool

    // 1. Explicitly target the "folders" table so GORM builds the query correctly
    query := r.db.WithContext(ctx).
        Table("folder").
        Select("1").
        Where("name = ? AND workspace_id = ?", name, workspaceID)

    // 2. FIXED: Inverted logic check
    if parentID == nil {
        // If parentID is nil, we are checking the root level
        query = query.Where("parent_id IS NULL")
    } else {
        // If parentID is not nil, it is safe to dereference it for a sub-folder check
        query = query.Where("parent_id = ?", *parentID)
    }

    err := query.Limit(1).Scan(&exists).Error
    if err != nil {
        return false, err
    }

    return exists, nil
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

	fmt.Print(parentID,"parentIDTest")
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


func (r *postgresFolderRepository) GetAncestors(ctx context.Context, folderID uuid.UUID) ([]domain.Folder, error) {
    var ancestors []domain.Folder

    // Recursive Common Table Expression (CTE) to climb UP the folder tree
    query := `
        WITH RECURSIVE folder_tree AS (
            SELECT id, workspace_id, parent_id, position, name, created_at, updated_at
            FROM folder
            WHERE id = ?
            
            UNION ALL
            
            SELECT f.id, f.workspace_id, f.parent_id, f.position, f.name, f.created_at, f.updated_at
            FROM folder f
            INNER JOIN folder_tree ft ON f.id = ft.parent_id
        )
        SELECT * FROM folder_tree;
    `

    err := r.db.WithContext(ctx).Raw(query, folderID).Scan(&ancestors).Error
    if err != nil {
        return nil, err
    }

	// Reverse the slice so it reads from Root -> Subfolder instead of Current -> Root
	for i, j := 0, len(ancestors)-1; i < j; i, j = i+1, j-1 {
		ancestors[i], ancestors[j] = ancestors[j], ancestors[i]
	}

    return ancestors, nil
}