package routes

import (
	"github.com/ajaysingh2003/vortex-stream/internal/api/middleware"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/channels/handler"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-gonic/gin"
)

func SetupRouter(r *gin.Engine, h *handler.Handler, jwt *utils.JwtMaker) {
	group := r.Group("/api/v1/channels", middleware.AuthMiddleware(jwt))
	group.POST("", h.Create)
	group.GET("", h.List)
	group.GET("/:channelId", h.Get)
	group.PATCH("/:channelId", h.Update)
	group.DELETE("/:channelId", h.Delete)
	group.GET("/:channelId/videos", h.ListVideos)
	group.POST("/:channelId/videos/:videoId", h.AddVideo)
	group.DELETE("/:channelId/videos/:videoId", h.RemoveVideo)
}
