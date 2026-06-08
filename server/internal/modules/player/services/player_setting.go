package service

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/player/repository"
	workspaceRepo "github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PlayerSettingsInterface interface {
	CreatePlayer(ctx context.Context, userID uuid.UUID, setting *domain.PlayerSettings) error
}

type PlayerRepo struct {
	playerRepo    repository.PlayerRepository
	userRepo     workspaceRepo.UserRepository
	workspaceRepo workspaceRepo.WorkshopRepository
	db            *gorm.DB
}

func NewPlayerService(workspaceRepo workspaceRepo.WorkshopRepository, userRepo workspaceRepo.UserRepository ,playerRepo repository.PlayerRepository) PlayerSettingsInterface {
	return &PlayerRepo{workspaceRepo: workspaceRepo, userRepo: userRepo ,playerRepo: playerRepo}
}

func (r *PlayerRepo) CreatePlayer(ctx context.Context, userID uuid.UUID, setting *domain.PlayerSettings) error {

	workspace, err := r.workspaceRepo.GetByID(ctx, setting.WorkspaceID)

	
	if err != nil {
		return err
	}
	
	isOwned,err:=r.userRepo.IsOwned(ctx , workspace.ID, userID)

	if err != nil {
		return err
	}

	if !isOwned {
		return  &utils.ApiError{
			Code: 403,
			Message: "You don't have Permission for This action",
		}
	}

	playerPayload := &domain.PlayerSettings{
		ID:               uuid.New(),
		GeneralSettings:  setting.GeneralSettings,
		ControlSettings:  setting.ControlSettings,
		BrandingSettings: setting.BrandingSettings,
		AdvancedSettings: setting.AdvancedSettings,
		SecuritySettings: setting.SecuritySettings,
		WorkspaceID:      workspace.ID,
	}

	json,err:=json.MarshalIndent(playerPayload, "", " ")
	
	fmt.Print(string(json),"custom-player-2")
	err = r.playerRepo.Upsert(ctx, playerPayload)

	if err != nil {
		return err
	}

	return nil
}
