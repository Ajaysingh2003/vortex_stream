package routes

import (
	"github.com/ajaysingh2003/vortex-stream/internal/api/middleware"
	analyticsHandler "github.com/ajaysingh2003/vortex-stream/internal/modules/analytics/handler"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-gonic/gin"
)

func SetupRouter(r *gin.Engine, h *analyticsHandler.AnalyticsHandler, jwtMaker *utils.JwtMaker) *gin.Engine {
	api := r.Group("/api/v1/analytics")
	api.POST("/events", h.Ingest)

	authenticated := r.Group("/api/v1/workspaces/:workspaceID/analytics", middleware.AuthMiddleware(jwtMaker))
	authenticated.GET("/overview", h.WorkspaceOverview)
	authenticated.GET("/funnel", h.WorkspaceFunnel)
	authenticated.GET("/funnel/timeseries", h.FunnelTimeSeries)

	video := r.Group("/api/v1/workspaces/:workspaceID/videos/:videoId/analytics", middleware.AuthMiddleware(jwtMaker))
	video.GET("/overview", h.VideoOverview)
	video.GET("/timeseries", h.VideoTimeSeries)
	video.GET("/retention", h.VideoRetention)
	video.GET("/technical", h.VideoTechnical)
	video.GET("/funnel", h.VideoFunnel)
	for _, group := range []*gin.RouterGroup{authenticated, video} {
		for _, kind := range []string{"summary", "series", "breakdown", "live", "concurrency", "engagement"} {
			group.GET("/"+kind, h.Dashboard(kind))
		}
	}
	authenticated.GET("/videos", h.Dashboard("video"))
	return r
}
