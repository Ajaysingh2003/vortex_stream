package routes

import (
	"github.com/ajaysingh2003/vortex-stream/internal/api/middleware"

	"github.com/ajaysingh2003/vortex-stream/internal/modules/form/handler"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-gonic/gin"
)



func SetupRouter(r *gin.Engine,formHandler *handler.FormHandler,jwtMaker *utils.JwtMaker)*gin.Engine{
	
	
	// user api
	api := r.Group("/api/v1")
	workspace:=api.Group("/workspace")

	 {
		workspace.POST("/:workspaceID/video/:videoID/form",middleware.AuthMiddleware(jwtMaker),formHandler.UpsertForm)
		// workspace.GET("/:workspaceId/player/settings",Playerhandler.GetPlayer)
	 }
	return r
}
