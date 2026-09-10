package routes

import (
	"github.com/ajaysingh2003/vortex-stream/internal/modules/health/handler"
	"github.com/gin-gonic/gin"
)

func SetupHealthRoutes(r *gin.Engine, h *handler.HealthHandler) {
	// Root level health endpoints for load balancers, orchestrators, and monitoring
	r.GET("/health", h.HealthCheck)
	r.GET("/healthz", h.HealthCheck)
	r.GET("/ping", h.Ping)

	// API versioned health endpoints
	api := r.Group("/api/v1")
	{
		api.GET("/health", h.HealthCheck)
		api.GET("/ping", h.Ping)
	}
}
