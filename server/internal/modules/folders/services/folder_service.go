package services

import (
	"context"
	"fmt"
	"time"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/folders/dto"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/folders/repository"
	folderUtils "github.com/ajaysingh2003/vortex-stream/internal/modules/folders/utils"
	userRepo "github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	videoRepo "github.com/ajaysingh2003/vortex-stream/internal/modules/videos/repository"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/google/uuid"
)

type FolderServiceInterface interface {
	Create (ctx context.Context,folder *domain.Folder) (*domain.Folder , error)
	GetByID (ctx context.Context,ID uuid.UUID,workspaceID uuid.UUID) (*domain.Folder,error)
	GetRootFolders (ctx context.Context,workspaceID uuid.UUID,userID uuid.UUID) ([]domain.Folder,error)
	GetChildren (ctx context.Context,parentID uuid.UUID,workspaceID uuid.UUID) ([]domain.Folder,error)
	Relocate (ctx context.Context,folderID uuid.UUID,newParentID *uuid.UUID,workspaceID uuid.UUID) (error)
	UpdatePosition (ctx context.Context,folderID uuid.UUID,position int) (error)
	GetContent (ctx context.Context,folderID uuid.UUID,workspaceID uuid.UUID,userID uuid.UUID,cursor string,limit int) (*dto.FolderContentsDTO,error)
}

type FolderServiceRepository struct {
	folderRepo repository.FolderRepository
	userRepo  userRepo.UserRepository
	workspaceRepo userRepo.WorkshopRepository
	videoRepo  videoRepo.VideoRepository
}

func NewFolderService(folderRepo repository.FolderRepository,userRepo userRepo.UserRepository,workspaceRepo userRepo.WorkshopRepository,videoRepo videoRepo.VideoRepository) FolderServiceInterface {

	return  &FolderServiceRepository{folderRepo: folderRepo,userRepo: userRepo,workspaceRepo: workspaceRepo,videoRepo: videoRepo}
}

