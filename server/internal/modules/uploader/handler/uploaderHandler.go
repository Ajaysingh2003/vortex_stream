package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
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

	testUUid:=uuid.New()
	fmt.Println(testUUid,"leah jaye")

	
	data,err:=h.UploadService.GetSignedUrl(c.Request.Context(), req.Files)
	
	if  err!=nil{
		if appErr, ok := err.(*utils.ApiError); ok {
			c.JSON(appErr.Code, gin.H{ "success":false, "message": appErr.Message})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Something went wrong","success":false})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success":false,"files":data})
}

type CreateVideoReq struct {
	Title string `json:"title" binding:"required"`
	VideoKey string `json:"videoKey" binding:"required"`
}

func (h *UploadHandler) CreateVideo(c *gin.Context) {
	var req struct {
		Title    string `json:"title" binding:"required"`
		VideoKey string `json:"videoKey" binding:"required"`
		Status     domain.VideoStatus `json:"status" binding:"required"`
		WorkshopId     string `json:"workshopId" binding:"required"`
		Size   string    `json:"size" binding:"required"`
		// WorkshopId string `json:""`
	}
	
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error(),"success":false})
		return
	}

	reqData,_:=json.MarshalIndent(req, " ","");
	
	// fmt.Print(String(reqData),"test from aj");
	fmt.Print(string(reqData),"test data from ajy")

	workshopId, err := uuid.Parse(req.WorkshopId)
		if err!=nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to type asseration","success":false})
			return
	}

	payload:=&domain.Video{
		ID: uuid.New() ,
		WorkspaceId: workshopId ,
		Title: req.Title,
		VideoKey: req.VideoKey,
	}

	datas,err:=json.Marshal(payload)

	if err!=nil{
		c.JSON(http.StatusInternalServerError,gin.H{"message":utils.ErrMsg(err),"success":false})
		return
	}

	fmt.Print(datas,"from datas","going and gone")
	data,err:=h.UploadService.CreateVideo(c.Request.Context(),payload)

		if err!=nil{
			c.JSON(http.StatusInternalServerError,gin.H{"message":utils.ErrMsg(err),"success":false})
			return
		}

	c.JSON(http.StatusAccepted,gin.H{"message":"Video Updated SuccessFuly","data":data})
}

func (h *UploadHandler) Health(c *gin.Context) {
  
    c.JSON(http.StatusAccepted, gin.H{"message": "check"})
}