package services

import (
	"context"
	"fmt"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/google/uuid"

	"github.com/ajaysingh2003/vortex-stream/internal/modules/uploader/repository"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/uploader/worker"

	// "github.com/ajaysingh2003/vortex-stream/internal/modules/uploader/services"
	// sqs "github.com/ajaysingh2003/vortex-stream/internal/modules/uploader/services"
	userRpo "github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
)

type VideoInterface interface {
	ListVideo (ctx context.Context , userID uuid.UUID) ([]domain.Video,error)
	ProcessVideo (ctx context.Context,videoID uuid.UUID,userID uuid.UUID) (*domain.Video,error)
}


type VideoServiceRepo struct {
	videoRepo repository.VideoRepository
	userRepo userRpo.UserRepository
}


func NewVideoService(userRepo userRpo.UserRepository,videoRepo repository.VideoRepository)VideoInterface {
	return &VideoServiceRepo{userRepo:userRepo,videoRepo: videoRepo}
}

func (r *VideoServiceRepo) ListVideo(ctx context.Context,userID uuid.UUID) ([]domain.Video,error) {
	
	data,err:=r.videoRepo.GetByUserID(ctx,userID)

	if err!=nil {
		return nil,err
	}

	
	return  data,nil
}

func (r *VideoServiceRepo) ProcessVideo (ctx context.Context,videoID uuid.UUID , userID uuid.UUID) (*domain.Video,error){
	data,err:=r.videoRepo.GetByIdAndUserId(ctx , videoID, userID )

	if err != nil || data==nil {
		return nil, &utils.ApiError{
			Code: 400,
			Message: "Bad Request",
		}
	}

	if data.Status!="PENDING"{
		return  nil,&utils.ApiError{
			Code: 400,
			Message: fmt.Sprintf("Video is already in %s", data.Status),
		}
	}
	
	err=worker.PushVideoJob(data.VideoKey,  data.ID.String())
	
	if err != nil {
		return nil, err
	}
	
	payload:=&domain.Video{
		Workspaces: &domain.Workspaces{
			UserID: userID,
		},
		ID: data.ID,
		Status: domain.StatusQueue,
	}
	
	err=r.videoRepo.Update(ctx , payload )

	if err != nil {
		return nil, err
	}
	// fmt.Print(data,"leah jaye")
	

	return data ,nil
}