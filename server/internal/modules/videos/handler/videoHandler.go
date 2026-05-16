package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/videos/services"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type VideoHandler struct {
	VideoService services.VideoInterface
	UserRepo      repository.UserRepository
}



func (h *VideoHandler) CreateVideo(c *gin.Context) {
	var req struct {
		Title    string `json:"title" binding:"required"`
		VideoKey string `json:"videoKey" binding:"required"`
		Status     domain.VideoStatus `json:"status" binding:"required"`
		WorkshopId     string `json:"workshopId" binding:"required"`
		Size   string    `json:"size" binding:"required"`
		Duration int     `json:"duration" binding:required"`
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
		Duration: req.Duration,
	}

	datas,err:=json.Marshal(payload)

	if err!=nil{
		c.JSON(http.StatusInternalServerError,gin.H{"message":utils.ErrMsg(err),"success":false})
		return
	}

	fmt.Print(datas,"from datas","going and gone")
	data,err:=h.VideoService.CreateVideo(c.Request.Context(),payload)

		if err!=nil{
			c.JSON(http.StatusInternalServerError,gin.H{"message":utils.ErrMsg(err),"success":false})
			return
		}

	c.JSON(http.StatusAccepted,gin.H{"message":"Video Updated SuccessFuly","data":data})
}

func (h *VideoHandler) ListVideo (c *gin.Context) {

	userId,exists:=c.Get("user_id")

	if !exists{
		c.JSON(http.StatusUnauthorized,gin.H{"message":"Unauthorized","success":true})
		return
	}
	fmt.Print(userId,"lollol")

	id, ok := userId.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to type asseration","success":false})

	}

	user,err:=h.UserRepo.GetByID(c.Request.Context(),id)

	if (err!=nil || user==nil || user.IsActive==false){
		c.JSON(http.StatusBadRequest, gin.H{"message": "You don't have access"})
		return
	}
	




	
	data,err:=h.VideoService.ListVideo(c.Request.Context(), id)
	
	if  err!=nil{
		if appErr, ok := err.(*utils.ApiError); ok {
			c.JSON(appErr.Code, gin.H{ "success":false, "message": appErr.Message})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Something went wrong","success":false})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success":true,"data":data})
}

func (h *VideoHandler) Process (c *gin.Context) {
	videoIDRaw:=c.Param("videoId")
	userId,exists:=c.Get("user_id")

	if !exists{
		c.JSON(http.StatusUnauthorized,gin.H{"message":"Unauthorized","success":false})
		return
	}
	fmt.Print(userId,"lollol")

	id, ok := userId.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to type asseration","success":false})

	}
	videoID, err := uuid.Parse(videoIDRaw)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "invalid uuid format",
			"success": false,
		})
    return 
}

	user,err:=h.UserRepo.GetByID(c.Request.Context(),id)

	if (err!=nil || user==nil ||user.IsActive==false){
		c.JSON(http.StatusBadRequest, gin.H{"message": "You don't have access"})
		return
	}
	

	data,err:=h.VideoService.ProcessVideo(c.Request.Context(), videoID,id)

	// if data ==nil {
	// 	c.JSON(http.StatusBadRequest, gin.H{"success":false,"message":utils.ErrMsg("video")})
	// }
	if  err!=nil{
		if appErr, ok := err.(*utils.ApiError); ok {
			c.JSON(appErr.Code, gin.H{ "success":false, "message": appErr.Message})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": utils.ErrMsg(err),"success":false})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success":true,"data":data})
}


