package service

import (
	"context"
	"fmt"
	"time"

	"github.com/ajaysingh2003/vortex-stream/internal/modules/bandwidth/repository"
	subscriptionRepo "github.com/ajaysingh2003/vortex-stream/internal/modules/billing/repository"
	userRepo "github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	billingConfig "github.com/ajaysingh2003/vortex-stream/internal/shared/config/billing"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/google/uuid"
)

type BandwidthDashboardDTO struct {
	UsedBytes int64                              `json:"usedBytes"`
	LimitGb   int64                              `json:"limitGb"`
	DailyData []repository.MonthlyBandwidthPoint `json:"dailyData"`
}

// BandwidthServiceInterface defines the business logic contract for bandwidth operations
type BandwidthServiceInterface interface {
	GetBandwidthOverview(ctx context.Context, userID uuid.UUID) (*BandwidthDashboardDTO, error)
}



type bandwidthService struct {
	bandwidthRepo repository.BandwidthRepositoryInterface
	userRepo      userRepo.UserRepository
	subscriptionRepo  subscriptionRepo.SubscriptionRepository
}

// NewBandwidthService returns the interface implementation
func NewBandwidthService(repo repository.BandwidthRepositoryInterface, userRepo userRepo.UserRepository,subscriptionRepo  subscriptionRepo.SubscriptionRepository) BandwidthServiceInterface {
	return &bandwidthService{bandwidthRepo: repo, userRepo: userRepo ,subscriptionRepo: subscriptionRepo}
}

func (s *bandwidthService) GetBandwidthOverview(ctx context.Context, userID uuid.UUID) (*BandwidthDashboardDTO, error) {

	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, &utils.ApiError{
			Code:    404,
			Message: "User is not found",
		}
	}

	





currentPlan, err := s.subscriptionRepo.GetCurrentActivePlan(ctx, userID)
if err != nil {
    return nil, err // Don't forget to handle repository errors
}

var plan billingConfig.Plan
if currentPlan == nil {
    plan = billingConfig.GetPlan("free")
} else {
    plan = billingConfig.GetPlan(string(currentPlan.Plan))
}

fmt.Printf("%+v\n", plan)


	// Use UTC consistently with the timestamptz event timestamps.
	now := time.Now().UTC()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	startOfNextMonth := startOfMonth.AddDate(0, 1, 0)

	trend, err := s.bandwidthRepo.GetMonthlyUsageTrend(ctx, userID, startOfMonth, startOfNextMonth)
	if err != nil {
		return nil, err
	}

	totalBytes, err := s.bandwidthRepo.GetTotalUsageForPeriod(ctx, userID, startOfMonth, now)
	if err != nil {
		return nil, err
	}

	gbLimit := plan.Limits.MaxBandwidthBytes / (1024 * 1024 * 1024)
	return &BandwidthDashboardDTO{
		UsedBytes: totalBytes,
		LimitGb:   gbLimit,
		DailyData: trend,
	}, nil
}
