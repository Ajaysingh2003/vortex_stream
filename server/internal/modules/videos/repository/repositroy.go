package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)


type VideoRepository interface {
	Create(ctx context.Context, video *domain.Video)  (*domain.Video,error)
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Video, error)
	GetByUserID(ctx context.Context, userID uuid.UUID) ([]domain.Video, error)
	Update(ctx context.Context, video *domain.Video) error
	GetByIdAndUserId(ctx context.Context,Id uuid.UUID,userId uuid.UUID)(*domain.Video,error)
	AddResolution(ctx context.Context, res *domain.VideoResolution) error
	AddAllowedDomain(ctx context.Context, dom *domain.VideoDomain) error
	Delete(ctx context.Context, id uuid.UUID) error
	GetVideosPaginated(ctx context.Context, workspaceID uuid.UUID, userID uuid.UUID, cursorID **uuid.UUID, limit int) ([]domain.Video, error)
	GetByFolderIdPaginated(ctx context.Context,folderID *uuid.UUID , workspaceID uuid.UUID ,afterID string,remaining int) ([]domain.Video,error)

	CountByFolderID(ctx context.Context,folderID *uuid.UUID) (int64 , error)

}

type postgresVideoRepository struct {
	db *gorm.DB
}

func NewPostgresVideoRepository(db *gorm.DB) VideoRepository {
	return &postgresVideoRepository{db: db}
}

func (r *postgresVideoRepository) Create (ctx context.Context, video *domain.Video)  (*domain.Video,error) {
	result:= r.db.WithContext(ctx).Create(video)
		

	if result.Error != nil {
		return nil, result.Error
	}

	return video,nil
}

func (r *postgresVideoRepository) GetByID (ctx context.Context, id uuid.UUID) (*domain.Video, error) {
	var video domain.Video

	err := r.db.WithContext(ctx).
		Preload("Resolutions").
		Preload("AllowedDomains").
		First(&video, "id = ?", id).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &video, nil
}

func (r *postgresVideoRepository) GetByUserID (ctx context.Context, userID uuid.UUID) ([]domain.Video, error) {
	var videos []domain.Video
	err := r.db.Preload("Workspaces").WithContext(ctx).
		Where("workspaces.userId = ?", userID).
		Order("created_at DESC").
		Find(&videos).Error
	return videos, err
}
func (r *postgresVideoRepository) Update(ctx context.Context, video *domain.Video) error {
	// 1. Initialize map with universal fields that should always change on update
	updateData := map[string]interface{}{
		"updated_at": time.Now(),
	}

	// 2. Only add fields to the map if they have non-zero values 
	if video.Status != "" {
		updateData["status"] = video.Status
	}
	if video.Title != "" {
		updateData["title"] = video.Title
	}
	if video.Thumbnail != "" {
		updateData["thumbnail"] = video.Thumbnail
	}

	// 3. For foreign keys/pointers, handle nil vs zero values explicitly
	// If it's a pointer to a UUID, this checks if it's explicitly set
	if video.FolderID != nil {
		updateData["folder_id"] = video.FolderID
	}

	// 4. If nothing changed besides updated_at, skip hitting the DB entirely
	if len(updateData) <= 1 {
		return nil
	}

	// 5. Fire the update query safely
	return r.db.WithContext(ctx).
		Model(&domain.Video{}).
		Where("id = ? AND workspace_id = ?", video.ID, video.WorkspaceID).
		Updates(updateData).Error
}

func (r *postgresVideoRepository) AddResolution (ctx context.Context, res *domain.VideoResolution) error {
	return r.db.WithContext(ctx).Create(res).Error
}

func (r *postgresVideoRepository) AddAllowedDomain (ctx context.Context, dom *domain.VideoDomain) error {
	return r.db.WithContext(ctx).Create(dom).Error
}

func (r *postgresVideoRepository) Delete (ctx context.Context, id uuid.UUID) error {
	// This will trigger the CASCADE delete in DB for Resolutions and Domains
	return r.db.WithContext(ctx).Delete(&domain.Video{}, "id = ?", id).Error
}


// func (r *postgresVideoRepository) GetByIdAndUserId (ctx context.Context,id uuid.UUID,userId uuid.UUID) (*domain.Video,error) {
// 	var video domain.Video

