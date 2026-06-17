package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/player/dto"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/player/services"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/datatypes"
)

type PlayerHandler struct {
	PlayerService service.PlayerSettingsInterface
}

func (h *PlayerHandler) UpdatePlayer(c *gin.Context) {

	workspaceIDRaw := c.Param("workspaceId")

	workspaceID, err := uuid.Parse(workspaceIDRaw)
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

	var req dto.UpdatePlayerReq

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error(), "success": false})
		return
	}

	var generalJSON datatypes.JSON

	if req.GeneralSettings != nil {
		bytes, err := json.Marshal(req.GeneralSettings)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error(), "success": false})
			return
		}
		generalJSON = datatypes.JSON(bytes)
	}

	var controlJSON datatypes.JSON

	if req.ControlSettings != nil {
		bytes, err := json.Marshal(req.ControlSettings)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error(), "success": false})
			return
		}
		controlJSON = datatypes.JSON(bytes)
	}
	
	var brandingJSON datatypes.JSON

	if req.ControlSettings != nil {
		bytes, err := json.Marshal(req.BrandingSettings)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error(), "success": false})
			return
		}
		brandingJSON = datatypes.JSON(bytes)
	}
	
	var securityJSON datatypes.JSON

	if req.SecuritySettings != nil {
		bytes, err := json.Marshal(req.SecuritySettings)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error(), "success": false})
			return
		}
		securityJSON = datatypes.JSON(bytes)
	}

	fmt.Print(securityJSON,"ocean")
	

	err=h.PlayerService.CreatePlayer(c.Request.Context(), userID, &domain.PlayerSettings{
		WorkspaceID:     workspaceID,
		GeneralSettings: generalJSON,
		ControlSettings: controlJSON,
		BrandingSettings:brandingJSON,
		SecuritySettings: securityJSON,
	})

	if err != nil {
		if appErr, ok := err.(*utils.ApiError); ok {
			c.JSON(appErr.Code, gin.H{"success": false, "message": appErr.Message})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Something went wrong", "success": false})
		return
	}


	c.JSON(http.StatusAccepted, gin.H{"message":"Player Settings Updated Successfully"})
	
}

func (h *PlayerHandler) GetPlayer(c *gin.Context) {

	workspaceIDRaw := c.Param("workspaceId")

	workspaceID, err := uuid.Parse(workspaceIDRaw)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid Workspace ID", "success": false})
	}

	

	

	playerData,err:=h.PlayerService.GetPlayer(c.Request.Context(), workspaceID )

	if err != nil {
		if appErr, ok := err.(*utils.ApiError); ok {
			c.JSON(appErr.Code, gin.H{"success": false, "message": appErr.Message})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Something went wrong", "success": false})
		return
	}


	c.JSON(http.StatusAccepted, gin.H{"data":playerData,"success":true})
	
}

