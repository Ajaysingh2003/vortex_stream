package services

import (
	"context"
	"fmt"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	workspaceRepo "github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	folderRepo "github.com/ajaysingh2003/vortex-stream/internal/modules/folders/repository"
	userRpo "github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/videos/repository"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/async/worker"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/google/uuid"
)

type VideoInterface interface {
	CreateVideo(ctx context.Context,video *domain.Video) (*domain.Video,error)
	ListVideo(ctx context.Context,userID uuid.UUID) ([]domain.Video,error)
	UpdateVideo(ctx context.Context,userID uuid.UUID,video domain.Video) error
	ProcessVideo(ctx context.Context ,videoID uuid.UUID,userID uuid.UUID) (*domain.Video,error)
}

type VideoServiceRepo struct {
	userRepo userRpo.UserRepository
	videoRepo repository.VideoRepository
	workspaceRepo  workspaceRepo.WorkshopRepository
	folderRepo  folderRepo.FolderRepository
}

func NewVideoService(userRepo userRpo.UserRepository,videoRepo repository.VideoRepository,workspaceRepo workspaceRepo.WorkshopRepository,folderRepo  folderRepo.FolderRepository) VideoInterface {
	return &VideoServiceRepo{userRepo:userRepo,videoRepo: videoRepo,workspaceRepo: workspaceRepo,folderRepo: folderRepo}
}

func (r *VideoServiceRepo) UpdateVideo(ctx context.Context,userID uuid.UUID,video domain.Video) error {

	userData,err:=r.userRepo.GetByID(ctx , userID);

	if err != nil {
		return err
	}

	workspace,err:=r.workspaceRepo.GetByID(ctx , video.WorkspaceID)

	if err != nil {
		return err
	}

	if workspace.UserID !=userData.ID{
		return  &utils.ApiError{
			Code: 403,
			Message: "You don't have permission for this action.",
		}
	}

	if video.FolderID != nil {
    // Pass *video.FolderID (single dereference) to read the underlying UUID value for the query
    folderData, err := r.folderRepo.GetByID(ctx, *video.FolderID)
    if err != nil {
        return fmt.Errorf("failed to look up target folder: %w", err)
    }
    
    if folderData == nil {
        return fmt.Errorf("specified folder does not exist")
    }
}

	fmt.Print("goint to update")
	
	err=r.videoRepo.Update(ctx,&domain.Video{
		ID: video.ID,
		Title: video.Title,
		WorkspaceID: workspace.ID,
		FolderID: video.FolderID,
	})

	if err != nil {
		return err
	}

	return  nil

}


func (r * VideoServiceRepo) CreateVideo(ctx context.Context,video *domain.Video) (*domain.Video,error) {	

	fmt.Print("data from video",video.Duration)

	workspace,err:=r.workspaceRepo.GetByID(ctx, video.WorkspaceID)
	
	if err!=nil{
		return  nil,err
	}
	existingUser,err:=r.userRepo.GetByID(ctx,workspace.UserID)
	
	if (err!=nil || existingUser ==nil) {
		return nil,err
	}

	vidData,err:=r.videoRepo.Create(ctx,video)

	if(err!=nil) {
		return nil,err
	}
	
	return vidData,nil

}

func (r *VideoServiceRepo) ListVideo(ctx context.Context,userID uuid.UUID) ([]domain.Video,error) {
	
	data,err:=r.videoRepo.GetByUserID(ctx,userID)

	if err!=nil {
		return nil,err
	}

	
	return  data,nil
}

func (r *VideoServiceRepo) ProcessVideo(ctx context.Context,videoID uuid.UUID , userID uuid.UUID) (*domain.Video,error){
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
		Workspace: &domain.Workspaces{
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