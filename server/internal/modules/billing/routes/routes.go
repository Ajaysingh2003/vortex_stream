package routes

import (
	"time"
	// "github.com/ajaysingh2003/vortex-stream/internal/api/middleware"
	"github.com/ajaysingh2003/vortex-stream/internal/api/middleware"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/billing/handler"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter(r *gin.Engine, billingHandler handler.BillingHandler ,jwtMaker *utils.JwtMaker)*gin.Engine{
	// r := gin.Default()
	
	r.Use(cors.New(cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// user api
	api := r.Group("/api/v1")
	billing:=api.Group("/billing")
	payment:=api.Group("/payments")
	 {
		billing.GET("/plans/config",billingHandler.BillingPlan)
		payment.POST("/checkout",middleware.AuthMiddleware(jwtMaker),billingHandler.CreateCheckoutSession)
		payment.POST("/webhook",billingHandler.ListenWebhook)
	 }
	 
	return r
}




