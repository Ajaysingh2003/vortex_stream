package repository

import (
	"context"
	"errors"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	// "github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type LeadFormRepository interface {

	CreateTx(ctx context.Context,tx *gorm.DB,form *domain.LeadForm) (*domain.LeadForm, error)
	Create(ctx context.Context, form *domain.LeadForm) (*domain.LeadForm,error) 
	GetByID(ctx context.Context, id uuid.UUID) (*domain.LeadForm, error)
	GetByVideoID(ctx context.Context, videoID uuid.UUID) (*domain.LeadForm, error)
	Update(ctx context.Context, lead *domain.LeadForm) error
	Delete(ctx context.Context, id uuid.UUID) error
	UpsertTx(ctx context.Context,tx *gorm.DB ,form *domain.LeadForm) (*domain.LeadForm,error)

}

type postgresLeadFormRepository struct {
	db *gorm.DB
}

func NewPostgresLeadFormRepository(db *gorm.DB) LeadFormRepository {
	return &postgresLeadFormRepository{db: db}
}

func (r *postgresLeadFormRepository) CreateTx(ctx context.Context,tx *gorm.DB,form *domain.LeadForm)(*domain.LeadForm, error){

	if err := tx.WithContext(ctx).Create(form).Error; err != nil {
        return nil, err
    }
    return form, nil
}

func (r *postgresLeadFormRepository) Create(ctx context.Context, form *domain.LeadForm) (*domain.LeadForm, error) {
	result := r.db.WithContext(ctx).Create(form)

	if result.Error != nil {
		return nil, result.Error
	}

	return form, nil
}

func (r *postgresLeadFormRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.LeadForm, error) {
	var Leadform domain.LeadForm
	
	if err := r.db.WithContext(ctx).First(&Leadform, "id = ?", id).Error; err != nil {

		if (errors.Is(err,gorm.ErrRecordNotFound)) {
			return nil ,nil
		}
		return nil, err
	}
	return &Leadform, nil
}
// func (r *postgresLeadFormRepository) GetByVideoID(ctx context.Context, videoID uuid.UUID) (*domain.LeadForm, error) {
// 	var Leadform domain.LeadForm
	
// 	if err := r.db.Preload("Fields.Options").WithContext(ctx).First(&Leadform, "video_id = ?", videoID).Error; err != nil {

// 		if (errors.Is(err,gorm.ErrRecordNotFound)) {
// 			return nil ,nil
// 		}
// 		return nil, err
// 	}
// 	return &Leadform, nil
// }

func (r *postgresLeadFormRepository) GetByVideoID(ctx context.Context, videoID uuid.UUID) (*domain.LeadForm, error) {
    var leadForm domain.LeadForm

    err := r.db.
        WithContext(ctx).
        Preload("Fields", func(db *gorm.DB) *gorm.DB {
            return db.Order("position ASC")
        }).
        // Preload("Fields.Options", func(db *gorm.DB) *gorm.DB {
        //     return db.Order("position ASC")
        // }).
        First(&leadForm, "video_id = ?", videoID).
        Error

    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, nil
        }
        return nil, err
    }

    return &leadForm, nil
}



func (r *postgresLeadFormRepository) Update(ctx context.Context, form *domain.LeadForm) error {
	return r.db.WithContext(ctx).Save(form).Error
}

func (r *postgresLeadFormRepository) Delete(ctx context.Context, id uuid.UUID) error {
	
	return r.db.WithContext(ctx).Delete(&domain.LeadForm{}, "id = ?", id).Error
}



func (r *postgresLeadFormRepository) UpsertTx(ctx context.Context, tx *gorm.DB ,form *domain.LeadForm) (*domain.LeadForm, error) {
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		
		err := tx.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "video_id"}},
			DoUpdates: clause.AssignmentColumns([]string{"placement", "show_at", "allow_skip", "updated_at"}),
		}).Create(form).Error
		
		if err != nil {
			return err
		}

		if err := tx.Where("form_id = ?", form.ID).Delete(&domain.LeadFormField{}).Error; err != nil {
			return err
		}

		// 3. Re-save the incoming fields list along with their nested option slices.
		// Because we're passing the pre-populated child entities attached to the form struct,
		// GORM natively iterates down the tree arrays and writes them out cleanly.
		if len(form.Fields) > 0 {
			if err := tx.Create(&form.Fields).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return form, nil
}