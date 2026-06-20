package services

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
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
	Create(ctx context.Context, folder *domain.Folder) (*domain.Folder, error)
	GetByID(ctx context.Context, ID uuid.UUID, workspaceID uuid.UUID) (*domain.Folder, error)
	GetRootFolders(ctx context.Context, workspaceID uuid.UUID, userID uuid.UUID) ([]domain.Folder, error)
	GetChildren(ctx context.Context, parentID uuid.UUID, workspaceID uuid.UUID, userID uuid.UUID) ([]domain.Folder, error)
	Relocate(ctx context.Context, folderID uuid.UUID, newParentID *uuid.UUID, workspaceID uuid.UUID) error
	UpdatePosition(ctx context.Context, folderID uuid.UUID, position int) error
	GetContent(ctx context.Context, folderID uuid.UUID, workspaceID uuid.UUID, userID uuid.UUID, cursor string, limit int) (*dto.FolderContentsDTO, error)
	GetRootData(ctx context.Context, workspaceID uuid.UUID, userID uuid.UUID, cursor string, limit int) (*dto.FolderContentsDTO, error)
	GetFolderBreadcrumbs(ctx context.Context, folderID uuid.UUID, workspaceID uuid.UUID, userID uuid.UUID) ([]domain.Folder, error)
	DeleteByIDAndWorkspaceID(ctx context.Context,folderID uuid.UUID,workspaceID uuid.UUID, userID uuid.UUID) (error)
	UpdateFolder(ctx context.Context,ID uuid.UUID,userID uuid.UUID,workspaceID uuid.UUID,payload dto.UpdateFolderRequest) (error)
}

type FolderServiceRepository struct {
	folderRepo    repository.FolderRepository
	userRepo      userRepo.UserRepository
	workspaceRepo userRepo.WorkshopRepository
	videoRepo     videoRepo.VideoRepository
}

func NewFolderService(folderRepo repository.FolderRepository, userRepo userRepo.UserRepository, workspaceRepo userRepo.WorkshopRepository, videoRepo videoRepo.VideoRepository) FolderServiceInterface {

	return &FolderServiceRepository{folderRepo: folderRepo, userRepo: userRepo, workspaceRepo: workspaceRepo, videoRepo: videoRepo}
}


func (s *FolderServiceRepository) UpdateFolder (ctx context.Context,ID uuid.UUID,userID uuid.UUID,workspaceID uuid.UUID,payload dto.UpdateFolderRequest) (error) {
	userData,err:=s.userRepo.GetByID(ctx , userID);

	if err != nil {
		return err
	}

	workspace,err:=s.workspaceRepo.GetByID(ctx , workspaceID)

	if err != nil {
		return err
	}

	if workspace.UserID !=userData.ID{
		return  &utils.ApiError{
			Code: 403,
			Message: "You don't have permission for this action.",
		}
	}

	folderData,err:=s.folderRepo.GetByID(ctx, ID)

	if err != nil {
		return err
	}

	if folderData ==nil{
		return  &utils.ApiError{
			Code: 404,
			Message: "The Folder might have Deleted.",
		}
	}

	exist, err := s.folderRepo.CheckDuplicateName(ctx, payload.Name, folderData.ParentID, workspace.ID)

	if err != nil {
		// 1. Catch database connection or syntax errors
		return err
	}

	if exist {
		// 2. Catch business logic validation errors explicitly
		return &utils.ApiError{
			Code:    400,
			Message: "A Folder With This Name Already Exists In This Location",
		}
	}

	err=s.folderRepo.UpdateFolder(ctx ,folderData.ID,workspace.ID,domain.Folder{
		Name: payload.Name,
		WorkspaceID: workspace.ID,
	})

	if err != nil {
		return err
	}

	return  nil
}

func (s *FolderServiceRepository) DeleteByIDAndWorkspaceID (ctx context.Context,folderID uuid.UUID,workspaceID uuid.UUID,userID uuid.UUID) (error){
	userData,err:=s.userRepo.GetByID(ctx, userID)

	if err != nil {
		return err
	}
	if userData == nil{
		return  &utils.ApiError{ Code: 404, Message: "User Not Found"}
	}
	worksapce,err:=s.workspaceRepo.GetByID(ctx, workspaceID)

	if err != nil {
		return err
	}

	if worksapce == nil {
		return  &utils.ApiError{
			Code: 404,
			Message: "The Workspace has already deleted.",
		}
	}

	if worksapce.UserID != userData.ID {
		return  &utils.ApiError{
			Code: 403,
			Message: "You don't have Permission for this action.",
		}
	}

	err=s.folderRepo.Delete(ctx, folderID)

	if err != nil {
		return err
	}

	return nil
}

