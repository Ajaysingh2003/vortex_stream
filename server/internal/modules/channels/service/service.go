package service

import (
	"context"
	"errors"
	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	channelRepo "github.com/ajaysingh2003/vortex-stream/internal/modules/channels/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Service struct {
	db   *gorm.DB
	repo channelRepo.Repository
}

func New(db *gorm.DB, repo channelRepo.Repository) *Service { return &Service{db: db, repo: repo} }
func (s *Service) Create(ctx context.Context, userID, workspaceID uuid.UUID, name string) (*domain.Channel, error) {
	var count int64
	if err := s.db.WithContext(ctx).Table("workspace").Where("id = ? AND user_id = ?", workspaceID, userID).Count(&count).Error; err != nil {
		return nil, err
	}
	if count == 0 {
		return nil, errors.New("workspace not found")
	}
	channel := &domain.Channel{ID: uuid.New(), WorkspaceID: workspaceID, Name: name}
	return channel, s.repo.Create(ctx, channel)
}
func (s *Service) List(ctx context.Context, userID uuid.UUID) ([]domain.Channel, error) {
	return s.repo.ListByUser(ctx, userID)
}
func (s *Service) Get(ctx context.Context, userID, channelID uuid.UUID) (*domain.Channel, error) {
	return s.repo.GetByUser(ctx, userID, channelID)
}
func (s *Service) Update(ctx context.Context, userID, channelID uuid.UUID, name string) error {
	return s.repo.Update(ctx, userID, &domain.Channel{ID: channelID, Name: name})
}
func (s *Service) Delete(ctx context.Context, userID, channelID uuid.UUID) error {
	return s.repo.Delete(ctx, userID, channelID)
}
func (s *Service) AddVideo(ctx context.Context, userID, channelID, videoID uuid.UUID) error {
	return s.repo.AddVideo(ctx, userID, channelID, videoID)
}
func (s *Service) RemoveVideo(ctx context.Context, userID, channelID, videoID uuid.UUID) error {
	return s.repo.RemoveVideo(ctx, userID, channelID, videoID)
}
func (s *Service) ListVideos(ctx context.Context, userID, channelID uuid.UUID) ([]domain.Video, error) {
	return s.repo.ListVideos(ctx, userID, channelID)
}
