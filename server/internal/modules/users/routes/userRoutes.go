package router

import (
	// "time"
	"github.com/ajaysingh2003/vortex-stream/internal/api/middleware"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/users/handler"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"

	// "github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter(r *gin.Engine,userhandler *handler.UserHandler,jwtMaker *utils.JwtMaker)*gin.Engine{
	
	
	// user api
	api := r.Group("/api/v1")
	user:=api.Group("/users")
	oAuthApi:=user.Group("/oauth")

	 {
		user.POST("/register",userhandler.Register)
		user.POST("/verify-otp",userhandler.VerifyOTP)
		user.POST("/login",userhandler.Login)
		user.GET("/profile",middleware.AuthMiddleware(jwtMaker),userhandler.Profile)
		user.GET("/workspaces",middleware.AuthMiddleware(jwtMaker),userhandler.GetWorkspaces)
		user.POST("/workspaces/create",middleware.AuthMiddleware(jwtMaker),userhandler.CreateWorkspace)
		user.GET("/workspaces/:id", middleware.AuthMiddleware(jwtMaker),userhandler.GetWorkspace)
	 }
	 {
		oAuthApi.GET("/google",userhandler.GoogleLogin)
		oAuthApi.GET("/google/callback",userhandler.GoogleCallback)
	 }
	return r
}
