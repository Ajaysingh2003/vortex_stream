package handler

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/ajaysingh2003/vortex-stream/internal/modules/leads/service"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Handler struct{ Service *service.Service }
type scope struct {
	workspace, video uuid.UUID
	title            string
}

func fail(c *gin.Context, err error) {
	if api, ok := err.(*utils.ApiError); ok {
		c.JSON(api.Code, gin.H{"message": api.Message})
		return
	}
	c.JSON(500, gin.H{"message": "Unable to complete the leads request. Please try again."})
}
func (h *Handler) authorize(c *gin.Context) (scope, bool) {
	c.Header("Cache-Control", "no-store")
	user, ok := c.Get("user_id")
	if !ok {
		c.AbortWithStatus(401)
		return scope{}, false
	}
	userID, ok := user.(uuid.UUID)
	if !ok {
		c.AbortWithStatus(401)
		return scope{}, false
	}
	workspace, err := uuid.Parse(c.Param("workspaceId"))
	if err != nil {
		c.AbortWithStatusJSON(400, gin.H{"message": "Invalid workspace."})
		return scope{}, false
	}
	video, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.AbortWithStatusJSON(400, gin.H{"message": "Invalid video."})
		return scope{}, false
	}
	asset, err := h.Service.Authorize(c.Request.Context(), workspace, video, userID)
	if err != nil {
		fail(c, err)
		return scope{}, false
	}
	return scope{workspace, video, asset.Title}, true
}
func bind(c *gin.Context, value interface{}) bool {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 64<<10)
	decoder := json.NewDecoder(c.Request.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(value); err != nil {
		c.JSON(400, gin.H{"message": "Invalid request body."})
		return false
	}
	if decoder.Decode(new(interface{})) != io.EOF {
		c.JSON(400, gin.H{"message": "Only one JSON object is allowed."})
		return false
	}
	return true
}
func paramID(c *gin.Context, key string) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param(key))
	if err != nil {
		c.JSON(400, gin.H{"message": "Invalid identifier."})
		return uuid.Nil, false
	}
	return id, true
}
func queryFilter(c *gin.Context) (service.Filter, bool) {
	var filter service.Filter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(400, gin.H{"message": "Invalid filters."})
		return filter, false
	}
	if err := filter.Validate(); err != nil {
		fail(c, err)
		return filter, false
	}
	return filter, true
}
func ok(c *gin.Context, value interface{}) { c.JSON(200, gin.H{"success": true, "data": value}) }
func (h *Handler) List(c *gin.Context) {
	scope, valid := h.authorize(c)
	if !valid {
		return
	}
	filter, valid := queryFilter(c)
	if !valid {
		return
	}
	data, err := h.Service.List(c.Request.Context(), scope.video, filter)
	if err != nil {
		fail(c, err)
		return
	}
	data.VideoTitle = scope.title
	ok(c, data)
}
func (h *Handler) Export(c *gin.Context) {
	scope, valid := h.authorize(c)
	if !valid {
		return
	}
	filter, valid := queryFilter(c)
	if !valid {
		return
	}
	if _, err := h.Service.ExportCount(c.Request.Context(), scope.video, filter); err != nil {
		fail(c, err)
		return
	}
	fields, err := h.Service.Fields(c.Request.Context(), scope.video)
	if err != nil {
		fail(c, err)
		return
	}
	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", `attachment; filename="video-leads.csv"`)
	// Once streaming starts, abort the stream on failure instead of returning a valid-looking truncated CSV.
	if err := h.Service.WriteCSV(c.Request.Context(), c.Writer, scope.video, filter, fields); err != nil {
		panic(http.ErrAbortHandler)
	}
}
func (h *Handler) Integrations(c *gin.Context) {
	scope, valid := h.authorize(c)
	if !valid {
		return
	}
	data, err := h.Service.Integrations(c.Request.Context(), scope.video)
	if err != nil {
		fail(c, err)
		return
	}
	ok(c, data)
}
func (h *Handler) SaveIntegration(c *gin.Context) {
	scope, valid := h.authorize(c)
	if !valid {
		return
	}
	id := uuid.Nil
	if c.Param("integrationId") != "" {
		id, valid = paramID(c, "integrationId")
		if !valid {
			return
		}
	}
	var input service.IntegrationInput
	if !bind(c, &input) {
		return
	}
	data, err := h.Service.SaveIntegration(c.Request.Context(), scope.workspace, scope.video, id, input)
	if err != nil {
		fail(c, err)
		return
	}
	ok(c, data)
}
func (h *Handler) Test(c *gin.Context) {
	scope, valid := h.authorize(c)
	if !valid {
		return
	}
	id, valid := paramID(c, "integrationId")
	if !valid {
		return
	}
	if err := h.Service.TestIntegration(c.Request.Context(), scope.video, id); err != nil {
		fail(c, err)
		return
	}
	ok(c, gin.H{"queued": true})
}
func (h *Handler) Deliveries(c *gin.Context) {
	scope, valid := h.authorize(c)
	if !valid {
		return
	}
	data, err := h.Service.RecentDeliveries(c.Request.Context(), scope.video)
	if err != nil {
		fail(c, err)
		return
	}
	ok(c, data)
}
func (h *Handler) Attempts(c *gin.Context) {
	scope, valid := h.authorize(c)
	if !valid {
		return
	}
	id, valid := paramID(c, "deliveryId")
	if !valid {
		return
	}
	data, err := h.Service.Attempts(c.Request.Context(), scope.video, id)
	if err != nil {
		fail(c, err)
		return
	}
	ok(c, data)
}
func (h *Handler) Retry(c *gin.Context) {
	scope, valid := h.authorize(c)
	if !valid {
		return
	}
	id, valid := paramID(c, "deliveryId")
	if !valid {
		return
	}
	if err := h.Service.Retry(c.Request.Context(), scope.video, id); err != nil {
		fail(c, err)
		return
	}
	ok(c, gin.H{"queued": true})
}
func (h *Handler) Queue(c *gin.Context) {
	scope, valid := h.authorize(c)
	if !valid {
		return
	}
	var input struct {
		IDs []uuid.UUID `json:"ids"`
	}
	if !bind(c, &input) {
		return
	}
	if err := h.Service.QueueSelected(c.Request.Context(), scope.video, input.IDs); err != nil {
		fail(c, err)
		return
	}
	ok(c, gin.H{"queued": true})
}
