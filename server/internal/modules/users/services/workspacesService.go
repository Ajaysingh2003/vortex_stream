package services

import (
	"context"
	"errors"
	"fmt"
	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	"github.com/google/uuid"
)

type WorkspaceServiceInterface interface {
	Create(ctx context.Context,Workspace *domain.Workspaces) (*domain.Workspaces,error)
	GetByUserID(ctx context.Context,userId uuid.UUID) ([]domain.Workspaces,error)
	GetDefaultWorkspace(ctx context.Context,userID uuid.UUID) (*domain.Workspaces,error)
	GetWorkspace(ctx context.Context,id uuid.UUID, userId uuid.UUID) (*domain.Workspaces,error)
}

type WorkspaceRepo struct {
	userRepo repository.UserRepository
	workspaceRepo repository.WorkshopRepository
}

func NewWorkspaceService(userRepo repository.UserRepository , workspaceRepo repository.WorkshopRepository)WorkspaceServiceInterface {
	return &WorkspaceRepo{userRepo:userRepo,workspaceRepo: workspaceRepo}
}

func (r *WorkspaceRepo) Create(ctx context.Context , workspace *domain.Workspaces) (*domain.Workspaces,error) {
	
	if r.workspaceRepo == nil {
        return nil, fmt.Errorf("workspace repository is not initialized")
    }
	if workspace.Name == "" {
        return nil, errors.New("workspace name is required")
    }

	// will be checking the user plan before createing workspace

	fmt.Print(workspace,"leah jaye")

	data,err:=r.workspaceRepo.Create(ctx , workspace)

	fmt.Print(data,"leah goti")
	if err!=nil{
		return  nil,err
	}

	return  data,nil
}

func (r *WorkspaceRepo) GetByUserID (ctx context.Context,userId uuid.UUID) ([]domain.Workspaces,error){

	_,err:=r.userRepo.GetByID(ctx, userId)

	if err != nil {
		return nil, err
	}

	data,err:=r.workspaceRepo.GetByUserID(ctx, userId)

	if err != nil {
		return nil, err
	}

	return  data,nil


}

func (r *WorkspaceRepo) GetDefaultWorkspace (ctx context.Context,userID uuid.UUID) (*domain.Workspaces,error){


	data,err:=r.workspaceRepo.GetDefaultWorkspace(ctx, userID)

	if err != nil {
		return nil, err
	}

	return  data,nil
}

func ( r *WorkspaceRepo) GetWorkspace (ctx context.Context,id uuid.UUID,userId uuid.UUID) (*domain.Workspaces,error) {
	// currently just add the user id access level but sinces workspace can be access by api key and email invite we might have to handle it by another guard like manage_access or many email ids
	data,err:=r.workspaceRepo.GetWorkspaceWithUserId(ctx, id , userId)

	if err!=nil {
		return nil,err
	}

	return  data,nil
}

