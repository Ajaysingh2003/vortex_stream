package routes

import (
	"github.com/ajaysingh2003/vortex-stream/internal/api/middleware"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/leads/handler"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-gonic/gin"
)

func SetupRouter(r *gin.Engine, h *handler.Handler, jwt *utils.JwtMaker) {
	group := r.Group("/api/v1/workspace/:workspaceId/video/:id/leads", middleware.AuthMiddleware(jwt))
	group.GET("", h.List)
	group.GET("/export", h.Export)
	group.POST("/send", h.Queue)
	group.GET("/integrations", h.Integrations)
	group.POST("/integrations", h.SaveIntegration)
	group.PUT("/integrations/:integrationId", h.SaveIntegration)
	group.POST("/integrations/:integrationId/test", h.Test)
	group.GET("/deliveries", h.Deliveries)
	group.GET("/deliveries/:deliveryId/attempts", h.Attempts)
	group.POST("/deliveries/:deliveryId/retry", h.Retry)
}
