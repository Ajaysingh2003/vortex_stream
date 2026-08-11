package repository

import (
	"context"
	"errors"
	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Repository interface {
	Create(ctx context.Context, channel *domain.Channel) error
	ListByUser(ctx context.Context, userID uuid.UUID) ([]domain.Channel, error)
	GetByUser(ctx context.Context, userID, channelID uuid.UUID) (*domain.Channel, error)
	Update(ctx context.Context, userID uuid.UUID, channel *domain.Channel) error
	Delete(ctx context.Context, userID, channelID uuid.UUID) error
	AddVideo(ctx context.Context, userID, channelID, videoID uuid.UUID) error
	RemoveVideo(ctx context.Context, userID, channelID, videoID uuid.UUID) error
	ListVideos(ctx context.Context, userID, channelID uuid.UUID) ([]domain.Video, error)
}

type postgresRepository struct{ db *gorm.DB }

func New(db *gorm.DB) Repository { return &postgresRepository{db: db} }
func (r *postgresRepository) Create(ctx context.Context, channel *domain.Channel) error {
	return r.db.WithContext(ctx).Create(channel).Error
}
func (r *postgresRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]domain.Channel, error) {
	var channels []domain.Channel
	err := r.db.WithContext(ctx).Joins("JOIN workspace ON workspace.id = channel.workspace_id").Where("workspace.user_id = ?", userID).Order("channel.created_at DESC").Find(&channels).Error
	return channels, err
}
func (r *postgresRepository) GetByUser(ctx context.Context, userID, channelID uuid.UUID) (*domain.Channel, error) {
	var channel domain.Channel
	err := r.db.WithContext(ctx).Joins("JOIN workspace ON workspace.id = channel.workspace_id").Where("channel.id = ? AND workspace.user_id = ?", channelID, userID).First(&channel).Error
	return &channel, err
}
func (r *postgresRepository) Update(ctx context.Context, userID uuid.UUID, channel *domain.Channel) error {
	return r.db.WithContext(ctx).Model(&domain.Channel{}).Where("id = ? AND workspace_id IN (SELECT id FROM workspace WHERE user_id = ?)", channel.ID, userID).Updates(map[string]interface{}{"name": channel.Name}).Error
}
func (r *postgresRepository) Delete(ctx context.Context, userID, channelID uuid.UUID) error {
	return r.db.WithContext(ctx).Where("id = ? AND workspace_id IN (SELECT id FROM workspace WHERE user_id = ?)", channelID, userID).Delete(&domain.Channel{}).Error
}

func (r *postgresRepository) AddVideo(ctx context.Context, userID, channelID, videoID uuid.UUID) error {
	var count int64
	if err := r.db.WithContext(ctx).Table("channel").Joins("JOIN workspace ON workspace.id = channel.workspace_id").Where("channel.id = ? AND workspace.user_id = ?", channelID, userID).Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return errors.New("channel not found")
	}
	if err := r.db.WithContext(ctx).Table("video").Joins("JOIN workspace ON workspace.id = video.workspace_id").Where("video.id = ? AND workspace.user_id = ?", videoID, userID).Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return errors.New("video not found")
	}
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(&domain.ChannelVideo{ID: uuid.New(), ChannelID: channelID, VideoID: videoID}).Error
}

func (r *postgresRepository) RemoveVideo(ctx context.Context, userID, channelID, videoID uuid.UUID) error {
	var count int64
	if err := r.db.WithContext(ctx).Table("channel").Joins("JOIN workspace ON workspace.id = channel.workspace_id").Where("channel.id = ? AND workspace.user_id = ?", channelID, userID).Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return errors.New("channel not found")
	}
	return r.db.WithContext(ctx).Where("channel_id = ? AND video_id = ?", channelID, videoID).Delete(&domain.ChannelVideo{}).Error
}

func (r *postgresRepository) ListVideos(ctx context.Context, userID, channelID uuid.UUID) ([]domain.Video, error) {
	var videos []domain.Video
	err := r.db.WithContext(ctx).Table("video").Joins("JOIN channel_video ON channel_video.video_id = video.id").Joins("JOIN channel ON channel.id = channel_video.channel_id").Joins("JOIN workspace ON workspace.id = channel.workspace_id").Where("channel.id = ? AND workspace.user_id = ?", channelID, userID).Order("video.created_at DESC").Find(&videos).Error
	return videos, err
}
