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
		// Part 2 advanced routes
		group.GET("/ctas", h.CTAs)
		group.GET("/chapters", h.Chapters)
		group.GET("/captions", h.Captions)
		group.GET("/heatmap", h.Heatmap)
		group.GET("/funnels", h.Funnels)
		group.GET("/lead-attribution", h.LeadAttribution)
		group.GET("/session-metrics", h.SessionMetrics)
		group.GET("/quality", h.Quality)

		group.POST("/exports", h.CreateExport)
		group.GET("/exports/:exportId", h.GetExport)
		group.GET("/exports/:exportId/download", h.DownloadExport)
		group.DELETE("/exports/:exportId", h.CancelExport)
	}
	authenticated.GET("/videos", h.Dashboard("video"))
	return r
}
