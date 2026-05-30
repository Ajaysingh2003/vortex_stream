package main

import (
	// "context"
	"fmt"
	"log"
	"os"
	"time"

	uploadHandler "github.com/ajaysingh2003/vortex-stream/internal/modules/uploader/handler"
	videoHandler "github.com/ajaysingh2003/vortex-stream/internal/modules/videos/handler"
	folderHandler "github.com/ajaysingh2003/vortex-stream/internal/modules/folders/handler"
	videoRepository "github.com/ajaysingh2003/vortex-stream/internal/modules/videos/repository"
	workspaceRepository "github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	folderRepository "github.com/ajaysingh2003/vortex-stream/internal/modules/folders/repository"
	uploadRoutes "github.com/ajaysingh2003/vortex-stream/internal/modules/uploader/routes"
	videosRoutes "github.com/ajaysingh2003/vortex-stream/internal/modules/videos/routes"
	folderRoutes "github.com/ajaysingh2003/vortex-stream/internal/modules/folders/routes"
	serviceUpload "github.com/ajaysingh2003/vortex-stream/internal/modules/uploader/services"
	videoService "github.com/ajaysingh2003/vortex-stream/internal/modules/videos/services"
	folderService "github.com/ajaysingh2003/vortex-stream/internal/modules/folders/services"
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
	jwtToken := utils.NewJwtMaker(secretKey)
	
	userRepo:=repository.NewPostgresUserRepository(database)
	accountRepo:=repository.NewAccountRepo(database)
	videoRepo:=videoRepository.NewPostgresVideoRepository(database)
	workspaceRepo:=workspaceRepository.NewPostgresWorkspaceRepository(database)
	folderRepo:=folderRepository.NewFolderRepo(database)
	
	userService:=services.NewUserService(userRepo,jwtToken,workspaceRepo,database,accountRepo)
	folderService:=folderService.NewFolderService(folderRepo, userRepo, workspaceRepo, videoRepo)
	workspaceService:=services.NewWorkspaceService(userRepo,workspaceRepo);
	uploadService:=serviceUpload.NewUploadService(userRepo)
	videoService:=videoService.NewVideoService(userRepo,videoRepo,workspaceRepo,folderRepo)
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

	folderhandler:=&folderHandler.FolderHandler{
		FolderService:folderService,
		UserService: userService,
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

	router.SetupRouter(r,userhandler,jwtToken)
	uploadRoutes.SetupRouter(r,uploadhandler,jwtToken)
	videosRoutes.SetupRouter(r,videohandler,jwtToken)
	folderRoutes.SetupRouter(r,folderhandler,jwtToken)


	if err := r.Run(":3000"); err != nil {
		log.Fatal("Failed to start server:", err)
	}


}
