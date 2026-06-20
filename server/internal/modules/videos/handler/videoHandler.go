package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/users/repository"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/videos/services"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type VideoHandler struct {
	VideoService services.VideoInterface
	UserRepo     repository.UserRepository
}

func (h *VideoHandler) CreateVideo(c *gin.Context) {
	var req struct {
		Title       string             `json:"title" binding:"required"`
		VideoKey    string             `json:"videoKey" binding:"required"`
		Status      domain.VideoStatus `json:"status" binding:"required"`
		WorkspaceId string             `json:"workspaceId" binding:"required"`
		Size        int64              `json:"size" binding:"required"`
		Duration    int                `json:"duration" binding:required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error(), "success": false})
		return
	}

	reqData, _ := json.MarshalIndent(req, " ", "")

	// fmt.Print(String(reqData),"test from aj");
	fmt.Print(string(reqData), "test data from ajy")

	workspaceId, err := uuid.Parse(req.WorkspaceId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to type asseration", "success": false})
		return
	}

	payload := &domain.Video{
		ID:          uuid.New(),
		Size:        req.Size,
		WorkspaceID: workspaceId,
		Title:       req.Title,
		VideoKey:    req.VideoKey,
		Duration:    req.Duration,
	}

	datas, err := json.Marshal(payload)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": utils.ErrMsg(err), "success": false})
		return
	}

	fmt.Print(datas, "from datas", "going and gone")
	data, err := h.VideoService.CreateVideo(c.Request.Context(), payload)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": utils.ErrMsg(err), "success": false})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"message": "Video Updated SuccessFuly", "data": data})
}

func (h *VideoHandler) ListVideo(c *gin.Context) {

	userId, exists := c.Get("user_id")

	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized", "success": true})
		return
	}
	fmt.Print(userId, "lollol")

	id, ok := userId.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to type asseration", "success": false})

	}

	user, err := h.UserRepo.GetByID(c.Request.Context(), id)

	if err != nil || user == nil || user.IsActive == false {
		c.JSON(http.StatusBadRequest, gin.H{"message": "You don't have access"})
		return
	}

	data, err := h.VideoService.ListVideo(c.Request.Context(), id)

	if err != nil {
		if appErr, ok := err.(*utils.ApiError); ok {
			c.JSON(appErr.Code, gin.H{"success": false, "message": appErr.Message})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Something went wrong", "success": false})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}
func (h *VideoHandler) ListVideoByWorkspace(c *gin.Context) {

	userId, exists := c.Get("user_id")

	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized", "success": true})
		return
	}
	fmt.Print(userId, "lollol")

	userID, ok := userId.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to type asseration", "success": false})
	}

	workspaceID, err := uuid.Parse(c.Param("workspaceId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid Workspace ID"})
		return
	}

	cursor := c.Query("cursor")

	limit:=10
	if l := c.Query("limit"); l != "" {
    parsed, err := strconv.Atoi(l)
    if err == nil && parsed > 0 && parsed <= 100 {
        limit = parsed
    }
	}

	data, err := h.VideoService.ListVideoByWorkspaceID(c.Request.Context(), workspaceID, userID,cursor,limit)

	fmt.Print(data,"data-v3")
	
	if err != nil {
		if appErr, ok := err.(*utils.ApiError); ok {
			c.JSON(appErr.Code, gin.H{"success": false, "message": appErr.Message})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Something went wrong", "success": false})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}

func (h *VideoHandler) Process(c *gin.Context) {
	videoIDRaw := c.Param("videoId")
	userId, exists := c.Get("user_id")

	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized", "success": false})
		return
	}
	fmt.Print(userId, "lollol")

	id, ok := userId.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to type asseration", "success": false})

	}
	videoID, err := uuid.Parse(videoIDRaw)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "invalid uuid format",
			"success": false,
		})
		return
	}

	user, err := h.UserRepo.GetByID(c.Request.Context(), id)

	if err != nil || user == nil || user.IsActive == false {
		c.JSON(http.StatusBadRequest, gin.H{"message": "You don't have access"})
		return
	}

	data, err := h.VideoService.ProcessVideo(c.Request.Context(), videoID, id)

	// if data ==nil {
	// 	c.JSON(http.StatusBadRequest, gin.H{"success":false,"message":utils.ErrMsg("video")})
	// }
	if err != nil {
		if appErr, ok := err.(*utils.ApiError); ok {
			c.JSON(appErr.Code, gin.H{"success": false, "message": appErr.Message})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": utils.ErrMsg(err), "success": false})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}

func (h *VideoHandler) UpdateVideo(c *gin.Context) {

	var req struct {
		Title       string     `json:"title" binding:"required"`
		WorkspaceId uuid.UUID  `json:"workspaceId" binding:"required"`
		FolderID    *uuid.UUID `gorm:"type:uuid;index" json:"folderId"`
	}

	// fmt.Print(req,"lol")
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	id, err := uuid.Parse(c.Param("id"))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid Folder ID", "success": false})
		return
	}

	userIDRaw, exists := c.Get("user_id")

	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized", "success": true})
		return
	}

	userId, ok := userIDRaw.(uuid.UUID)

	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized", "success": false})
		return
	}

	err = h.VideoService.UpdateVideo(c.Request.Context(), userId, domain.Video{
		ID:          id,
		Title:       req.Title,
		FolderID:    req.FolderID,
		WorkspaceID: req.WorkspaceId,
	})

	if err != nil {
		fmt.Print(err, "wqe")
		if appErr, ok := err.(*utils.ApiError); ok {
			c.JSON(appErr.Code, gin.H{"success": false, "message": utils.ErrMsg(err)})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Something went wrong", "success": false})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Video Updated Successfully."})
}
func (h *VideoHandler) UpdateVideoMetaData(c *gin.Context) {
	var req struct {
		Title     *string    `json:"title" binding:"omitempty"`
		FolderID  *uuid.UUID `json:"folderId" binding:"omitempty"`
		Thumbnail *string    `json:"thumbnail" binding:"omitempty"` // 🚀 Change to *string to handle partial updates cleanly
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	// 1. Parse Video ID from path
	videoID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid Video ID"})
		return
	}

	// 2. Parse Workspace ID from path (Ensure case matches router parameter exactly!)
	workspaceID, err := uuid.Parse(c.Param("workspaceId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid Workspace ID"})
		return
	}

	// 3. Authenticate user context
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "UNAUTHORIZED_ACCESS",
			"message": "Your session has expired or is invalid. Please log in again.",
		})
		return
	}

	userId, ok := userIDRaw.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized user context"})
		return
	}

	// 4. Construct payload (Only map fields that don't overwrite blindly)
	videoPayload := domain.Video{
		ID:          videoID,
		WorkspaceID: workspaceID,
		FolderID:    req.FolderID, // Pointers map perfectly here
	}

	// 🚀 Safe dereferencing logic fixes compiler errors and prevents empty overwrites
	if req.Title != nil {
		videoPayload.Title = *req.Title
	}

	if req.Thumbnail != nil {
		videoPayload.Thumbnail = *req.Thumbnail
	}

	// 5. Update via service layer
	err = h.VideoService.UpdateVideo(c.Request.Context(), userId, videoPayload)
	if err != nil {
		// Log internal error for your server debugging logs
		fmt.Printf("[UpdateVideo Error]: %v\n", err)

		if appErr, ok := err.(*utils.ApiError); ok {
			c.JSON(appErr.Code, gin.H{"success": false, "message": utils.ErrMsg(err)})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Something went wrong"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Video updated successfully."})
}

func (h *VideoHandler) GetByVideoID(c *gin.Context) {
	videoIDRaw := c.Param("videoId")

	videoID, err := uuid.Parse(videoIDRaw)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "invalid uuid format",
			"success": false,
		})
		return

	}

	videoData, err := h.VideoService.StreamVideo(c.Request.Context(), videoID)

	if err != nil {
		if appErr, ok := err.(*utils.ApiError); ok {

			fmt.Print(appErr.Code, "jerry")
			c.JSON(appErr.Code, gin.H{"success": false, "message": appErr.Message})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Something went wrong", "success": false})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": videoData})
}

func (h *VideoHandler) GetVideoMetaData(c *gin.Context) {
	videoIDRaw := c.Param("id")

	videoID, err := uuid.Parse(videoIDRaw)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "invalid uuid format",
			"success": false,
		})
		return

	}

	workspaceIDRaw := c.Param("workspaceId")

	workspaceID, workspaceErr := uuid.Parse(workspaceIDRaw)

	if workspaceErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "invalid uuid format",
			"success": false,
		})
		return

	}

	userId, exists := c.Get("user_id")

	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized", "success": true})
		return
	}
	fmt.Print(userId, "lollol")

	userID, ok := userId.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to type asseration", "success": false})

	}

	videoData, err := h.VideoService.GetVideoMetaData(c.Request.Context(), userID, workspaceID, videoID)

	if err != nil {
		if appErr, ok := err.(*utils.ApiError); ok {

			fmt.Print(appErr.Code, "jerry")
			c.JSON(appErr.Code, gin.H{"success": false, "message": appErr.Message})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Something went wrong", "success": false})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": videoData})
}
