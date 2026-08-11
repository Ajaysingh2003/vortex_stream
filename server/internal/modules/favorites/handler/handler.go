package handler

import (
	"net/http"
	"strconv"

	"github.com/ajaysingh2003/vortex-stream/internal/modules/favorites/service"
	videoDto "github.com/ajaysingh2003/vortex-stream/internal/modules/videos/dto"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Handler struct{ Service *service.Service }

func userID(c *gin.Context) (uuid.UUID, bool) {
	raw, ok := c.Get("user_id")
	if !ok || raw == nil {
		return uuid.Nil, false
	}
	switch value := raw.(type) {
	case uuid.UUID:
		return value, value != uuid.Nil
	case string:
		id, err := uuid.Parse(value)
		return id, err == nil
	default:
		return uuid.Nil, false
	}
}
func parseID(c *gin.Context, name string) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param(name))
	return id, err == nil
}
func (h *Handler) respondError(c *gin.Context, err error) {
	if apiErr, ok := err.(*utils.ApiError); ok {
		c.JSON(apiErr.Code, gin.H{"success": false, "message": apiErr.Message})
		return
	}
	if err.Error() == "video not found" {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "failed to update favorite"})
}
func (h *Handler) AddVideo(c *gin.Context)    { h.videoMutation(c, true) }
func (h *Handler) RemoveVideo(c *gin.Context) { h.videoMutation(c, false) }
func (h *Handler) videoMutation(c *gin.Context, add bool) {
	uid, ok := userID(c)
	vid, valid := parseID(c, "videoId")
	if !ok || !valid {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "invalid authentication or video id"})
		return
	}
	var err error
	if add {
		err = h.Service.AddVideo(c, uid, vid)
	} else {
		err = h.Service.RemoveVideo(c, uid, vid)
	}
	if err != nil {
		h.respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "favorited": add, "videoId": vid})
}
func (h *Handler) ListVideos(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false})
		return
	}
	workspaceID, err := uuid.Parse(c.Query("workspaceID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid Workspace ID"})
		return
	}
	limit := 10
	if value, parseErr := strconv.Atoi(c.Query("limit")); parseErr == nil && value > 0 && value <= 100 {
		limit = value
	}
	date, visibility, sort := c.Query("date"), c.Query("visibility"), c.Query("sort")
	if date == "" {
		date = "any"
	}
	if visibility == "" {
		visibility = "all"
	}
	if sort == "" {
		sort = "created_asc"
	}
	filters := &videoDto.FilterOptions{Date: &date, Visibility: &visibility, Sort: &sort}
	data, err := h.Service.ListVideosPaginated(c, uid, workspaceID, c.Query("cursor"), limit, filters)
	if err != nil {
		h.respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}
func (h *Handler) VideoStatus(c *gin.Context) {
	uid, ok := userID(c)
	vid, valid := parseID(c, "videoId")
	if !ok || !valid {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false})
		return
	}
	f, err := h.Service.VideoStatus(c, uid, vid)
	if err != nil {
		h.respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "favorited": f, "videoId": vid})
}
