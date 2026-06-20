// video router
package router


import (
	"time"

	"github.com/ajaysingh2003/vortex-stream/internal/api/middleware"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/videos/handler"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter(r *gin.Engine, videohandler *handler.VideoHandler,jwtMaker *utils.JwtMaker)*gin.Engine{
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
	video:=api.Group("/video")
	 {
		video.POST("/create",middleware.AuthMiddleware(jwtMaker),videohandler.CreateVideo)
		video.GET("/list",middleware.AuthMiddleware(jwtMaker),videohandler.ListVideo)
		video.GET("/:videoId",videohandler.GetByVideoID)
		video.POST("/process/:videoId",middleware.AuthMiddleware(jwtMaker),videohandler.Process)
		video.PATCH("/:id/update/name", middleware.AuthMiddleware(jwtMaker),videohandler.UpdateVideo)
		api.PATCH("/workspace/:workspaceId/video/:id/update", middleware.AuthMiddleware(jwtMaker),videohandler.UpdateVideoMetaData)
		api.GET("/workspace/:workspaceId/video/:id/", middleware.AuthMiddleware(jwtMaker),videohandler.GetVideoMetaData)
		api.GET("/workspace/:workspaceId/video/video-list/", middleware.AuthMiddleware(jwtMaker),videohandler.ListVideoByWorkspace)
	 }
	 
	return r
}