func (s *FolderServiceRepository) Create (ctx context.Context,folder *domain.Folder) (*domain.Folder,error) {
	
	if folder.ParentID !=nil{
		parent,err:=s.folderRepo.GetByID(ctx ,*folder.ParentID)

		if err != nil || parent.WorkspaceID !=folder.WorkspaceID {
			return nil, &utils.ApiError{400,"invalid parent folder for this workspace"}
		}
	}

	newFolder:=&domain.Folder{
			ID: uuid.New(),
			ParentID: folder.ParentID,
			Name: folder.Name,
			WorkspaceID: folder.WorkspaceID,
			Position: folder.Position,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		data,err:=s.folderRepo.Create(ctx, newFolder)

		if err != nil {
			return nil, err
		}

	return  data,nil
}

func (s *FolderServiceRepository) GetByID (ctx context.Context,ID uuid.UUID,workspaceID uuid.UUID) (*domain.Folder,error){

	folder,err:=s.folderRepo.GetByID(ctx , ID)

	if err != nil {
		return nil, err
	}


	if workspaceID!=folder.WorkspaceID {
		return  nil,&utils.ApiError{403,"you do not have permission to access this folder"}
	}

	return  folder,nil
	
}

func (s *FolderServiceRepository) GetRootFolders (ctx context.Context,workspaceID uuid.UUID,userID uuid.UUID) ([]domain.Folder,error) {

	workspace,err:=s.workspaceRepo.GetByID(ctx , workspaceID)

	if err != nil {
		return nil, err
	}

	if workspace.UserID!=userID {
		return  nil,&utils.ApiError{403,"unauthorised access to this workspace"}
	}

	folders,err:=s.folderRepo.GetRootFolders(ctx , workspaceID)

	if err != nil {
		return nil, err
	}

	return  folders,nil

}

func (s *FolderServiceRepository) GetChildren (ctx context.Context,parentID uuid.UUID,workspaceID uuid.UUID) ([]domain.Folder,error) {

	worksapce,err:=s.workspaceRepo.GetByID(ctx, workspaceID)

	if err != nil {
		return nil, err
	}

	parent,err:=s.folderRepo.GetByID(ctx , parentID)

	if err != nil || parent.WorkspaceID==worksapce.ID {
		return nil, err
	}

	foldersChildren,err:=s.folderRepo.GetChildren(ctx , parentID)

	if err != nil {
		return nil, err
	}

	return  foldersChildren,nil

}

func (s *FolderServiceRepository) Relocate (ctx context.Context,folderID uuid.UUID,newParentID *uuid.UUID,workspaceID uuid.UUID) (error){

	folder,err:=s.folderRepo.GetByID(ctx , folderID)

	if err != nil {
		return err
	}


	workspace,err:=s.workspaceRepo.GetByID(ctx, workspaceID)

	if err != nil || folder.WorkspaceID != workspace.ID {
		fmt.Print(err)
		return &utils.ApiError{ Code: 404, Message:"workspace not found"}
	}

	if newParentID !=nil {
		isLoop, err := folderUtils.IsDescendant(ctx, folderID, *newParentID, s.folderRepo.GetByID)

		if err != nil {
			return  err
		}

		if isLoop {
			return  &utils.ApiError{Code:400,Message:"cannot move folder into its own subfolder"}
		}

	}

	err=s.folderRepo.Move(ctx, folderID, newParentID)
	
	if err != nil {
		return err
	}

	return  nil
}


func (s *FolderServiceRepository) UpdatePosition (ctx context.Context,folderID uuid.UUID,position int) error{

	err:=s.folderRepo.UpdatePosition(ctx , folderID, position)

	if err != nil {
		return err
	}
	return  nil
}


func (s *FolderServiceRepository) GetContent (ctx context.Context,folderID uuid.UUID,workspaceID uuid.UUID,userID uuid.UUID,cursor string,limit int) (*dto.FolderContentsDTO,error) {
	// checking ownershop of the user

	isOwned,err:=s.userRepo.IsOwned(ctx , workspaceID, userID)

	if err != nil {
		return nil, err
	}

	if !isOwned {
		return  nil,&utils.ApiError{Code: 403,Message: "You Don't have Permission to Access the Content. "}
	}

	folder,err:=s.folderRepo.GetByID(ctx, folderID)

	if err != nil {
		fmt.Print(err)
		return nil, &utils.ApiError{Code: 404, Message: "Folder not found"}
	}

	if folder!=nil || folder.WorkspaceID!=folderID {
			return nil, &utils.ApiError{Code: 403, Message: "Access Denied"}
	}

	cursorType,cursorID,err:=utils.DecodeCursor(cursor)

	if err != nil {
		fmt.Print(err)
		return nil, &utils.ApiError{Code: 400, Message: "Invalid cursor"}
	}

	fetchLimit:=limit+1

	var items []dto.ContentItemDTO
	// first folder will be rendering first
	if cursorType !="video"{
		
		var afterID *uuid.UUID

		if cursorType=="folder"{
			afterID=cursorID
		}

		//fetching folder children

		folders,err:=s.folderRepo.GetChildrenPaginated(ctx, folderID, workspaceID, afterID, fetchLimit)

		if err != nil {
			 return nil, &utils.ApiError{Code: 500, Message: "Failed to fetch folders"}
		}

		for _,f := range folders {
			f:=f

			childCount, _ := s.folderRepo.CountChildren(ctx, f.ID)

			count:=int(childCount)

			pos := f.Position

			items= append(items, dto.ContentItemDTO{
				ID: f.ID,
				Name: f.Name,
				Type: "folder",
				Position: &pos,
				ChildCount: &count,
				CreatedAt: f.CreatedAt,
			})
		}

	}

	// fill remaining space with the videos

	if len(items) < fetchLimit {
		var afterID *uuid.UUID

		if cursorType=="video"{
			afterID=cursorID
		}

		remaining := fetchLimit - len(items)

		videos,err:=s.videoRepo.GetByFolderIdPaginated(ctx, &folderID, afterID, remaining)
		
		if err != nil {
			fmt.Print(err)
			return nil, &utils.ApiError{Code: 500, Message: "Failed to fetch videos"}
		}

		for _ , v:= range videos{
			v := v

			items = append(items, dto.ContentItemDTO{
				 ID:           v.ID,
                Name:         v.Title,
                Type:         "video",
                ThumbnailURL: v.Thumbnail,
                Duration:     &v.Duration,
                CreatedAt:    v.CreatedAt,
			})
		}
	}

	hasNextPage:=len(items) > limit

		if hasNextPage {
        items = items[:limit]
    	}

		var nextCursor string

		if hasNextPage && len(items) > 0 {
			last := items[len(items)-1]
			nextCursor = utils.EncodeCursor(last.Type, last.ID)
		}

		folderCount, _ := s.folderRepo.CountChildren(ctx, folderID)
    	videoCount, _ := s.videoRepo.CountByFolderID(ctx, folderID)

		metaData:=dto.Metadata{
			HasNextPage: hasNextPage,
			NextCursor: nextCursor,	
			Total: folderCount+videoCount,
		}
		return &dto.FolderContentsDTO{
        Items:       items,
		Metadata: metaData,
    }, nil
}


