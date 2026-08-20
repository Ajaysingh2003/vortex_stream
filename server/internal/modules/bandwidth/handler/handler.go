package handler

import (
	"net/http"

	service "github.com/ajaysingh2003/vortex-stream/internal/modules/bandwidth/services"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	// "github.com/ajaysingh2003/vortex-stream/pkg/utils" // Adjust package path to your ApiError helper
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type BandwidthHandler struct {
	BandwidthService service.BandwidthServiceInterface
}

func (h *BandwidthHandler) GetBandwidthOverview(c *gin.Context) {
	userId, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized", "success": false})
		return
	}

	userID, ok := userId.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to type assertion", "success": false})
		return
	}

	data, err := h.BandwidthService.GetBandwidthOverview(c.Request.Context(), userID)
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
