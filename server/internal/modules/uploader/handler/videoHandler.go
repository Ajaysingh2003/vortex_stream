package handler

import (
	// "encoding/json"
	"fmt"
	"net/http"


	"github.com/ajaysingh2003/vortex-stream/internal/modules/uploader/services"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type VideoHandler struct {
	VideoService services.VideoInterface
	UserRepo      repository.UserRepository
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

	if (err!=nil || user==nil ||user.IsActive==false){
		c.JSON(http.StatusBadRequest, gin.H{"message": "You don't have access"})
		return
	}
	


	testUUid:=uuid.New()

	fmt.Println(testUUid,"leah jaye")

	
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

