package main

import (
	// "context"
	"fmt"
	"log"
	"os"
	"time"

	uploadHandler "github.com/ajaysingh2003/vortex-stream/internal/modules/uploader/handler"
	videoHandler "github.com/ajaysingh2003/vortex-stream/internal/modules/videos/handler"
	videoRepository "github.com/ajaysingh2003/vortex-stream/internal/modules/videos/repository"
	workspaceRepository "github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	uploadRoutes "github.com/ajaysingh2003/vortex-stream/internal/modules/uploader/routes"
	videosRoutes "github.com/ajaysingh2003/vortex-stream/internal/modules/videos/routes"
	serviceUpload "github.com/ajaysingh2003/vortex-stream/internal/modules/uploader/services"
	videoService "github.com/ajaysingh2003/vortex-stream/internal/modules/videos/services"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/users/handler"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	router "github.com/ajaysingh2003/vortex-stream/internal/modules/users/routes"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/users/services"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/config/db"
	config "github.com/ajaysingh2003/vortex-stream/internal/shared/config/redis"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	sqs "github.com/ajaysingh2003/vortex-stream/internal/shared/config/aws"
)

func main() {
	_ = godotenv.Load("")
	database:= db.InitDb()
	config.InitRedis()
	
	sqs.InitSqs()
	secretKey := os.Getenv("JWT_SECRET_KEY")
	fmt.Print("leah",secretKey)
	if secretKey == "" {
		log.Fatal("JWT_SECRET_KEY is missing")
	}
	
	userRepo:=repository.NewPostgresUserRepository(database)
	accountRepo:=repository.NewAccountRepo(database)
	videoRepo:=videoRepository.NewPostgresVideoRepository(database)
	workspaceRepo:=workspaceRepository.NewPostgresWorkspaceRepository(database)
	jwtToken := utils.NewJwtMaker(secretKey)
	userService:=services.NewUserService(userRepo,jwtToken,workspaceRepo,database,accountRepo)

	workspaceService:=services.NewWorkspaceService(userRepo,workspaceRepo);
	uploadService:=serviceUpload.NewUploadService(userRepo)
	videoService:=videoService.NewVideoService(userRepo,videoRepo,workspaceRepo)
	
	userhandler:=&handler.UserHandler{
		UserService :userService,
		WorkspacesService: workspaceService,
		JwtToken : jwtToken,
	}
	uploadhandler:=&uploadHandler.UploadHandler{
		 UploadService: uploadService,
		 UserRepo: userRepo,
	}
	
	videohandler:=&videoHandler.VideoHandler{
		VideoService:videoService,
		UserRepo: userRepo,
	}

	r := gin.Default()
	
	r.Use(cors.New(cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	router.SetupRouter(r,userhandler)
	uploadRoutes.SetupRouter(r,uploadhandler)
	videosRoutes.SetupRouter(r,videohandler)


	if err := r.Run(":3000"); err != nil {
		log.Fatal("Failed to start server:", err)
	}


}
