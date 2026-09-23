package services

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/nats-io/nats.go"
	"gorm.io/gorm"

	analyticsDomain "github.com/ajaysingh2003/vortex-stream/internal/modules/analytics/domain"
	analyticsDTO "github.com/ajaysingh2003/vortex-stream/internal/modules/analytics/dto"
	workspaceRepository "github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	clickhouseConfig "github.com/ajaysingh2003/vortex-stream/internal/shared/config/clickhouse"
	natsConfig "github.com/ajaysingh2003/vortex-stream/internal/shared/config/nats"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/google/uuid"
)

type AnalyticsService struct {
	DB            *gorm.DB
	nats          *natsConfig.Client
	clickhouse    *clickhouseConfig.Client
	workspaceRepo workspaceRepository.WorkshopRepository
}

func New(natsClient *natsConfig.Client, clickhouseClient *clickhouseConfig.Client, workspaceRepo workspaceRepository.WorkshopRepository, db *gorm.DB) *AnalyticsService {
	return &AnalyticsService{DB: db, nats: natsClient, clickhouse: clickhouseClient, workspaceRepo: workspaceRepo}
}

func (s *AnalyticsService) PublishBatch(ctx context.Context, events []analyticsDomain.Event) error {
	if len(events) == 0 || len(events) > 100 {
		return fmt.Errorf("events batch must contain between 1 and 100 events")
	}
	for index := range events {
		if err := events[index].Normalize(); err != nil {
			return fmt.Errorf("event %d: %w", index, err)
		}
	}
	payload, err := json.Marshal(analyticsDomain.Batch{Events: events})
	if err != nil {
		return fmt.Errorf("marshal analytics batch: %w", err)
	}
	if s.nats == nil {
		return &utils.ApiError{Code: 503, Message: "Analytics ingestion is temporarily unavailable"}
	}
	if _, err := s.nats.JS.Publish(s.nats.Subject, payload, nats.Context(ctx)); err != nil {
		return &utils.ApiError{Code: 503, Message: "Analytics ingestion is temporarily unavailable"}
	}
	return nil
}

func (s *AnalyticsService) authorizeWorkspace(ctx context.Context, userID, workspaceID uuid.UUID) error {
	if s.workspaceRepo == nil {
		return fmt.Errorf("analytics workspace authorization is not configured")
	}
	workspace, err := s.workspaceRepo.GetWorkspaceWithUserId(ctx, workspaceID, userID)
	if err != nil || workspace == nil {
		return &utils.ApiError{Code: 404, Message: "workspace is not found"}
	}
	return nil
}

func (s *AnalyticsService) queryClient() (*clickhouseConfig.Client, error) {
	if s.clickhouse == nil {
		return nil, fmt.Errorf("analytics query storage is not configured")
	}
	return s.clickhouse, nil
}

func (s *AnalyticsService) Overview(ctx context.Context, userID, workspaceID uuid.UUID, videoID *uuid.UUID, dateRange analyticsDTO.DateRange) (*analyticsDTO.Overview, error) {
	if err := s.authorizeWorkspace(ctx, userID, workspaceID); err != nil {
		return nil, err
	}
	client, err := s.queryClient()
	if err != nil {
		return nil, err
	}
	return client.Overview(ctx, workspaceID, videoID, dateRange)
}

func (s *AnalyticsService) TimeSeries(ctx context.Context, userID, workspaceID, videoID uuid.UUID, dateRange analyticsDTO.DateRange) ([]analyticsDTO.TimeSeriesPoint, error) {
	if err := s.authorizeWorkspace(ctx, userID, workspaceID); err != nil {
		return nil, err
	}
	client, err := s.queryClient()
	if err != nil {
		return nil, err
	}
	return client.TimeSeries(ctx, workspaceID, videoID, dateRange)
}

func (s *AnalyticsService) Retention(ctx context.Context, userID, workspaceID, videoID uuid.UUID, dateRange analyticsDTO.DateRange) ([]analyticsDTO.Retention, error) {
	if err := s.authorizeWorkspace(ctx, userID, workspaceID); err != nil {
		return nil, err
	}
	client, err := s.queryClient()
	if err != nil {
		return nil, err
	}
	return client.Retention(ctx, workspaceID, videoID, dateRange)
}

func (s *AnalyticsService) Technical(ctx context.Context, userID, workspaceID, videoID uuid.UUID, dimension string, dateRange analyticsDTO.DateRange) ([]analyticsDTO.TechnicalBreakdown, error) {
	if err := s.authorizeWorkspace(ctx, userID, workspaceID); err != nil {
		return nil, err
	}
	client, err := s.queryClient()
	if err != nil {
		return nil, err
	}
	return client.Technical(ctx, workspaceID, videoID, dimension, dateRange)
}

func (s *AnalyticsService) Funnel(ctx context.Context, userID, workspaceID uuid.UUID, videoID *uuid.UUID, dateRange analyticsDTO.DateRange) (*analyticsDTO.Funnel, error) {
	if err := s.authorizeWorkspace(ctx, userID, workspaceID); err != nil {
		return nil, err
	}
	client, err := s.queryClient()
	if err != nil {
		return nil, err
	}
	return client.Funnel(ctx, workspaceID, videoID, dateRange)
}

func (s *AnalyticsService) ConversionSeries(ctx context.Context, userID, workspaceID uuid.UUID, videoID *uuid.UUID, dateRange analyticsDTO.DateRange) ([]analyticsDTO.ConversionPoint, error) {
	if err := s.authorizeWorkspace(ctx, userID, workspaceID); err != nil {
		return nil, err
	}
	client, err := s.queryClient()
	if err != nil {
		return nil, err
	}
	return client.ConversionSeries(ctx, workspaceID, videoID, dateRange)
}
