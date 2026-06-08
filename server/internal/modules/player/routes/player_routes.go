package routes

import (
	"github.com/ajaysingh2003/vortex-stream/internal/api/middleware"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/player/handler"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-gonic/gin"
)



func SetupRouter(r *gin.Engine,Playerhandler *handler.PlayerHandler,jwtMaker *utils.JwtMaker)*gin.Engine{
	
	
	// user api
	api := r.Group("/api/v1")
	workspace:=api.Group("/workspace")

	 {
		workspace.PATCH("/:workspaceID/player/settings",middleware.AuthMiddleware(jwtMaker),Playerhandler.UpdatePlayer)
		workspace.GET("/:workspaceID/player/settings",Playerhandler.GetPlayer)
	 }
	return r
}
