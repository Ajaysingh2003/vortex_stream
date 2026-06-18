package services

import (
	"context"
	"fmt"

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
	Create(ctx context.Context, data *formdto.CreateFormReq,userID uuid.UUID) error
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

func NewFormService(userRepo repository.UserRepository, workspaceRepo workspaceRepo.WorkshopRepository, videoRepo  videoRepo.VideoRepository,leadformRepo leadformRepo.LeadFormRepository, leadformfieldRepo leadformRepo.LeadFormFieldRepository, fieldoptionRepo leadformRepo.LeadFormOptionRepository, db *gorm.DB) FormServiceInterface {
	return &formServiceRepo{userRepo: userRepo, workspaceRepo: workspaceRepo, videoRepo: videoRepo ,leadformRepo: leadformRepo, leadformfieldRepo: leadformfieldRepo, fieldoptionRepo: fieldoptionRepo, db: db}
}

func (r *formServiceRepo) Create(ctx context.Context, data *formdto.CreateFormReq,userID uuid.UUID) error {

	// guard 

	fmt.Print(data.WorkspaceID,data.VideoID,"kira queen")
	workspaceData, err := r.workspaceRepo.GetByID(ctx, data.WorkspaceID)

	if err != nil {
		return err
	}

	if workspaceData == nil {
		return &utils.ApiError{Code: 404, Message: "Workspace not found."}
	}

	videoData, err := r.videoRepo.GetByID(ctx, data.VideoID)

	if err != nil {
		return err
	}

	fmt.Print(videoData,"kira queen")

	if videoData.WorkspaceID != workspaceData.ID {
		return &utils.ApiError{
			Code:    400,
			Message: "Invalid request",
		}
	}

	err = r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {

		leadFormpayload := &domain.LeadForm{
			ID:        data.ToEntity().ID,
			VideoID:   videoData.ID,
			Placement: data.Placement,
			ShowAt:    data.ShowAt,
			AllowSkip: data.AllowSkip,
		}

		formdata, err := r.leadformRepo.UpsertTx(ctx, tx, leadFormpayload)

		if err != nil {
			return err
		}

		// formEntity := data.ToEntity()
		fieldEntities := data.ToFieldEntities(formdata.ID)
		_, err = r.leadformfieldRepo.UpsertTx(ctx, tx, fieldEntities)

		if err != nil {
			return err
		}
		
		// optionPayload:=&domain.LeadFormFieldOption{}

		optionEntities := formdto.ToOptionEntities(fieldEntities)

		if len(optionEntities) > 0 {
			_,err:=r.fieldoptionRepo.UpsertTx(ctx , tx , optionEntities)

			if err != nil {
				return err
			}
		}

		

		// userData = data

		return nil

	})


	if err != nil {
		return err
	}
	return  nil
}
