package services

import (
	"context"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	formdto "github.com/ajaysingh2003/vortex-stream/internal/modules/form/dto"
	leadformRepo "github.com/ajaysingh2003/vortex-stream/internal/modules/form/repository"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	workspaceRepo "github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	videoRepo "github.com/ajaysingh2003/vortex-stream/internal/modules/videos/repository"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/google/uuid"

	// "github.com/go-redis/redis/v8"
	// "github.com/google/uuid"
	// "golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type FormServiceInterface interface {
	Submit(ctx context.Context, videoID uuid.UUID, req *formdto.SubmitFormReq) error
	Create(ctx context.Context, data *formdto.CreateFormReq, userID uuid.UUID) error
	GetByVideoID(ctx context.Context, videoID uuid.UUID) (*domain.LeadForm, error)
	GetOverviewByWorkspaceID(ctx context.Context, workspaceID uuid.UUID, userID uuid.UUID) (*formdto.LeadFormOverviewDTO, error)
}

type formServiceRepo struct {
	userRepo          repository.UserRepository
	workspaceRepo     workspaceRepo.WorkshopRepository
	videoRepo         videoRepo.VideoRepository
	leadformRepo      leadformRepo.LeadFormRepository
	leadformfieldRepo leadformRepo.LeadFormFieldRepository
	fieldoptionRepo   leadformRepo.LeadFormOptionRepository
	db                *gorm.DB
}

func NewFormService(userRepo repository.UserRepository, workspaceRepo workspaceRepo.WorkshopRepository, videoRepo videoRepo.VideoRepository, leadformRepo leadformRepo.LeadFormRepository, leadformfieldRepo leadformRepo.LeadFormFieldRepository, fieldoptionRepo leadformRepo.LeadFormOptionRepository, db *gorm.DB) FormServiceInterface {
	return &formServiceRepo{userRepo: userRepo, workspaceRepo: workspaceRepo, videoRepo: videoRepo, leadformRepo: leadformRepo, leadformfieldRepo: leadformfieldRepo, fieldoptionRepo: fieldoptionRepo, db: db}
}

func (r *formServiceRepo) GetByVideoID(ctx context.Context, videoID uuid.UUID) (*domain.LeadForm, error) {

	videoData, err := r.videoRepo.GetByID(ctx, videoID)

	if err != nil {
		return nil, err
	}

	if videoData == nil {
		return nil, &utils.ApiError{
			Code:    404,
			Message: "Video does not exist.",
		}
	}

	formdata, err := r.leadformRepo.GetByVideoID(ctx, videoID)

	if err != nil {
		return nil, err
	}

	return formdata, nil
}

func (r *formServiceRepo) GetOverviewByWorkspaceID(ctx context.Context, workspaceID uuid.UUID, userID uuid.UUID) (*formdto.LeadFormOverviewDTO, error) {
	if _, err := r.workspaceRepo.GetWorkspaceWithUserId(ctx, workspaceID, userID); err != nil {
		return nil, err
	}

	return r.leadformRepo.GetOverviewByWorkspaceID(ctx, workspaceID, 5)
}