func (s *FolderServiceRepository) Create (ctx context.Context, folder *domain.Folder) (*domain.Folder, error) {
	exist, err := s.folderRepo.CheckDuplicateName(ctx, folder.Name, folder.ParentID, folder.WorkspaceID)

	if err != nil {
		// 1. Catch database connection or syntax errors
		return nil, err
	}

	if exist {
		// 2. Catch business logic validation errors explicitly
		return nil, &utils.ApiError{
			Code:    400,
			Message: "A Folder With This Name Already Exists In This Location",
		}
	}
	if folder.ParentID != nil {
		parent, err := s.folderRepo.GetByID(ctx, *folder.ParentID)

		if err != nil || parent.WorkspaceID != folder.WorkspaceID {
			return nil, &utils.ApiError{400, "invalid parent folder for this workspace"}
		}
	}

	newFolder := &domain.Folder{
		ID:          uuid.New(),
		ParentID:    folder.ParentID,
		Name:        folder.Name,
		WorkspaceID: folder.WorkspaceID,
		Position:    folder.Position,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	data, err := s.folderRepo.Create(ctx, newFolder)

	if err != nil {
		return nil, err
	}

	return data, nil
}

func (s *FolderServiceRepository) GetByID (ctx context.Context, ID uuid.UUID, workspaceID uuid.UUID) (*domain.Folder, error) {

	folder, err := s.folderRepo.GetByID(ctx, ID)

	if err != nil {
		return nil, err
	}

	if workspaceID != folder.WorkspaceID {
		return nil, &utils.ApiError{403, "you do not have permission to access this folder"}
	}

	return folder, nil

}

func (s *FolderServiceRepository) GetRootFolders (ctx context.Context, workspaceID uuid.UUID, userID uuid.UUID) ([]domain.Folder, error) {

	workspace, err := s.workspaceRepo.GetByID(ctx, workspaceID)

	if err != nil {
		return nil, err
	}

	if workspace.UserID != userID {
		return nil, &utils.ApiError{403, "unauthorised access to this workspace"}
	}

	folders, err := s.folderRepo.GetRootFolders(ctx, workspaceID)

	if err != nil {
		return nil, err
	}

	return folders, nil

}

func (s *FolderServiceRepository) GetChildren (ctx context.Context, parentID uuid.UUID, workspaceID uuid.UUID, userID uuid.UUID) ([]domain.Folder, error) {

	workspace, err := s.workspaceRepo.GetByID(ctx, workspaceID)

	if err != nil {
		return nil, err
	}

	if workspace.UserID != userID {
		return nil, &utils.ApiError{Code: 403, Message: "unauthorised access to this workspace"}
	}

	parent, err := s.folderRepo.GetByID(ctx, parentID)

	if err != nil {
		return nil, err
	}

	if parent.WorkspaceID != workspace.ID {
		return nil, &utils.ApiError{Code: 403, Message: "This folder does not belong to this workspace"}
	}

	foldersChildren, err := s.folderRepo.GetChildren(ctx, parentID)

	if err != nil {
		return nil, err
	}

	fmt.Print("leah goti", foldersChildren)

	return foldersChildren, nil

}

func (s *FolderServiceRepository) Relocate (ctx context.Context, folderID uuid.UUID, newParentID *uuid.UUID, workspaceID uuid.UUID) error {

	folder, err := s.folderRepo.GetByID(ctx, folderID)

	if err != nil {
		return err
	}

	workspace, err := s.workspaceRepo.GetByID(ctx, workspaceID)

	if err != nil || folder.WorkspaceID != workspace.ID {
		fmt.Print(err)
		return &utils.ApiError{Code: 404, Message: "workspace not found"}
	}

	if newParentID != nil {
		isLoop, err := folderUtils.IsDescendant(ctx, folderID, *newParentID, s.folderRepo.GetByID)

		if err != nil {
			return err
		}

		if isLoop {
			return &utils.ApiError{Code: 400, Message: "cannot move folder into its own subfolder"}
		}

	}

	err = s.folderRepo.Move(ctx, folderID, newParentID)

	if err != nil {
		return err
	}

	return nil
}

func (s *FolderServiceRepository) UpdatePosition (ctx context.Context, folderID uuid.UUID, position int) error {

	err := s.folderRepo.UpdatePosition(ctx, folderID, position)

	if err != nil {
		return err
	}
	return nil
}

func (s *FolderServiceRepository) GetContent (ctx context.Context, folderID uuid.UUID, workspaceID uuid.UUID, userID uuid.UUID, cursor string, limit int) (*dto.FolderContentsDTO, error) {
	// 1. Check workspace ownership parameters
	isOwned, err := s.userRepo.IsOwned(ctx, workspaceID, userID)
	if err != nil {
		return nil, err
	}
	if !isOwned {
		return nil, &utils.ApiError{Code: 403, Message: "You Don't have Permission to Access the Content."}
	}

	// 2. Fetch the current target folder metadata profile
	folder, err := s.folderRepo.GetByID(ctx, folderID)
	if err != nil {
		fmt.Println("Error fetching folder ID metadata context:", err)
		return nil, &utils.ApiError{Code: 404, Message: "Folder not found"}
	}

	// 💡 FIX 1: Correct pointer assessment rules to prevent unexpected security blocks or nil pointer panics
	if folder == nil || folder.WorkspaceID != workspaceID {
		return nil, &utils.ApiError{Code: 403, Message: "Access Denied"}
	}

	// 3. Initialize and decode cursor tracking variables
	var cursorType string
	var cursorID *uuid.UUID

	// 💡 FIX 2: Guard rail against blank cursor decoding failures on first page initialization requests
	if cursor != "" {
		cursorType, cursorID, err = utils.DecodeCursor(cursor)
		if err != nil {
			fmt.Println("Cursor decoding error:", err)
			return nil, &utils.ApiError{Code: 400, Message: "Invalid cursor format"}
		}
	} else {
		cursorType = "root"
		cursorID = nil
	}

	fetchLimit := limit + 1
	// var items []dto.ContentItemDTO
	items := make([]dto.ContentItemDTO, 0)

	// 4. PHASE 1: Fetch nested directory sub-folders first
	if cursorType != "video" {
		var afterID *uuid.UUID
		if cursorType == "folder" {
			afterID = cursorID
		}

		folders, err := s.folderRepo.GetChildrenPaginated(ctx, &folderID, workspaceID, afterID, fetchLimit)
		if err != nil {
			return nil, &utils.ApiError{Code: 500, Message: "Failed to fetch folders"}
		}

		for _, f := range folders {
			f := f // Pin range scope variable safely

			childCount, _ := s.folderRepo.CountChildren(ctx, &f.ID)
			count := int(childCount)
			pos := f.Position

			items = append(items, dto.ContentItemDTO{
				ID:         f.ID,
				Name:       f.Name,
				Type:       "folder",
				Position:   &pos,
				ChildCount: &count,
				ParentID: &f.ParentID,
				CreatedAt:  f.CreatedAt,
			})
		}
	}

	// 5. PHASE 2: Fill remaining page slots with folder videos
	if len(items) < fetchLimit {
		afterIDStr := ""
		if cursorType == "video" && cursorID != nil {
			afterIDStr = cursorID.String()
		}

		remaining := fetchLimit - len(items)

		// 💡 FIX 3: Pass your dynamically extracted afterIDStr variable down instead of hardcoding ""
		videos, err := s.videoRepo.GetByFolderIdPaginated(ctx, &folderID, workspaceID ,afterIDStr, remaining)
		if err != nil {
			fmt.Printf("Error querying nested folder video payloads: %v\n", err)
			return nil, &utils.ApiError{Code: 500, Message: "Failed to fetch videos"}
		}

		for _, v := range videos {
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

	// 6. PHASE 3: Calculate dynamic metadata page metrics
	hasNextPage := len(items) > limit
	if hasNextPage {
		items = items[:limit]
	}

	var nextCursor string
	if hasNextPage && len(items) > 0 {
		last := items[len(items)-1]
		nextCursor = utils.EncodeCursor(last.Type, last.ID)
	}

	// Calculate child item volume metrics totals
	folderCount, _ := s.folderRepo.CountChildren(ctx, &folderID)

	// 💡 FIX 4: Dereference folderID to plain uuid.UUID to match the repository method signature requirements
	videoCount, _ := s.videoRepo.CountByFolderID(ctx, &folderID)

	metaData := dto.Metadata{
		HasNextPage: hasNextPage,
		NextCursor:  nextCursor,
		Total:       folderCount + videoCount,
	}

	return &dto.FolderContentsDTO{
		Items:    items,
		Metadata: metaData,
	}, nil
}

func (s *FolderServiceRepository) GetFolderBreadcrumbs (ctx context.Context, folderID uuid.UUID, workspaceID uuid.UUID, userID uuid.UUID) ([]domain.Folder, error) {

	// 1. Validate Workspace existence and user authorization
	workspace, err := s.workspaceRepo.GetByID(ctx, workspaceID)
	if err != nil {
		return nil, err
	}

	if workspace.UserID != userID {
		return nil, &utils.ApiError{Code: 403, Message: "unauthorised access to this workspace"}
	}

	// 2. Fetch the recursive ancestor line from the repository
	ancestors, err := s.folderRepo.GetAncestors(ctx, folderID)
	if err != nil {
		return nil, err
	}

	// 3. Double-check that the target chain actually belongs to this workspace
	// (Protects against cross-tenant ID injection attacks)
	if len(ancestors) > 0 && ancestors[0].WorkspaceID != workspace.ID {
		return nil, &utils.ApiError{Code: 400, Message: "folder sequence does not belong to this workspace"}
	}

	// 4. Force empty slice declaration instead of returning nil if data array is empty
	if ancestors == nil {
		ancestors = []domain.Folder{}
	}

	return ancestors, nil
}

// func (s *FolderServiceRepository) GetRootData (ctx context.Context,workspaceID uuid.UUID,userID uuid.UUID,cursor string,limit int) (*dto.FolderContentsDTO,error) {
// 	// checking ownershop of the user

// 	isOwned,err:=s.userRepo.IsOwned(ctx , workspaceID, userID)

// 	if err != nil {
// 		return nil, err
// 	}

// 	if !isOwned {
// 		return  nil,&utils.ApiError{Code: 403,Message: "You Don't have Permission to Access the Content. "}
// 	}

// 	var cursorType string
// 	var cursorID *uuid.UUID

// 	if cursor != "" {
//     cursorType, cursorID, err = utils.DecodeCursor(cursor)
//     if err != nil {
//         fmt.Println("Cursor decoding error:", err)
//         return nil, &utils.ApiError{Code: 400, Message: "Invalid cursor format"}
//     }
// 		} else {

//     cursorType = "root"
//     cursorID = nil // or blank string depending on your types
// 	}

// 	fetchLimit:=limit+1

// 	var items []dto.ContentItemDTO
// 	// first folder will be rendering first
// 	if cursorType !="video"{

// 		var afterID *uuid.UUID

// 		if cursorType=="folder"{
// 			afterID=cursorID
// 		}

// 		//fetching folder children

// 		folders,err:=s.folderRepo.GetChildrenPaginated(ctx, nil, workspaceID, afterID, fetchLimit)

// 		if err != nil {
// 			 return nil, &utils.ApiError{Code: 500, Message: "Failed to fetch folders"}
// 		}

// 		for _,f := range folders {
// 			f:=f

// 			childCount, _ := s.folderRepo.CountChildren(ctx, &f.ID)

// 			count:=int(childCount)

// 			pos := f.Position

// 			items= append(items, dto.ContentItemDTO{
// 				ID: f.ID,
// 				Name: f.Name,
// 				Type: "folder",
// 				Position: &pos,
// 				ChildCount: &count,
// 				CreatedAt: f.CreatedAt,
// 			})
// 		}

// 	}

// 	// fill remaining space with the videos

// 	if len(items) < fetchLimit {
// 		var afterID *uuid.UUID

// 		if cursorType=="video"{
// 			afterID=cursorID
// 		}

// 		remaining := fetchLimit - len(items)

// 		videos,err:=s.videoRepo.GetByFolderIdPaginated(ctx, nil, afterID, remaining)

// 		if err != nil {
// 			fmt.Print(err)
// 			return nil, &utils.ApiError{Code: 500, Message: "Failed to fetch videos"}
// 		}

// 		for _ , v:= range videos{
// 			v := v

// 			items = append(items, dto.ContentItemDTO{
// 				 ID:           v.ID,
//                 Name:         v.Title,
//                 Type:         "video",
//                 ThumbnailURL: v.Thumbnail,
//                 Duration:     &v.Duration,
//                 CreatedAt:    v.CreatedAt,
// 			})
// 		}
// 	}

// 	hasNextPage:=len(items) > limit

// 		if hasNextPage {
//         items = items[:limit]
//     	}

// 		var nextCursor string

// 		if hasNextPage && len(items) > 0 {
// 			last := items[len(items)-1]
// 			nextCursor = utils.EncodeCursor(last.Type, last.ID)
// 		}

// 		folderCount, _ := s.folderRepo.CountChildren(ctx, nil)
//     	videoCount, _ := s.videoRepo.CountByFolderID(ctx, nil)

// 		metaData:=dto.Metadata{
// 			HasNextPage: hasNextPage,
// 			NextCursor: nextCursor,
// 			Total: folderCount+videoCount,
// 		}
// 		return &dto.FolderContentsDTO{
//         Items:       items,
// 		Metadata: metaData,
//     }, nil
// }

func (s *FolderServiceRepository) GetRootData(ctx context.Context, workspaceID uuid.UUID, userID uuid.UUID, cursor string, limit int) (*dto.FolderContentsDTO, error) {
	isOwned, err := s.userRepo.IsOwned(ctx, workspaceID, userID)
	if err != nil {
		return nil, err
	}
	if !isOwned {
		return nil, &utils.ApiError{
			Code:    http.StatusForbidden,
			Message: "You don't have permission to access this content.",
		}
	}

	var cursorType string
	var cursorID *uuid.UUID

	if cursor != "" {
		cursorType, cursorID, err = utils.DecodeCursor(cursor)
		if err != nil {
			fmt.Println("Cursor decoding error:", err)
			return nil, &utils.ApiError{Code: http.StatusBadRequest, Message: "Invalid cursor format"}
		}
	} else {
		// Default states for the first layout page initialization query
		cursorType = "root"
		cursorID = nil
	}

	// Request one extra item to check if a next page exists
	fetchLimit := limit + 1
	// var items []dto.ContentItemDTO

		items := make([]dto.ContentItemDTO, 0)


	// 3. PHASE 1: Fetch and append root folders first
	if cursorType != "video" {
		var afterID *uuid.UUID
		if cursorType == "folder" {
			afterID = cursorID
		}

		folders, err := s.folderRepo.GetChildrenPaginated(ctx, nil, workspaceID, afterID, fetchLimit)
		if err != nil {
			return nil, &utils.ApiError{Code: http.StatusInternalServerError, Message: "Failed to fetch folders"}
		}

		for _, f := range folders {
			f := f // Pin range variable safely

			childCount, _ := s.folderRepo.CountChildren(ctx, &f.ID)
			videoCount,_:=s.videoRepo.CountByFolderID(ctx, &f.ID)
			count := int(childCount) + int(videoCount)

			pos := f.Position

			items = append(items, dto.ContentItemDTO{
				ID:         f.ID,
				Name:       f.Name,
				Type:       "folder",
				Position:   &pos,
				ChildCount: &count,
				CreatedAt:  f.CreatedAt,
			})
		}
	}

	if len(items) < fetchLimit {
		afterIDStr := ""
		if cursorType == "video" && cursorID != nil {
			afterIDStr = cursorID.String()
		}

		remaining := fetchLimit - len(items)

		videos, err := s.videoRepo.GetByFolderIdPaginated(ctx, nil,  workspaceID ,afterIDStr ,remaining)
		if err != nil {
			fmt.Printf("Error fetching root videos: %v\n", err)
			return nil, &utils.ApiError{Code: http.StatusInternalServerError, Message: "Failed to fetch videos"}
		}

		for _, v := range videos {
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

	hasNextPage := len(items) > limit
	if hasNextPage {
		items = items[:limit]
	}

	var nextCursor string
	if hasNextPage && len(items) > 0 {
		last := items[len(items)-1]
		nextCursor = utils.EncodeCursor(last.Type, last.ID)
	}

	folderCount, _ := s.folderRepo.CountChildren(ctx, nil)
	videoCount, _ := s.videoRepo.CountByFolderID(ctx, nil) 

	metaData := dto.Metadata{
		HasNextPage: hasNextPage,
		NextCursor:  nextCursor,
		Total:       folderCount + videoCount,
	}

	jsonBytes, err := json.MarshalIndent(items, "", "  ")
	if err != nil {
		fmt.Printf("Error marshalling items payload: %v\n", err)
	} else {
		fmt.Print("lol")
		fmt.Println(string(jsonBytes))
	}
	return &dto.FolderContentsDTO{
		Items:    items,
		Metadata: metaData,
	}, nil
}

