package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/stripe/stripe-go/v85/subscription"

	// "github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	subscriptionRepo "github.com/ajaysingh2003/vortex-stream/internal/modules/billing/repository"
	userUsageRepo "github.com/ajaysingh2003/vortex-stream/internal/modules/billing/repository"
	folderRepo "github.com/ajaysingh2003/vortex-stream/internal/modules/folders/repository"
	userRpo "github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	workspaceRepo "github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/videos/repository"
	config "github.com/ajaysingh2003/vortex-stream/internal/shared/config/redis"

	billingConfig "github.com/ajaysingh2003/vortex-stream/internal/modules/billing/config"
	"github.com/google/uuid"
	"github.com/stripe/stripe-go/v85"
	"gorm.io/gorm"
)

type BillingInterface interface {
	ListenWebhook(ctx context.Context, event stripe.Event) error
}

type BillingServiceRepo struct {
	userRepo         userRpo.UserRepository
	videoRepo        repository.VideoRepository
	workspaceRepo    workspaceRepo.WorkshopRepository
	folderRepo       folderRepo.FolderRepository
	subscriptionRepo subscriptionRepo.SubscriptionRepository
	userUsageRepo    userUsageRepo.UsageRepository
	db               *gorm.DB
}

func NewBillingService(userRepo userRpo.UserRepository, videoRepo repository.VideoRepository, workspaceRepo workspaceRepo.WorkshopRepository, folderRepo folderRepo.FolderRepository, subscriptionRepo subscriptionRepo.SubscriptionRepository, userUsageRepo userUsageRepo.UsageRepository, db *gorm.DB) BillingInterface {
	return &BillingServiceRepo{userRepo: userRepo, videoRepo: videoRepo, workspaceRepo: workspaceRepo, folderRepo: folderRepo, subscriptionRepo: subscriptionRepo, userUsageRepo: userUsageRepo, db: db}
}

type ProcessedWebhookEvent struct {
	ID          string    `gorm:"primaryKey"`
	ProcessedAt time.Time `gorm:"autoCreateTime"`
}

