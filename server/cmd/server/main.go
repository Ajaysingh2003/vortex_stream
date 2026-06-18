package main

import (
	// "context"
	"fmt"
	"log"
	"os"
	"time"

	billingHandler "github.com/ajaysingh2003/vortex-stream/internal/modules/billing/handler"
	subscriptionRepository "github.com/ajaysingh2003/vortex-stream/internal/modules/billing/repository"
	userUsageRepository "github.com/ajaysingh2003/vortex-stream/internal/modules/billing/repository"
	folderHandler "github.com/ajaysingh2003/vortex-stream/internal/modules/folders/handler"
	folderRepository "github.com/ajaysingh2003/vortex-stream/internal/modules/folders/repository"
	playerHandler "github.com/ajaysingh2003/vortex-stream/internal/modules/player/handler"
	playerRepository "github.com/ajaysingh2003/vortex-stream/internal/modules/player/repository"
	uploadHandler "github.com/ajaysingh2003/vortex-stream/internal/modules/uploader/handler"
	workspaceRepository "github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	videoHandler "github.com/ajaysingh2003/vortex-stream/internal/modules/videos/handler"
	videoRepository "github.com/ajaysingh2003/vortex-stream/internal/modules/videos/repository"

	// playerRepository "github.com/ajaysingh2003/vortex-stream/internal/modules/player/repository"

	leadFormRepository "github.com/ajaysingh2003/vortex-stream/internal/modules/form/repository"

	billingRoutes "github.com/ajaysingh2003/vortex-stream/internal/modules/billing/routes"
	billingService "github.com/ajaysingh2003/vortex-stream/internal/modules/billing/services"
	folderRoutes "github.com/ajaysingh2003/vortex-stream/internal/modules/folders/routes"
	folderService "github.com/ajaysingh2003/vortex-stream/internal/modules/folders/services"
	formService "github.com/ajaysingh2003/vortex-stream/internal/modules/form/service"
	playerRoutes "github.com/ajaysingh2003/vortex-stream/internal/modules/player/routes"
	playerService "github.com/ajaysingh2003/vortex-stream/internal/modules/player/services"
	uploadRoutes "github.com/ajaysingh2003/vortex-stream/internal/modules/uploader/routes"
	serviceUpload "github.com/ajaysingh2003/vortex-stream/internal/modules/uploader/services"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/users/handler"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	router "github.com/ajaysingh2003/vortex-stream/internal/modules/users/routes"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/users/services"
	videosRoutes "github.com/ajaysingh2003/vortex-stream/internal/modules/videos/routes"
	videoService "github.com/ajaysingh2003/vortex-stream/internal/modules/videos/services"

	formRoutes "github.com/ajaysingh2003/vortex-stream/internal/modules/form/routes"

	"github.com/ajaysingh2003/vortex-stream/internal/shared/config/db"
	config "github.com/ajaysingh2003/vortex-stream/internal/shared/config/redis"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	formHandler "github.com/ajaysingh2003/vortex-stream/internal/modules/form/handler"

	sqs "github.com/ajaysingh2003/vortex-stream/internal/shared/config/aws"
)

func main() {
	_ = godotenv.Load("")
	database := db.InitDb()
	config.InitRedis()

	sqs.InitSqs()
	secretKey := os.Getenv("JWT_SECRET_KEY")
	fmt.Print("leah", secretKey)
	if secretKey == "" {
		log.Fatal("JWT_SECRET_KEY is missing")
	}
	jwtToken := utils.NewJwtMaker(secretKey)
	playerRepo := playerRepository.NewPostgresPlayerRepository(database)
	userRepo := repository.NewPostgresUserRepository(database)
	accountRepo := repository.NewAccountRepo(database)
	videoRepo := videoRepository.NewPostgresVideoRepository(database)

	leadFormRepo := leadFormRepository.NewPostgresLeadFormRepository(database)

	leadFormFieldRepo := leadFormRepository.NewPostgresLeadFormFieldRepository(database)

	leadFormFieldOptionRepo := leadFormRepository.NewPostgresLeadFormOptionRepository(database)

	workspaceRepo := workspaceRepository.NewPostgresWorkspaceRepository(database)
	folderRepo := folderRepository.NewFolderRepo(database)
	subscriptionRepo := subscriptionRepository.NewPostgresSubscriptionRepository(database)
	userUsageRepo := userUsageRepository.NewPostgresUsageRepository(database)
	playerService := playerService.NewPlayerService(workspaceRepo, userRepo, playerRepo)
	userService := services.NewUserService(userRepo, jwtToken, workspaceRepo, database, accountRepo)
	folderService := folderService.NewFolderService(folderRepo, userRepo, workspaceRepo, videoRepo)
	workspaceService := services.NewWorkspaceService(userRepo, workspaceRepo)
	uploadService := serviceUpload.NewUploadService(userRepo)
	videoService := videoService.NewVideoService(userRepo, videoRepo, workspaceRepo, folderRepo)
	billingService := billingService.NewBillingService(userRepo, videoRepo, workspaceRepo, folderRepo, subscriptionRepo, userUsageRepo, database)

	formService := formService.NewFormService(userRepo, workspaceRepo, videoRepo,leadFormRepo, leadFormFieldRepo, leadFormFieldOptionRepo, database)


	userhandler := &handler.UserHandler{
		UserService:       userService,
		WorkspacesService: workspaceService,
		JwtToken:          jwtToken,
	}
	uploadhandler := &uploadHandler.UploadHandler{
		UploadService: uploadService,
		UserRepo:      userRepo,
	}

	playerdhandler := &playerHandler.PlayerHandler{
		PlayerService: playerService,
		// playerService:playerService,
	}

	videohandler := &videoHandler.VideoHandler{
		VideoService: videoService,
		UserRepo:     userRepo,
	}

	folderhandler := &folderHandler.FolderHandler{
		FolderService: folderService,
		UserService:   userService,
	}

	billingHandler := &billingHandler.BillingHandler{
		// BillingService: videoService,
		PaymentService: billingService,
	}

	formHandler:=&formHandler.FormHandler{
		FormService: formService,
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

	router.SetupRouter(r, userhandler, jwtToken)
	uploadRoutes.SetupRouter(r, uploadhandler, jwtToken)
	videosRoutes.SetupRouter(r, videohandler, jwtToken)
	folderRoutes.SetupRouter(r, folderhandler, jwtToken)
	billingRoutes.SetupRouter(r, *billingHandler, jwtToken)
	playerRoutes.SetupRouter(r, playerdhandler, jwtToken)
	formRoutes.SetupRouter(r , formHandler, jwtToken)

	if err := r.Run(":3000"); err != nil {
		log.Fatal("Failed to start server:", err)
	}

}
