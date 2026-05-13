package services

import (
	"context"
	"fmt"
	// "github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/uploader/dto"
	// "github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	userRpo "github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	config "github.com/ajaysingh2003/vortex-stream/internal/shared/config/r2"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/google/uuid"
)

type SignedUrlRes struct {
	UploadUrl string
	Key       string
}

type UploadInterface interface {
	GetSignedUrl(ctx context.Context, files []dto.File) (*[]SignedUrlRes, error)
	// CreateVideo(ctx context.Context,video *domain.Video) (*domain.Video,error)
}

type uploadrServiceRepo struct {
	userRepo userRpo.UserRepository
	// workspaceRepo repository.WorkshopRepository
}

func NewUploadService(userRepo userRpo.UserRepository)UploadInterface {
	return &uploadrServiceRepo{userRepo:userRepo}
}


func (r *uploadrServiceRepo) GetSignedUrl(ctx context.Context,files []dto.File) ( *[]SignedUrlRes , error) {

	

results := make([]SignedUrlRes, 0, len(files))
	client := config.R2Client()
	for _, value := range files {
		
		key := fmt.Sprintf("uploads/%s-%s", uuid.New().String(), value.Name)
		
		signedUrl,err:=utils.GenerateUploadURL(client,"vortex-secondary",key,value.Type)
		
		if err != nil {
		return nil,err
	}
	
	results = append(results, SignedUrlRes{
		UploadUrl: signedUrl,
		Key: key,
	})
	}

return &results,nil
}