// 	err:=r.db.WithContext(ctx).Preload("Workspaces").Where("id = ? AND workspaces.user_id = ?",id,userId).First(&video).Error

// 	if err!=nil {
// 		if errors.Is(err, gorm.ErrRecordNotFound) {
// 			return nil, nil
// 		}
// 		return  nil,err
// 	}

// 	return  &video,nil

// }

func (r *postgresVideoRepository) GetByIdAndUserId(ctx context.Context, id uuid.UUID, userId uuid.UUID) (*domain.Video, error) {
    var video domain.Video

    err := r.db.WithContext(ctx).
        Model(&domain.Video{}).
        Joins("Workspace").
        Where("video.id = ? AND \"Workspace\".user_id = ?", id, userId).
        First(&video).Error

    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, nil
        }
        return nil, err
    }

    return &video, nil
}

// func (r *postgresVideoRepository) GetByFolderIdPaginated (ctx context.Context,folderID *uuid.UUID,afterID *uuid.UUID,remaining int) ([]domain.Video,error) {

// 	query:=r.db.WithContext(ctx).Where("folder_id = ?",folderID).Order("created_at ASC , id ASC").Limit(remaining)

// 	if afterID !=nil{

// 		var cursorVideo domain.Video

// 		err:=r.db.WithContext(ctx).Select("created_at","id").First(&cursorVideo,"id = ?",*afterID).Error

// 		if err != nil {
// 			return nil, err
// 		}

// 		query=query.Where("(created_at , id::text) > (? , ?)",cursorVideo.CreatedAt,cursorVideo.ID)


// 	}

// 	var videos []domain.Video

// 	if err:=query.Find(&videos).Error ; err!=nil{
// 		return nil,err
// 	}

// 	return videos,nil
// }

func (r *postgresVideoRepository) GetByFolderIdPaginated(ctx context.Context, folderID *uuid.UUID, workspaceID uuid.UUID, afterID string, remaining int) ([]domain.Video, error) {
   
    query := r.db.WithContext(ctx).Model(&domain.Video{}).Where("workspace_id",workspaceID)

    if folderID != nil {
        query = query.Where("folder_id = ?", folderID)
    } else {
        query = query.Where("folder_id IS NULL")
    }

    query = query.Order("created_at ASC, id ASC").Limit(remaining)

    if afterID != "" {
        var cursorVideo domain.Video

        err := r.db.WithContext(ctx).
            Select("created_at", "id").
            First(&cursorVideo, "id = ?", afterID).Error
        if err != nil {
            return nil, fmt.Errorf("failed to locate pagination cursor anchor element: %w", err)
        }

        // This avoids forcing PostgreSQL to cast type values to text strings on millions of rows
        query = query.Where("(created_at, id) > (?, ?)", cursorVideo.CreatedAt, cursorVideo.ID)
    }

    // 4. Execute the database retrieval using our pointer reference
    var videos []domain.Video
    if err := query.Find(&videos).Error; err != nil {
        return nil, fmt.Errorf("error querying paginated videos table map: %w", err)
    }

	return videos, nil
}


func (r *postgresVideoRepository) CountByFolderID(ctx context.Context, folderID *uuid.UUID) (int64, error) {
    var count int64

    query := r.db.WithContext(ctx).Model(&domain.Video{})

    if folderID == nil {
        query = query.Where("folder_id IS NULL")
    } else {
        query = query.Where("folder_id = ?", folderID)
    }

    // 3. Execute the database payload calculation
    err := query.Count(&count).Error
    if err != nil {
        return 0, err
    }

    return count, nil
}





func (r *postgresVideoRepository) GetVideosPaginated(ctx context.Context, workspaceID uuid.UUID, userID uuid.UUID, cursorID **uuid.UUID, limit int) ([]domain.Video, error) {
    var videos []domain.Video
    
    // Set a default safety limit if not provided
    if limit <= 0 {
        limit = 10 
    }

    query := r.db.WithContext(ctx).
        Where("workspace_id = ?", workspaceID).
        Order("created_at DESC, id DESC"). 
        Limit(limit)

    // Apply cursor condition if it exists
    if cursorID != nil {
        // Assuming descending order pagination (newest videos first)
        query = query.Where("id < ?", cursorID) 
    }

    if err := query.Find(&videos).Error; err != nil {
        return nil, err
    }

    return videos, nil
}