package handler

import (
	"net/http"
	"strings"
	"time"

	analyticsDTO "github.com/ajaysingh2003/vortex-stream/internal/modules/analytics/dto"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (h *AnalyticsHandler) WorkspaceOverview(c *gin.Context) {
	workspaceID, ok := pathUUID(c, "workspaceId")
	if !ok {
		return
	}
	userID, ok := authenticatedUser(c)
	if !ok {
		return
	}
	rangeValue, ok := dateRange(c)
	if !ok {
		return
	}
	result, err := h.Service.Overview(c.Request.Context(), userID, workspaceID, nil, rangeValue)
	writeAnalyticsResult(c, result, err)
}

func (h *AnalyticsHandler) VideoOverview(c *gin.Context) {
	workspaceID, videoID, ok := workspaceAndVideoIDs(c)
	if !ok {
		return
	}
	userID, ok := authenticatedUser(c)
	if !ok {
		return
	}
	rangeValue, ok := dateRange(c)
	if !ok {
		return
	}
	result, err := h.Service.Overview(c.Request.Context(), userID, workspaceID, &videoID, rangeValue)
	writeAnalyticsResult(c, result, err)
}

func (h *AnalyticsHandler) VideoTimeSeries(c *gin.Context) {
	workspaceID, videoID, ok := workspaceAndVideoIDs(c)
	if !ok {
		return
	}
	userID, ok := authenticatedUser(c)
	if !ok {
		return
	}
	rangeValue, ok := dateRange(c)
	if !ok {
		return
	}
	result, err := h.Service.TimeSeries(c.Request.Context(), userID, workspaceID, videoID, rangeValue)
	writeAnalyticsResult(c, result, err)
}

func (h *AnalyticsHandler) VideoRetention(c *gin.Context) {
	workspaceID, videoID, ok := workspaceAndVideoIDs(c)
	if !ok {
		return
	}
	userID, ok := authenticatedUser(c)
	if !ok {
		return
	}
	rangeValue, ok := dateRange(c)
	if !ok {
		return
	}
	result, err := h.Service.Retention(c.Request.Context(), userID, workspaceID, videoID, rangeValue)
	writeAnalyticsResult(c, result, err)
}

func (h *AnalyticsHandler) VideoTechnical(c *gin.Context) {
	workspaceID, videoID, ok := workspaceAndVideoIDs(c)
	if !ok {
		return
	}
	userID, ok := authenticatedUser(c)
	if !ok {
		return
	}
	dimension := strings.ToLower(strings.TrimSpace(c.DefaultQuery("dimension", "country")))
	if dimension != "country" && dimension != "device" && dimension != "browser" && dimension != "os" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "dimension must be country, device, browser, or os"})
		return
	}
	rangeValue, ok := dateRange(c)
	if !ok {
		return
	}
	result, err := h.Service.Technical(c.Request.Context(), userID, workspaceID, videoID, dimension, rangeValue)
	writeAnalyticsResult(c, result, err)
}

func (h *AnalyticsHandler) WorkspaceFunnel(c *gin.Context) {
	workspaceID, ok := pathUUID(c, "workspaceId")
	if !ok {
		return
	}
	userID, ok := authenticatedUser(c)
	if !ok {
		return
	}
	rangeValue, ok := dateRange(c)
	if !ok {
		return
	}
	result, err := h.Service.Funnel(c.Request.Context(), userID, workspaceID, nil, rangeValue)
	writeAnalyticsResult(c, result, err)
}

func (h *AnalyticsHandler) VideoFunnel(c *gin.Context) {
	workspaceID, videoID, ok := workspaceAndVideoIDs(c)
	if !ok {
		return
	}
	userID, ok := authenticatedUser(c)
	if !ok {
		return
	}
	rangeValue, ok := dateRange(c)
	if !ok {
		return
	}
	result, err := h.Service.Funnel(c.Request.Context(), userID, workspaceID, &videoID, rangeValue)
	writeAnalyticsResult(c, result, err)
}

func (h *AnalyticsHandler) FunnelTimeSeries(c *gin.Context) {
	workspaceID, ok := pathUUID(c, "workspaceId")
	if !ok {
		return
	}
	userID, ok := authenticatedUser(c)
	if !ok {
		return
	}
	rangeValue, ok := dateRange(c)
	if !ok {
		return
	}
	var videoID *uuid.UUID
	if rawVideoID := strings.TrimSpace(c.Query("videoId")); rawVideoID != "" {
		parsed, err := uuid.Parse(rawVideoID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "videoId must be a valid UUID"})
			return
		}
		videoID = &parsed
	}
	result, err := h.Service.ConversionSeries(c.Request.Context(), userID, workspaceID, videoID, rangeValue)
	writeAnalyticsResult(c, result, err)
}

func authenticatedUser(c *gin.Context) (uuid.UUID, bool) {
	value, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "authentication required"})
		return uuid.Nil, false
	}
	userID, ok := value.(uuid.UUID)
	if !ok || userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "invalid authenticated user"})
		return uuid.Nil, false
	}
	return userID, true
}

func pathUUID(c *gin.Context, name string) (uuid.UUID, bool) {
	val := c.Param(name)
	if val == "" {
		if name == "workspaceId" {
			val = c.Param("workspaceID")
		} else if name == "workspaceID" {
			val = c.Param("workspaceId")
		}
	}
	value, err := uuid.Parse(val)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": name + " must be a valid UUID"})
		return uuid.Nil, false
	}
	return value, true
}

func workspaceAndVideoIDs(c *gin.Context) (uuid.UUID, uuid.UUID, bool) {
	workspaceID, ok := pathUUID(c, "workspaceId")
	if !ok {
		return uuid.Nil, uuid.Nil, false
	}
	videoID, ok := pathUUID(c, "videoId")
	return workspaceID, videoID, ok
}

func dateRange(c *gin.Context) (analyticsDTO.DateRange, bool) {
	now := time.Now().UTC()
	from := now.AddDate(0, 0, -30)
	to := now

	if value := c.Query("from"); value != "" {
		parsed, dateOnly, err := parseDate(value)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "from must be RFC3339 or YYYY-MM-DD"})
			return analyticsDTO.DateRange{}, false
		}
		from = parsed
		_ = dateOnly
	}
	if value := c.Query("to"); value != "" {
		parsed, dateOnly, err := parseDate(value)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "to must be RFC3339 or YYYY-MM-DD"})
			return analyticsDTO.DateRange{}, false
		}
		if dateOnly {
			parsed = parsed.AddDate(0, 0, 1)
		}
		to = parsed
	}
	if !from.Before(to) {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "from must be before to"})
		return analyticsDTO.DateRange{}, false
	}
	if to.Sub(from) > 366*24*time.Hour {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "date range cannot exceed 366 days"})
		return analyticsDTO.DateRange{}, false
	}
	return analyticsDTO.DateRange{From: from, To: to}, true
}

func parseDate(value string) (time.Time, bool, error) {
	if parsed, err := time.Parse(time.RFC3339, value); err == nil {
		return parsed.UTC(), false, nil
	}
	parsed, err := time.Parse("2006-01-02", value)
	if err != nil {
		return time.Time{}, false, err
	}
	return parsed.UTC(), true, nil
}

func writeAnalyticsResult(c *gin.Context, data any, err error) {
	if err == nil {
		c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
		return
	}
	if appErr, ok := err.(*utils.ApiError); ok {
		c.JSON(appErr.Code, gin.H{"success": false, "message": appErr.Message})
		return
	}
	c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "failed to query analytics"})
}
