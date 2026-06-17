package handler

import (
	// "encoding/json"
	// "fmt"
	"net/http"

	// "github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/uploader/dto"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/uploader/services"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UploadHandler struct {
	UploadService services.UploadInterface
	UserRepo      repository.UserRepository
}

func (h *UploadHandler) GetSignedUrl (c *gin.Context) {

	userId,exists:=c.Get("user_id")
	if !exists{
		c.JSON(http.StatusUnauthorized,gin.H{"message":"Unauthorized"})
		return
	}

	id, ok := userId.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to type asseration","success":false})

	}

	user,err:=h.UserRepo.GetByID(c.Request.Context(),id)

	if (err!=nil || user==nil ||user.IsActive==false){
		c.JSON(http.StatusBadRequest, gin.H{"message": "You don't have access"})
		return
	}

	type UploadRequest struct {
	Files []dto.File `json:"files"` 
	}

	var req UploadRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}


	
	data,err:=h.UploadService.GetSignedUrl(c.Request.Context(), req.Files)
	
	if  err!=nil{
		if appErr, ok := err.(*utils.ApiError); ok {
			c.JSON(appErr.Code, gin.H{ "success":false, "message": appErr.Message})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Something went wrong","success":false})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success":true,"files":data})
}

type CreateVideoReq struct {
	Title string `json:"title" binding:"required"`
	VideoKey string `json:"videoKey" binding:"required"`
}


func (h *UploadHandler) Health(c *gin.Context) {
  
    c.JSON(http.StatusAccepted, gin.H{"message": "check"})
}