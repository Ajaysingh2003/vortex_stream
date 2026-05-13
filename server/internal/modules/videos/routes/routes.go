
package router

import (
	"time"

	"github.com/ajaysingh2003/vortex-stream/internal/api/middleware"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/videos/handler"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter(r *gin.Engine, videohandler *handler.VideoHandler)*gin.Engine{
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
		
		 video.POST("/create",middleware.AuthMiddleware(),videohandler.CreateVideo)
		 video.GET("/list",middleware.AuthMiddleware(),videohandler.ListVideo)
		 video.POST("/process/:videoId",middleware.AuthMiddleware(),videohandler.Process)
		
	 }
	 
	return r
}