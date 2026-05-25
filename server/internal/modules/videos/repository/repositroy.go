package repository

import (
	"context"
	"errors"
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
	GetByFolderIdPaginated(ctx context.Context,folderID *uuid.UUID , afterID *uuid.UUID,remaining int) ([]domain.Video,error)

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

func (r *postgresVideoRepository) Update (ctx context.Context, video *domain.Video) error {
	
	return r.db.WithContext(ctx).
        Model(&domain.Video{}).Joins("JOIN workspaces on workspaces.id =video.workspaces.id ").
        Where("video.id = ? AND video.workspaces.userId", video.ID, video.Workspace.UserID).
        Updates(map[string]interface{}{
            "status":    video.Status,
			"title":      video.Title,
            "updated_at": time.Now(),
        }).Error
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


func (r *postgresVideoRepository) GetByIdAndUserId (ctx context.Context,id uuid.UUID,userId uuid.UUID) (*domain.Video,error) {
	var video domain.Video

	err:=r.db.WithContext(ctx).Preload("Workspaces").Where("id = ? AND workspaces.user_id = ?",id,userId).First(&video).Error

	if err!=nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return  nil,err
	}

	return  &video,nil

}

func (r *postgresVideoRepository) GetByFolderIdPaginated (ctx context.Context,folderID *uuid.UUID,afterID *uuid.UUID,remaining int) ([]domain.Video,error) {

	query:=r.db.WithContext(ctx).Where("folder_id = ?",folderID).Order("created_at ASC , id ASC").Limit(remaining)

	if afterID !=nil{

		var cursorVideo domain.Video

		err:=r.db.WithContext(ctx).Select("created_at","id").First(&cursorVideo,"id = ?",*afterID).Error

		if err != nil {
			return nil, err
		}

		query=query.Where("(created_at , id::text) > (? , ?)",cursorVideo.CreatedAt,cursorVideo.ID)


	}

	var videos []domain.Video

	if err:=query.Find(&videos).Error ; err!=nil{
		return nil,err
	}

	return videos,nil
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