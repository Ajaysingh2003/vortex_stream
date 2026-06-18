package handler

import (
	"fmt"
	"net/http"

	"github.com/ajaysingh2003/vortex-stream/internal/modules/form/dto"
	services "github.com/ajaysingh2003/vortex-stream/internal/modules/form/service"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type createFormReq struct {
	// ID        uuid.UUID        `json:"id" validate:"required"`
	Placement string           `json:"placement" validate:"required,oneof=before_video during_video after_video"`
	ShowAt    *float64         `json:"show_at" validate:"omitempty,required_if=Placement during_video"`
	AllowSkip bool             `json:"allow_skip"`
	Fields    []CreateFieldReq `json:"fields" validate:"required,dive,required"`
}

type CreateFieldReq struct {
	ID       uuid.UUID         `json:"id" validate:"required"`
	Label    string            `json:"label" validate:"required"`
	Type     string            `json:"type" validate:"required,oneof=text dropdown checkbox"`
	Position int               `json:"position" validate:"required,min=1"`
	Options  []CreateOptionReq `json:"options" validate:"required_if=Type dropdown required_if=Type checkbox,dive"`
}

type CreateOptionReq struct {
	ID    uuid.UUID `json:"id"`
	Label string    `json:"label" validate:"required"`
}

type FormHandler struct {
	FormService services.FormServiceInterface
}

func (f *FormHandler) UpsertForm(c *gin.Context) {
	fmt.Print("gotigoti")
	workspaceIDRaw := c.Param("workspaceID")
	videoIDRaw := c.Param("videoID")

	workspaceID, err := uuid.Parse(workspaceIDRaw)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid Workspace ID", "success": false})
	}

	videoID, err := uuid.Parse(videoIDRaw)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid Workspace ID", "success": false})
	}

	userIDRaw, exists := c.Get("user_id")

	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized", "success": true})
		return
	}

	userID, ok := userIDRaw.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to type asseration", "success": false})

	}

	var req createFormReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	// 1. Create a new slice matching the destination Field DTO type
	dtoFields := make([]dto.CreateFieldReq, len(req.Fields))

	for i, f := range req.Fields {

		// 2. Create a new slice matching the destination Option DTO type for THIS field
		dtoOptions := make([]dto.CreateOptionReq, len(f.Options))

		// 3. Loop over and map each inner option item individually
		for j, opt := range f.Options {
			dtoOptions[j] = dto.CreateOptionReq{
				Label: opt.Label,
				ID:    opt.ID,
			}
		}

		// 4. Map the parent field and attach the freshly mapped option slice
		dtoFields[i] = dto.CreateFieldReq{
			ID:       f.ID,
			Label:    f.Label,
			Type:     f.Type,
			Position: f.Position,
			Options:  dtoOptions,
		}
	}

	// Now you can safely use 'dtoFields' inside your struct literal configuration block!

	// Now you can safely use 'dtoFields' inside your struct literal configuration block
	createPayload := &dto.CreateFormReq{

		ID:          uuid.New(),
		VideoID:     videoID,
		WorkspaceID: workspaceID,
		Placement:   req.Placement,
		AllowSkip:   req.AllowSkip,
		Fields:      dtoFields,
	}

	err=f.FormService.Create(c.Request.Context(), createPayload,userID)


	if err != nil {
		if appErr, ok := err.(*utils.ApiError); ok {
			c.JSON(appErr.Code, gin.H{"success": false, "message": appErr.Message})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Something went wrong", "success": false})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": "form Updated successfully"})
}







func (h *FormHandler) GetByVideoID(c *gin.Context) {
	videoIDRaw := c.Param("videoId")

	videoID, err := uuid.Parse(videoIDRaw)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "invalid uuid format",
			"success": false,
		})
		return

	}

	formData, err := h.FormService.GetByVideoID(c.Request.Context(), videoID)

	if err != nil {
		if appErr, ok := err.(*utils.ApiError); ok {

			fmt.Print(appErr.Code, "jerry")
			c.JSON(appErr.Code, gin.H{"success": false, "message": appErr.Message})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Something went wrong", "success": false})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": formData})
}

