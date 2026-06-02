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
	userRepo      userRpo.UserRepository
	videoRepo     repository.VideoRepository
	workspaceRepo workspaceRepo.WorkshopRepository
	folderRepo    folderRepo.FolderRepository
	subscriptionRepo subscriptionRepo.SubscriptionRepository
	userUsageRepo userUsageRepo.UsageRepository
	db *gorm.DB
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
	isNew, err :=config.RedisClient.SetNX(ctx, redisKey, "processed", ttl).Result()
	if err != nil {
		return  err
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

		subscriptionId:= session.Subscription.ID
		
		getSubscription,err:=subscription.Get(subscriptionId, nil)
		
		// b,_:=json.MarshalIndent(getSubscription, "", "  ")
		// fmt.Println(string(b),"this is the subscription details")
		if err != nil {
			return fmt.Errorf("failed to retrieve subscription details: %w", err)
		}

		// b, _ := json.MarshalIndent(session.Subscription.ID, "", "  ")
		// fmt.Println(string(b),"this is the session subscription")

		// Retrieve the workspace routing tag we appended in the metadata block
		userIDraw := session.Metadata["user_id"]
		if userIDraw == "" {
			return errors.New("security anomaly: checkout session missing user_id tracking token")
		}
		userID ,err:= uuid.Parse(userIDraw)
		if err != nil {
			return fmt.Errorf("failed to parse user ID: %w", err)
		}

		fmt.Print(userID)
		// getSubscription.Items.Data[0].CurrentPeriodEnd
		// Update database parameters inside a secure ACID transaction block
		// eventTime := time.Unix(event.Created, 0)
		startTime:= time.Now()
		periodEnd := getSubscription.Items.Data[0].CurrentPeriodEnd
		// eventTime.AddDate(0, 1, 0)

		
		getPlan:=billingConfig.GetPlanFromPriceID(session.LineItems.Data[0].Price.ID)
		err = r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
			// Upgrade plan metrics
			r.subscriptionRepo.UpsertTx(ctx, tx, &domain.Subscription{
				UserID:             	userID,
				StripeSubscriptionID: 	session.Subscription.ID,
				StripePriceID:        	session.LineItems.Data[0].Price.ID,
				Plan:                 	domain.PlanTier(getPlan),
				Status:               	"active",
				PeriodStart:         	startTime,
				PeriodEnd:            	time.Unix(periodEnd, 0),
			})

			return nil
		})

		
		if err != nil {
			return fmt.Errorf("failed to commit checkout provisions: %w", err)
		}


		// log.Printf("[Billing Success] Workspace %s successfully provisioned Premium access.", workspaceID)

	// Scenario B: Monthly automated subscription renewal payment went through
	// case "invoice.payment_succeeded":
	// 	var invoice stripe.Invoice
	// 	if err := json.Unmarshal(event.Data.Raw, &invoice); err != nil {
	// 		return fmt.Errorf("failed to parse invoice payload: %w", err)
	// 	}

	// 	// Ignore setup invoices or standalone product one-offs that don't have an active subscription link
	// 	if invoice.Subscription == nil {
	// 		return nil
	// 	}

	// 	// Extract the exact contract time milestone where access should terminate next
	// 	periodEnd := time.Unix(invoice.Lines.Data[0].Period.End, 0)

	// 	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
	// 		// Find customer row context, update current status, and reset usage matrix logs back to 0
	// 		if err := tx.Table("workspaces").Where("stripe_customer_id = ?", invoice.Customer.ID).Updates(map[string]interface{}{
	// 			"subscription_status": "active",
	// 			"expires_at":          periodEnd,
	// 			// "used_transcoding_seconds": 0, // Reset usage metrics container for the fresh month!
	// 		}).Error; err != nil {
	// 			return err
	// 		}
	// 		return tx.Create(&ProcessedWebhookEvent{ID: event.ID}).Error
	// 	})
	// 	if err != nil {
	// 		return fmt.Errorf("failed to log subscription renewal milestones: %w", err)
	// 	}
	// 	log.Printf("[Billing Success] Customer %s renewed successfully until %v.", invoice.Customer.ID, periodEnd)

	// // Scenario C: Card declined on renewal
	// case "invoice.payment_failed":
	// 	var invoice stripe.Invoice
	// 	if err := json.Unmarshal(event.Data.Raw, &invoice); err != nil {
	// 		return fmt.Errorf("failed to parse failed invoice details: %w", err)
	// 	}

	// 	// Set status token to past_due (this lets you render warning alerts in your Next.js frontend console)
	// 	if err := s.DB.WithContext(ctx).Table("workspaces").
	// 		Where("stripe_customer_id = ?", invoice.Customer.ID).
	// 		Update("subscription_status", "past_due").Error; err != nil {
	// 		return fmt.Errorf("failed to flag workspace past_due status: %w", err)
	// 	}
	// 	log.Printf("[Billing Warning] Payment declined for Customer %s. Workspace set to past_due.", invoice.Customer.ID)

	// // Scenario D: Subscription dead (Grace period failed, or pre-paid billing month ended after customer cancellation)
	// case "customer.subscription.deleted":
	// 	var sub stripe.Subscription
	// 	if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
	// 		return fmt.Errorf("failed to parse subscription deletion metrics: %w", err)
	// 	}

	// 	err := s.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
	// 		// Evict the workspace from premium storage bounds down to your system's base free tier rules
	// 		if err := tx.Table("workspaces").Where("subscription_id = ?", sub.ID).Updates(map[string]interface{}{
	// 			"subscription_status": "canceled",
	// 			"plan_tier":           "free",
	// 		}).Error; err != nil {
	// 			return err
	// 		}
	// 		return tx.Create(&ProcessedWebhookEvent{ID: event.ID}).Error
	// 	})
	// 	if err != nil {
	// 		return fmt.Errorf("failed to execute workspace subscription degradation: %w", err)
	// 	}
	// 	log.Printf("[Billing Notice] Subscription %s terminated. Revoked dashboard permissions to base limits.", sub.ID)

	default:
		log.Printf("[Billing Info] System skipped unmapped event classification pattern: %s", event.Type)
	}

	return nil

}
