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
	return r.db.WithContext(ctx).Table("channels").Create(channel).Error
}
func (r *postgresRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]domain.Channel, error) {
	var channels []domain.Channel
	workspaceIDs := r.db.Table("workspaces").Select("id").Where("user_id = ?", userID)
	err := r.db.WithContext(ctx).Table("channels").Where("workspace_id IN (?)", workspaceIDs).Order("created_at DESC").Find(&channels).Error
	return channels, err
}
func (r *postgresRepository) GetByUser(ctx context.Context, userID, channelID uuid.UUID) (*domain.Channel, error) {
	var channel domain.Channel
	workspaceIDs := r.db.Table("workspaces").Select("id").Where("user_id = ?", userID)
	err := r.db.WithContext(ctx).Table("channels").Where("id = ? AND workspace_id IN (?)", channelID, workspaceIDs).First(&channel).Error
	return &channel, err
}
func (r *postgresRepository) Update(ctx context.Context, userID uuid.UUID, channel *domain.Channel) error {
	return r.db.WithContext(ctx).Table("channels").Where("id = ? AND workspace_id IN (SELECT id FROM workspaces WHERE user_id = ?)", channel.ID, userID).Updates(map[string]interface{}{"name": channel.Name}).Error
}
func (r *postgresRepository) Delete(ctx context.Context, userID, channelID uuid.UUID) error {
	return r.db.WithContext(ctx).Table("channels").Where("id = ? AND workspace_id IN (SELECT id FROM workspaces WHERE user_id = ?)", channelID, userID).Delete(&domain.Channel{}).Error
}

func (r *postgresRepository) AddVideo(ctx context.Context, userID, channelID, videoID uuid.UUID) error {
	var count int64
	if err := r.db.WithContext(ctx).Table("channels").Where("channels.id = ? AND channels.workspace_id IN (SELECT id FROM workspaces WHERE user_id = ?)", channelID, userID).Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return errors.New("channel not found")
	}
	if err := r.db.WithContext(ctx).Table("video").Where("video.id = ? AND video.workspace_id IN (SELECT id FROM workspaces WHERE user_id = ?)", videoID, userID).Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return errors.New("video not found")
	}
	return r.db.WithContext(ctx).Table("channel_videos").Clauses(clause.OnConflict{DoNothing: true}).Create(&domain.ChannelVideo{ID: uuid.New(), ChannelID: channelID, VideoID: videoID}).Error
}

func (r *postgresRepository) RemoveVideo(ctx context.Context, userID, channelID, videoID uuid.UUID) error {
	var count int64
	if err := r.db.WithContext(ctx).Table("channels").Where("channels.id = ? AND channels.workspace_id IN (SELECT id FROM workspaces WHERE user_id = ?)", channelID, userID).Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return errors.New("channel not found")
	}
	return r.db.WithContext(ctx).Table("channel_videos").Where("channel_id = ? AND video_id = ?", channelID, videoID).Delete(&domain.ChannelVideo{}).Error
}

func (r *postgresRepository) ListVideos(ctx context.Context, userID, channelID uuid.UUID) ([]domain.Video, error) {
	var videos []domain.Video
	err := r.db.WithContext(ctx).Table("video").Joins("JOIN channel_videos ON channel_videos.video_id = video.id").Where("channel_videos.channel_id = ? AND video.workspace_id IN (SELECT id FROM workspaces WHERE user_id = ?)", channelID, userID).Order("video.created_at DESC").Find(&videos).Error
	return videos, err
}
