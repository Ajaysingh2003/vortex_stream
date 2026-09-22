package routes

import (
	"github.com/ajaysingh2003/vortex-stream/internal/api/middleware"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/form/handler"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-gonic/gin"
)

func SetupRouter(r *gin.Engine, formHandler *handler.FormHandler, jwtMaker *utils.JwtMaker) *gin.Engine {

	api := r.Group("/api/v1")
	workspace := api.Group("/workspace")
	workspaceForms := api.Group("/workspace/:workspaceId/forms")

	{

		workspace.POST("/:workspaceId/video/:id/form", middleware.AuthMiddleware(jwtMaker), formHandler.UpsertForm)
		workspaceForms.GET("/overview", middleware.AuthMiddleware(jwtMaker), formHandler.GetOverview)

		api.GET("/video/:videoId/form", formHandler.GetByVideoID)
		api.POST("/video/:videoId/form/submissions", formHandler.Submit)

	}

	return r
}
