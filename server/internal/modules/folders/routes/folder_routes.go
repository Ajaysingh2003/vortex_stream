package router

import (
	"github.com/ajaysingh2003/vortex-stream/internal/api/middleware"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/folders/handler"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-gonic/gin"
)

func SetupRouter(r *gin.Engine,folderHandler *handler.FolderHandler,jwtMaker *utils.JwtMaker)*gin.Engine{
	
	
	// user api
	api := r.Group("/api/v1")
	workspaces:=api.Group("/workspaces")

	 {
		workspaces.GET("/:workspaceID/folders",middleware.AuthMiddleware(jwtMaker),folderHandler.GetRootFolders)

		workspaces.GET("/:workspaceID/folder/:id",middleware.AuthMiddleware(jwtMaker),folderHandler.GetByID)

		workspaces.PATCH("/:workspaceID/folder/:id",middleware.AuthMiddleware(jwtMaker),folderHandler.UpdateFolder)
		
		workspaces.DELETE("/:workspaceID/folder/:id",middleware.AuthMiddleware(jwtMaker),folderHandler.DeleteById)

		workspaces.GET("/:workspaceID/folder/:id/breadcumb",middleware.AuthMiddleware(jwtMaker),folderHandler.GetBreadcrumbsHandler)

		workspaces.GET("/:workspaceID/folder/:id/children",middleware.AuthMiddleware(jwtMaker),folderHandler.GetChildren)

		workspaces.POST("/:workspaceID/folder/create",middleware.AuthMiddleware(jwtMaker),folderHandler.Create)

		workspaces.GET("/:workspaceID/folder/:id/content",middleware.AuthMiddleware(jwtMaker),folderHandler.GetContent)

		workspaces.GET("/:workspaceID/content-library/",middleware.AuthMiddleware(jwtMaker),folderHandler.GetRootData)

		workspaces.PATCH("/:workspaceID/folder/:id/move",middleware.AuthMiddleware(jwtMaker),folderHandler.Move) //will be taking new_parent_id as a req

	 }

	return r
}
