package router

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/ajaysingh2003/vortex-stream/internal/api/middleware"
	bandwidthHandler "github.com/ajaysingh2003/vortex-stream/internal/modules/bandwidth/handler"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
)

func SetupBandwidthRouter(
	r *gin.Engine,
	bandwidthHandler *bandwidthHandler.BandwidthHandler,
	jwtMaker *utils.JwtMaker,
) *gin.Engine {
	// CORS Configuration
	r.Use(cors.New(cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// API Group
	api := r.Group("/api/v1")
	authMiddleware := middleware.AuthMiddleware(jwtMaker)

	// -----------------------------------------------------------------
	// Bandwidth Routes
	// -----------------------------------------------------------------
	bandwidth := api.Group("/bandwidth", authMiddleware)
	{
		bandwidth.GET("/overview", bandwidthHandler.GetBandwidthOverview)
	}

	return r
}