package repository

import (
	"context"
	"fmt"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type PlayerRepository interface {
	UpsertTx(ctx context.Context, tx *gorm.DB, settings *domain.PlayerSettings) error
	Upsert(ctx context.Context, settings *domain.PlayerSettings) error
}

type postgresPlayerRepository struct {
	db *gorm.DB
}

func NewPostgresPlayerRepository(db *gorm.DB) PlayerRepository {
	return &postgresPlayerRepository{db: db}
}

func (r *postgresPlayerRepository) UpsertTx(ctx context.Context, tx *gorm.DB, settings *domain.PlayerSettings) error {

	err := tx.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "workspaceId"}}, 

			DoUpdates: clause.AssignmentColumns([]string{
				
				
				"general_settings",
				"control_settings",
				"branding_settings",
				"security_settings",
				"advanced_settings",
			}),
		}).
		Create(settings).Error

	if err != nil {
		return err
	}
	

	return nil
}


func (r *postgresPlayerRepository) Upsert(ctx context.Context, settings *domain.PlayerSettings) error {
	fmt.Print(settings,"custom-player")

	err := r.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "workspace_id"}}, 

			DoUpdates: clause.AssignmentColumns([]string{
				"general_settings",
				"control_settings",
				"branding_settings",
				"security_settings",
				"advanced_settings",
			}),
		}).
		Create(settings).Error

	if err != nil {
		return err
	}
	

	return nil
}


