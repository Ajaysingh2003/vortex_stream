package router

import (
	"time"

	"github.com/ajaysingh2003/vortex-stream/internal/api/middleware"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/uploader/handler"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter(r *gin.Engine,uploadHandler *handler.UploadHandler)*gin.Engine{
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
	upload:=api.Group("/upload")
	// video:=api.Group("/video")
	 {

		 upload.POST("/presigned-url",middleware.AuthMiddleware(),uploadHandler.GetSignedUrl)
		 upload.POST("/health",uploadHandler.Health)

	 }
	 
	return r
}