package routes

import (
	"github.com/ajaysingh2003/vortex-stream/internal/api/middleware"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/favorites/handler"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-gonic/gin"
)

func SetupRouter(r *gin.Engine, h *handler.Handler, jwtMaker *utils.JwtMaker) {
	auth := middleware.AuthMiddleware(jwtMaker)
	video := r.Group("/api/v1/favorites/videos", auth)
	video.GET("", h.ListVideos)
	video.POST("/:videoId", h.AddVideo)
	video.DELETE("/:videoId", h.RemoveVideo)
	video.GET("/:videoId/status", h.VideoStatus)
}
