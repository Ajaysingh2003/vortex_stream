package handler

import (
	// "encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/ajaysingh2003/vortex-stream/internal/modules/billing/config"
	services "github.com/ajaysingh2003/vortex-stream/internal/modules/billing/services"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stripe/stripe-go/v85"
	"github.com/stripe/stripe-go/v85/checkout/session"
	"github.com/stripe/stripe-go/v85/webhook"
)

type BillingHandler struct {
	PaymentService services.BillingInterface
}

type PublicPlanProjection struct {
	Name          string      `json:"name"`
	Description   string      `json:"description"`
	BillingCycles interface{} `json:"billing_cycles"` 
}

func (*BillingHandler) BillingPlan (c *gin.Context) {
	publicPlans := make(map[string]PublicPlanProjection)

	for tierKey, internalPlan := range config.Plans {
		publicPlans[tierKey] = PublicPlanProjection{
			Name:          internalPlan.Name,
			Description:   internalPlan.Description,
			BillingCycles: internalPlan.BillingCycles, // Only map over the pricing and price IDs
		}
	}

	
	c.JSON(http.StatusOK, gin.H{"success":true,"data":publicPlans})
} 

type CheckoutRequest struct {
	PriceID string `json:"price_id" binding:"required"`
}


func (h *BillingHandler) CreateCheckoutSession (c *gin.Context) {
		userIDRaw,exists:=c.Get("user_id")

		fmt.Print(userIDRaw,"userID test")
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")

	var req CheckoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload: price_id is required"})
		return
	}


	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user_id not found in context"})
		return
	}
	currentUserID ,ok := userIDRaw.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: invalid user_id format"})
		return
	}

	params := &stripe.CheckoutSessionParams{
		Mode:       stripe.String(string(stripe.CheckoutSessionModeSubscription)), // "subscription" handles monthly/yearly recurring loops
		PaymentMethodTypes: stripe.StringSlice([]string{"card"}),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(req.PriceID),
				Quantity: stripe.Int64(1),
			},
		},
		SuccessURL: stripe.String("http://localhost:4000/console?payment=success"),
		CancelURL:  stripe.String("http://localhost:4000/pricing?payment=cancelled"),
	}

	params.AddMetadata("user_id", currentUserID.String())

	s, err := session.New(params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Stripe session: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"url": s.URL,
	})
}

type ProcessedWebhookEvent struct {
	ID        string    `gorm:"primaryKey"`
	ProcessedAt time.Time `gorm:"autoCreateTime"`
}

func (h *BillingHandler) ListenWebhook (c *gin.Context) {
	// 1. Guard against massive payloads (DDoS protection)
	fmt.Print("listening webhook")
	const MaxBodyBytes = int64(65536)
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, MaxBodyBytes)

	payload, err := c.GetRawData()
	if err != nil {
		log.Printf("[Webhook Error] Failed to read request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body"})
		return
	}
	
	// 2. Cryptographically verify the signature
	endpointSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")
	signatureHeader := c.GetHeader("Stripe-Signature")

	event, err := webhook.ConstructEvent(payload, signatureHeader, endpointSecret)

	if err != nil {
		log.Printf("[Webhook Error] Cryptographic signature validation failure: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Signature validation failed"})
		return
	}

	err=h.PaymentService.ListenWebhook(c.Request.Context(), event)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": utils.ErrMsg(err)})
		return
	}

	// 🔥 3. IDEMPOTENCY GUARD: Check if we already processed this specific event ID
	// var processed ProcessedWebhookEvent
	// if err := h.DB.First(&processed, "id = ?", event.ID).Error; err == nil {
	// 	log.Printf("[Webhook Warning] Event %s already processed. Skipping.", event.ID)
	// 	c.Status(http.StatusOK) // Return 200 OK instantly so Stripe stops retrying
	// 	return
	// }

	// 4. Core Switch Matrix to handle the subscription lifecycle
	

	// 5. Always reply with a clean 200 OK to Stripe
	c.Status(http.StatusOK)
}
