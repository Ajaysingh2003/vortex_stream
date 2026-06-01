package handler

import (
	"net/http"

	"github.com/ajaysingh2003/vortex-stream/internal/modules/billing/config"
	"github.com/gin-gonic/gin"
)

type BillingHandler struct {
	
}

type PublicPlanProjection struct {
	Name          string      `json:"name"`
	Description   string      `json:"description"`
	BillingCycles interface{} `json:"billing_cycles"` 
}

func (*BillingHandler) BillingPlan(c *gin.Context) {
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