func (r *BillingServiceRepo) ListenWebhook(ctx context.Context, event stripe.Event) error {
	redisKey := fmt.Sprintf("webhook:%s", event.ID)
	ttl := 3 * 24 * time.Hour

	// ⚡ Redis Idempotency Guard
	isNew, err := config.RedisClient.SetNX(ctx, redisKey, "processed", ttl).Result()
	if err != nil {
		return err
	}
	if !isNew && err == nil {
		log.Printf("[Webhook Warning] Duplicate event %s blocked by Redis cache.", event.ID)
		return nil
	}

	switch event.Type {

	// Scenario A: Initial subscription checkout succeeded
	case "checkout.session.completed":
		var session stripe.CheckoutSession
		if err := json.Unmarshal(event.Data.Raw, &session); err != nil {
			return fmt.Errorf("failed to parse checkout session payload: %w", err)
		}

		subscriptionID := session.Subscription.ID
		Subscription, err := subscription.Get(subscriptionID, nil)
		if err != nil {
			return fmt.Errorf("failed to retrieve subscription details: %w", err)
		}

		userIDraw := session.Metadata["user_id"]
		if userIDraw == "" {
			return errors.New("security anomaly: checkout session missing user_id tracking token")
		}

		userID, err := uuid.Parse(userIDraw)
		if err != nil {
			return fmt.Errorf("failed to parse user ID: %w", err)
		}

		startTime := time.Now()
		periodEnd := Subscription.Items.Data[0].CurrentPeriodEnd
		priceID := Subscription.Items.Data[0].Price.ID
		getPlan := billingConfig.GetPlanFromPriceID(priceID)

		err = r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
			fmt.Print("going going")
			err = r.subscriptionRepo.UpsertTx(ctx, tx, &domain.Subscription{
				ID:                   uuid.New(),
				UserID:               userID,
				StripeSubscriptionID: session.Subscription.ID,
				StripePriceID:        priceID,
				Plan:                 domain.PlanTier(getPlan),
				Status:               "active",
				PeriodStart:          startTime,
				PeriodEnd:            time.Unix(periodEnd, 0),
			})
			if err != nil {
				return err
			}

			err = r.userUsageRepo.UpsertTx(ctx, tx, &domain.UserUsageCounters{
				ID:                      uuid.New(),
				UserID:                  userID,
				StorageBytesUsed:        0,
				PlaybackMinutesUsed:     0,
				SubtitleGenerationsUsed: 0,
				ResetAt:                 time.Unix(periodEnd, 0),
			})
			if err != nil {
				return err
			}

			return nil
		})

		if err != nil {
			return fmt.Errorf("failed to commit checkout provisions: %w", err)
		}
		log.Printf("[Billing Success] User %s successfully provisioned plan access.", userID)

	case "invoice.payment_succeeded":
		var invoice stripe.Invoice
		if err := json.Unmarshal(event.Data.Raw, &invoice); err != nil {
			return fmt.Errorf("failed to parse invoice payload: %w", err)
		}

		if invoice.BillingReason == "subscription_create" {
			log.Printf("[Webhook] Skipping subscription_create invoice %s", invoice.ID)
			return nil
		}	
		if invoice.BillingReason != "subscription_cycle" &&
		invoice.BillingReason != "subscription_update" {
		log.Printf("[Webhook] Skipping invoice with billing_reason=%s", invoice.BillingReason)
		return nil
	}
		subscriptionID := invoice.Parent.SubscriptionDetails.Subscription.ID
		// Extract timestamps accurately out of the invoice payload lines
		var periodStart, periodEnd time.Time
		if invoice.Lines != nil && len(invoice.Lines.Data) > 0 {
			periodStart = time.Unix(invoice.Lines.Data[0].Period.Start, 0)
			periodEnd = time.Unix(invoice.Lines.Data[0].Period.End, 0)
		} else {
			periodStart = time.Now()
			periodEnd = periodStart.AddDate(0, 1, 0)
		}

		userIDraw := invoice.Metadata["user_id"]

		userID,err:= uuid.Parse(userIDraw)

		if err != nil {
			return err
		}
		
		err = r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {

			subscriptionData, err := r.subscriptionRepo.GetByUserID(ctx, tx , userID)
			if err != nil {

				return fmt.Errorf("failed to look up subscription for renewal: %w", err)
				// return fmt.Errorf("failed to look up active subscription mapping: %w", err)
			}
			fmt.Print("gona hit")
			// 🟩 FIXED: Carried forward existing details so UpsertAll doesn't nullify your strings!
			err = r.subscriptionRepo.UpsertTx(ctx, tx, &domain.Subscription{
				ID:                   subscriptionData.ID,
				UserID:               subscriptionData.UserID,
				StripeSubscriptionID: subscriptionID,
				StripePriceID:        subscriptionData.StripePriceID,
				Plan:                 subscriptionData.Plan,
				Status:               "active",
				PeriodStart:          periodStart,
				PeriodEnd:            periodEnd,
			})
			if err != nil {
				return err
			}

			// Reset usage metrics back to 0 for the fresh month
			err = r.userUsageRepo.UpsertTx(ctx, tx, &domain.UserUsageCounters{
				ID:                      uuid.New(),
				UserID:                  subscriptionData.UserID,
				StorageBytesUsed:        0,
				PlaybackMinutesUsed:     0,
				SubtitleGenerationsUsed: 0,
				ResetAt:                 periodEnd, // Clear and set next month boundary
			})
			if err != nil {
				return err
			}

			return nil
		})

		if err != nil {
			return fmt.Errorf("failed to log subscription renewal milestones: %w", err)
		}

		log.Printf("[Billing Success] Subscription %s renewed successfully until %v.", subscriptionID, periodEnd)
		
	
	case "customer.subscription.deleted":
		var sub stripe.Subscription
		if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
			return fmt.Errorf("failed to parse subscription payload: %w", err)
		}
		
		err = r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {

			subscriptionData, err := r.subscriptionRepo.GetByStripeSubscriptionID(ctx, tx , sub.ID)
			if err != nil {

				return fmt.Errorf("failed to look up subscription for renewal: %w", err)
				// return fmt.Errorf("failed to look up active subscription mapping: %w", err)
			}
			fmt.Print("gona hit")
			err = r.subscriptionRepo.UpsertTx(ctx, tx, &domain.Subscription{
				ID:                   subscriptionData.ID,
				UserID:               subscriptionData.UserID,
				StripeSubscriptionID: subscriptionData.StripeSubscriptionID,
				StripePriceID:        subscriptionData.StripePriceID,
				Plan:                 subscriptionData.Plan,
				Status:               "canceled",
				PeriodStart:          subscriptionData.PeriodStart,
				PeriodEnd:            time.Unix(sub.EndedAt, 0),
			})
			if err != nil {
				return err
			}
			
			// Reset usage metrics back to 0 for the fresh month
			// err = r.userUsageRepo.UpsertTx(ctx, tx, &domain.UserUsageCounters{
			// 	ID:                      uuid.New(),
			// 	UserID:                  subscriptionData.UserID,
			// 	StorageBytesUsed:        0,
			// 	PlaybackMinutesUsed:     0,
			// 	SubtitleGenerationsUsed: 0,
			// 	ResetAt:                 time.Unix(sub.EndedAt, 0),
			// })

			// if err != nil {
			// 	return err
			// }

			return nil
		})

		if err != nil {
			return fmt.Errorf("failed to log subscription renewal milestones: %w", err)
		}

		log.Printf("[Billing Success] Subscription %s canceled successfully until.", sub.ID,)
		
	
	default:
		log.Printf("[Billing Info] System skipped unmapped event classification pattern: %s", event.Type)
	}

	return nil
}
