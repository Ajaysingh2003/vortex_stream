package repository

import (
	"context"
	"time"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// MonthlyBandwidthPoint is one calendar day in the current month.
type MonthlyBandwidthPoint struct {
	Date string  `json:"date"`
	GB   float64 `json:"gb"`
}

// BandwidthRepositoryInterface defines database operations for tracking streaming bandwidth
type BandwidthRepositoryInterface interface {
	RecordEvent(ctx context.Context, userID uuid.UUID, videoID *uuid.UUID, bytes int64) error
	GetTotalUsageForPeriod(ctx context.Context, userID uuid.UUID, start, end time.Time) (int64, error)
	GetMonthlyUsageTrend(ctx context.Context, userID uuid.UUID, start, end time.Time) ([]MonthlyBandwidthPoint, error)
}

type postgresBandwidthRepository struct {
	db *gorm.DB
}

func NewBandwidthRepository(db *gorm.DB) BandwidthRepositoryInterface {
	return &postgresBandwidthRepository{db: db}
}

// 1. RecordEvent logs an individual bandwidth event (e.g. video segment playback)
func (r *postgresBandwidthRepository) RecordEvent(ctx context.Context, userID uuid.UUID, videoID *uuid.UUID, bytes int64) error {
	event := domain.BandwidthUsageEvent{
		ID:        uuid.New(),
		UserID:    userID,
		VideoID:   videoID,
		Bytes:     bytes,
		CreatedAt: time.Now(),
	}

	return r.db.WithContext(ctx).Create(&event).Error
}

// 2. GetTotalUsageForPeriod calculates total bytes transferred between two timestamps
func (r *postgresBandwidthRepository) GetTotalUsageForPeriod(ctx context.Context, userID uuid.UUID, start, end time.Time) (int64, error) {
	var totalBytes int64

	err := r.db.WithContext(ctx).
		Model(&domain.BandwidthUsageEvent{}).
		Select("COALESCE(SUM(bytes), 0)").
		Where("user_id = ? AND created_at >= ? AND created_at < ?", userID, start, end).
		Scan(&totalBytes).Error

	if err != nil {
		return 0, err
	}

	return totalBytes, nil
}

// GetMonthlyUsageTrend returns one point for every calendar day in the month.
// Empty days are included so the chart line is continuous.
func (r *postgresBandwidthRepository) GetMonthlyUsageTrend(ctx context.Context, userID uuid.UUID, start, end time.Time) ([]MonthlyBandwidthPoint, error) {
	results := make([]MonthlyBandwidthPoint, 0)

	err := r.db.WithContext(ctx).Raw(`
		WITH calendar AS (
			SELECT generate_series(
				?::date,
				(?::date - INTERVAL '1 day')::date,
				INTERVAL '1 day'
			)::date AS day
		), usage AS (
			SELECT (created_at AT TIME ZONE 'UTC')::date AS day, SUM(bytes) AS bytes
			FROM bandwidth_usage_event
			WHERE user_id = ? AND created_at >= ? AND created_at < ?
			GROUP BY 1
		)
		SELECT TO_CHAR(c.day, 'YYYY-MM-DD') AS date,
		       ROUND((COALESCE(u.bytes, 0)::numeric / 1073741824.0), 4) AS gb
		FROM calendar c
		LEFT JOIN usage u ON u.day = c.day
		ORDER BY c.day ASC
	`, start, end, userID, start, end).Scan(&results).Error

	if err != nil {
		return nil, err
	}

	return results, nil
}
