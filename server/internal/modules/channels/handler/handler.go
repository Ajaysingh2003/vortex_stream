package handler

import (
	channelService "github.com/ajaysingh2003/vortex-stream/internal/modules/channels/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"net/http"
)

type Handler struct{ Service *channelService.Service }

func uid(c *gin.Context) (uuid.UUID, bool) {
	raw, ok := c.Get("user_id")
	if !ok {
		return uuid.Nil, false
	}
	id, ok := raw.(uuid.UUID)
	return id, ok && id != uuid.Nil
}
func id(c *gin.Context) (uuid.UUID, bool) {
	v, err := uuid.Parse(c.Param("channelId"))
	return v, err == nil
}
func (h *Handler) Create(c *gin.Context) {
	var req struct {
		WorkspaceID uuid.UUID `json:"workspaceId" binding:"required"`
		Name        string    `json:"name" binding:"required,min=1,max=255"`
	}
	if c.ShouldBindJSON(&req) != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid channel data"})
		return
	}
	user, ok := uid(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false})
		return
	}
	channel, err := h.Service.Create(c, user, req.WorkspaceID, req.Name)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": channel})
}
func (h *Handler) List(c *gin.Context) {
	user, ok := uid(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false})
		return
	}
	data, err := h.Service.List(c, user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "could not load channels"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}
func (h *Handler) Get(c *gin.Context) {
	user, ok := uid(c)
	channel, valid := id(c)
	if !ok || !valid {
		c.JSON(http.StatusBadRequest, gin.H{"success": false})
		return
	}
	data, err := h.Service.Get(c, user, channel)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "channel not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}
func (h *Handler) Update(c *gin.Context) {
	user, ok := uid(c)
	channel, valid := id(c)
	var req struct {
		Name string `json:"name" binding:"required,min=1,max=255"`
	}
	if !ok || !valid || c.ShouldBindJSON(&req) != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false})
		return
	}
	if err := h.Service.Update(c, user, channel, req.Name); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "channel not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "channelId": channel})
}
func (h *Handler) Delete(c *gin.Context) {
	user, ok := uid(c)
	channel, valid := id(c)
	if !ok || !valid {
		c.JSON(http.StatusBadRequest, gin.H{"success": false})
		return
	}
	if err := h.Service.Delete(c, user, channel); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "channel not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "channelId": channel})
}

func (h *Handler) AddVideo(c *gin.Context)    { h.videoMutation(c, true) }
func (h *Handler) RemoveVideo(c *gin.Context) { h.videoMutation(c, false) }
func (h *Handler) videoMutation(c *gin.Context, add bool) {
	user, ok := uid(c)
	channel, valid := id(c)
	video, videoErr := uuid.Parse(c.Param("videoId"))
	if !ok || !valid || videoErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid channel or video id"})
		return
	}
	var err error
	if add {
		err = h.Service.AddVideo(c, user, channel, video)
	} else {
		err = h.Service.RemoveVideo(c, user, channel, video)
	}
	if err != nil {
		code := http.StatusInternalServerError
		if err.Error() == "channel not found" || err.Error() == "video not found" {
			code = http.StatusNotFound
		}
		c.JSON(code, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "channelId": channel, "videoId": video, "added": add})
}
func (h *Handler) ListVideos(c *gin.Context) {
	user, ok := uid(c)
	channel, valid := id(c)
	if !ok || !valid {
		c.JSON(http.StatusBadRequest, gin.H{"success": false})
		return
	}
	videos, err := h.Service.ListVideos(c, user, channel)
	if err != nil {
		code := http.StatusInternalServerError
		if err.Error() == "channel not found" {
			code = http.StatusNotFound
		}
		c.JSON(code, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": videos})
}
