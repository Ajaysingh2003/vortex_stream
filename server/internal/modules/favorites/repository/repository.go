package repository

import (
	"context"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	videoDto "github.com/ajaysingh2003/vortex-stream/internal/modules/videos/dto"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type FavoriteRepository interface {
	AddVideo(ctx context.Context, favorite *domain.FavoriteVideo) error
	RemoveVideo(ctx context.Context, userID, videoID uuid.UUID) error
	IsVideoFavorite(ctx context.Context, userID, videoID uuid.UUID) (bool, error)
	ListVideos(ctx context.Context, userID uuid.UUID) ([]domain.FavoriteVideo, error)
	ListVideosPaginated(ctx context.Context, userID, workspaceID uuid.UUID, cursorID **uuid.UUID, limit int, filters *videoDto.FilterOptions) ([]domain.Video, error)
}

type postgresRepository struct{ db *gorm.DB }

func NewPostgresRepository(db *gorm.DB) FavoriteRepository { return &postgresRepository{db: db} }

func (r *postgresRepository) AddVideo(ctx context.Context, favorite *domain.FavoriteVideo) error {
	return r.db.WithContext(ctx).Table("favorite_videos").Clauses(clause.OnConflict{DoNothing: true}).Create(favorite).Error
}
func (r *postgresRepository) RemoveVideo(ctx context.Context, userID, videoID uuid.UUID) error {
	return r.db.WithContext(ctx).Table("favorite_videos").Where("user_id = ? AND video_id = ?", userID, videoID).Delete(&domain.FavoriteVideo{}).Error
}
func (r *postgresRepository) IsVideoFavorite(ctx context.Context, userID, videoID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Table("favorite_videos").Where("user_id = ? AND video_id = ?", userID, videoID).Count(&count).Error
	return count > 0, err
}
func (r *postgresRepository) ListVideos(ctx context.Context, userID uuid.UUID) ([]domain.FavoriteVideo, error) {
	var favorites []domain.FavoriteVideo
	err := r.db.WithContext(ctx).Table("favorite_videos").Where("user_id = ?", userID).Order("created_at DESC").Find(&favorites).Error
	return favorites, err
}

func (r *postgresRepository) ListVideosPaginated(ctx context.Context, userID, workspaceID uuid.UUID, cursorID **uuid.UUID, limit int, filters *videoDto.FilterOptions) ([]domain.Video, error) {
	if limit <= 0 {
		limit = 10
	}
	query := r.db.WithContext(ctx).
		Table("video").
		Joins("JOIN favorite_videos ON favorite_videos.video_id = video.id AND favorite_videos.user_id = ?", userID).
		Where("video.workspace_id = ?", workspaceID)

	if filters != nil {
		if filters.Visibility != nil {
			switch *filters.Visibility {
			case "public":
				query = query.Where("videos.is_private = ?", false)
			case "private":
				query = query.Where("videos.is_private = ?", true)
			}
		}
		if filters.Date != nil {
			switch *filters.Date {
			case "today":
				query = query.Where("videos.created_at >= NOW() - INTERVAL '24 hours'")
			case "this_week", "7_day":
				query = query.Where("videos.created_at >= NOW() - INTERVAL '7 days'")
			case "30_days":
				query = query.Where("videos.created_at >= NOW() - INTERVAL '30 days'")
			case "this_month":
				query = query.Where("videos.created_at >= date_trunc('month', CURRENT_DATE)")
			}
		}
	}

	ascending := filters != nil && filters.Sort != nil && (*filters.Sort == "asc" || *filters.Sort == "oldest" || *filters.Sort == "created_asc")
	if cursorID != nil && *cursorID != nil {
		if ascending {
			query = query.Where("videos.id > ?", **cursorID)
		} else {
			query = query.Where("videos.id < ?", **cursorID)
		}
	}
	if filters != nil && filters.Sort != nil {
		switch *filters.Sort {
		case "asc", "oldest", "created_asc":
			query = query.Order("videos.created_at ASC, videos.id ASC")
		case "name_asc":
			query = query.Order("videos.title ASC, videos.id ASC")
		case "name_desc":
			query = query.Order("videos.title DESC, videos.id DESC")
		default:
			query = query.Order("videos.created_at DESC, videos.id DESC")
		}
	} else {
		query = query.Order("videos.created_at DESC, videos.id DESC")
	}

	var videos []domain.Video
	if err := query.Limit(limit).Find(&videos).Error; err != nil {
		return nil, err
	}
	return videos, nil
}
