package service

import (
	"context"
	"fmt"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	favoriteRepo "github.com/ajaysingh2003/vortex-stream/internal/modules/favorites/repository"
	videoDto "github.com/ajaysingh2003/vortex-stream/internal/modules/videos/dto"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Service struct {
	db   *gorm.DB
	repo favoriteRepo.FavoriteRepository
}

func New(db *gorm.DB, repo favoriteRepo.FavoriteRepository) *Service {
	return &Service{db: db, repo: repo}
}

func (s *Service) authorizeVideo(ctx context.Context, userID, videoID uuid.UUID) error {
	var video domain.Video
	// A favorite belongs to the authenticated user. It must not require the
	// user to own the video's workspace; otherwise public/shared videos cannot
	// be favorited. The route itself is protected by AuthMiddleware.
	err := s.db.WithContext(ctx).Where("id = ?", videoID).First(&video).Error

	if err == gorm.ErrRecordNotFound {
		return fmt.Errorf("video not found")
	}
	return err
}

func (s *Service) authorizeWorkspace(ctx context.Context, userID, workspaceID uuid.UUID) error {
	var workspace domain.Workspaces
	err := s.db.WithContext(ctx).
		Table("workspaces").
		Where("id = ? AND user_id = ?", workspaceID, userID).
		First(&workspace).Error
	if err == gorm.ErrRecordNotFound {
		return &utils.ApiError{Code: 404, Message: "Workspace not found"}
	}
	return err
}

func (s *Service) AddVideo(ctx context.Context, userID, videoID uuid.UUID) error {
	if err := s.authorizeVideo(ctx, userID, videoID); err != nil {
		return err
	}
	return s.repo.AddVideo(ctx, &domain.FavoriteVideo{ID: uuid.New(), UserID: userID, VideoID: videoID})
}
func (s *Service) RemoveVideo(ctx context.Context, userID, videoID uuid.UUID) error {
	if err := s.authorizeVideo(ctx, userID, videoID); err != nil {
		return err
	}
	return s.repo.RemoveVideo(ctx, userID, videoID)
}
func (s *Service) VideoStatus(ctx context.Context, userID, videoID uuid.UUID) (bool, error) {
	if err := s.authorizeVideo(ctx, userID, videoID); err != nil {
		return false, err
	}
	return s.repo.IsVideoFavorite(ctx, userID, videoID)
}
func (s *Service) ListVideos(ctx context.Context, userID uuid.UUID) ([]domain.FavoriteVideo, error) {
	return s.repo.ListVideos(ctx, userID)
}

func (s *Service) ListVideosPaginated(ctx context.Context, userID, workspaceID uuid.UUID, cursor string, limit int, filters *videoDto.FilterOptions) (*videoDto.VideoContentsDTO, error) {
	if err := s.authorizeWorkspace(ctx, userID, workspaceID); err != nil {
		return nil, err
	}
	var cursorID **uuid.UUID
	if cursor != "" {
		_, decodedID, err := utils.DecodeCursor(cursor)
		if err != nil || decodedID == nil {
			return nil, &utils.ApiError{Code: 400, Message: "Invalid cursor format"}
		}
		cursorID = &decodedID
	}
	videos, err := s.repo.ListVideosPaginated(ctx, userID, workspaceID, cursorID, limit+1, filters)
	if err != nil {
		return nil, err
	}
	hasNext := len(videos) > limit
	if hasNext {
		videos = videos[:limit]
	}
	nextCursor := ""
	if hasNext && len(videos) > 0 {
		nextCursor = utils.EncodeCursor("favorite_video", videos[len(videos)-1].ID)
	}
	return &videoDto.VideoContentsDTO{Items: videos, Metadata: videoDto.Metadata{HasNextPage: hasNext, NextCursor: nextCursor, Total: len(videos)}}, nil
}
