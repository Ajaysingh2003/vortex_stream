package handler

import (
	"context"
	"net/http"
	"strconv"
	"strings"
	"time"

	analyticsDTO "github.com/ajaysingh2003/vortex-stream/internal/modules/analytics/dto"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func resolveScope(c *gin.Context) (uuid.UUID, *uuid.UUID, uuid.UUID, bool) {
	c.Header("Cache-Control", "no-store")
	workspace, ok := pathUUID(c, "workspaceID")
	if !ok {
		return uuid.Nil, nil, uuid.Nil, false
	}
	user, ok := authenticatedUser(c)
	if !ok {
		return uuid.Nil, nil, uuid.Nil, false
	}
	var video *uuid.UUID
	raw := c.Param("videoId")
	if raw == "" {
		raw = c.Query("videoId")
	}
	if raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			c.JSON(400, gin.H{"success": false, "message": "videoId must be a UUID"})
			return uuid.Nil, nil, uuid.Nil, false
		}
		video = &id
	}
	return workspace, video, user, true
}

func parseFilters(c *gin.Context) analyticsDTO.FilterParams {
	var f analyticsDTO.FilterParams
	f.Country = c.Query("country")
	f.Referrer = c.Query("referrer")
	f.Device = c.Query("device")
	f.Browser = c.Query("browser")
	f.OS = c.Query("os")
	f.UTMSource = c.Query("utm_source")
	f.UTMMedium = c.Query("utm_medium")
	f.UTMCampaign = c.Query("utm_campaign")
	f.Surface = c.Query("surface")
	f.CTAID = c.Query("cta_id")
	f.ChapterID = c.Query("chapter_id")
	f.SubtitleTrackID = c.Query("subtitle_track_id")
	f.MediaRevisionID = c.Query("media_revision_id")
	if v := c.Query("is_preview"); v != "" {
		b := v == "true" || v == "1"
		f.IsPreview = &b
	}
	return f
}

func (h *AnalyticsHandler) CTAs(c *gin.Context) {
	workspace, video, user, ok := resolveScope(c)
	if !ok {
		return
	}
	r, ok := dateRange(c)
	if !ok {
		return
	}
	f := parseFilters(c)
	mode := c.DefaultQuery("mode", "summary")
	interval := c.DefaultQuery("interval", "day")
	sort := c.DefaultQuery("sort", "clicks")
	order := c.DefaultQuery("order", "desc")

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "25"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if cursor := c.Query("cursor"); cursor != "" {
		if cp, err := analyticsDTO.DecodeCursor(cursor); err == nil {
			offset = cp.Offset
		} else {
			c.JSON(400, gin.H{"success": false, "message": "invalid cursor"})
			return
		}
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 20*time.Second)
	defer cancel()

	report, err := h.Service.CTAPerformance(ctx, user, workspace, video, r, f, mode, interval, sort, order, limit, offset)
	writeAnalyticsResult(c, report, err)
}

func (h *AnalyticsHandler) Chapters(c *gin.Context) {
	workspace, video, user, ok := resolveScope(c)
	if !ok {
		return
	}
	r, ok := dateRange(c)
	if !ok {
		return
	}
	f := parseFilters(c)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 20*time.Second)
	defer cancel()

	report, err := h.Service.ChapterUsage(ctx, user, workspace, video, r, f)
	writeAnalyticsResult(c, report, err)
}

func (h *AnalyticsHandler) Captions(c *gin.Context) {
	workspace, video, user, ok := resolveScope(c)
	if !ok {
		return
	}
	r, ok := dateRange(c)
	if !ok {
		return
	}
	f := parseFilters(c)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 20*time.Second)
	defer cancel()

	report, err := h.Service.CaptionUsage(ctx, user, workspace, video, r, f)
	writeAnalyticsResult(c, report, err)
}

func (h *AnalyticsHandler) Heatmap(c *gin.Context) {
	workspace, video, user, ok := resolveScope(c)
	if !ok {
		return
	}
	if video == nil {
		c.JSON(400, gin.H{"success": false, "message": "videoId is required for heatmap"})
		return
	}
	r, ok := dateRange(c)
	if !ok {
		return
	}
	f := parseFilters(c)
	bins, _ := strconv.Atoi(c.DefaultQuery("bins", "100"))
	if bins < 20 {
		bins = 20
	}
	if bins > 200 {
		bins = 200
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 20*time.Second)
	defer cancel()

	report, err := h.Service.Heatmap(ctx, user, workspace, video, r, f, bins)
	writeAnalyticsResult(c, report, err)
}

func (h *AnalyticsHandler) Funnels(c *gin.Context) {
	workspace, video, user, ok := resolveScope(c)
	if !ok {
		return
	}
	r, ok := dateRange(c)
	if !ok {
		return
	}
	f := parseFilters(c)
	template := c.DefaultQuery("template", "inplay_lead")
	windowMinutes, _ := strconv.Atoi(c.DefaultQuery("window_minutes", "30"))

	ctx, cancel := context.WithTimeout(c.Request.Context(), 20*time.Second)
	defer cancel()

	report, err := h.Service.Funnels(ctx, user, workspace, video, r, f, template, windowMinutes)
	writeAnalyticsResult(c, report, err)
}

func (h *AnalyticsHandler) LeadAttribution(c *gin.Context) {
	workspace, video, user, ok := resolveScope(c)
	if !ok {
		return
	}
	r, ok := dateRange(c)
	if !ok {
		return
	}
	dimension := c.DefaultQuery("dimension", "country")

	ctx, cancel := context.WithTimeout(c.Request.Context(), 20*time.Second)
	defer cancel()

	report, err := h.Service.LeadAttribution(ctx, user, workspace, video, r, dimension)
	writeAnalyticsResult(c, report, err)
}

func (h *AnalyticsHandler) SessionMetrics(c *gin.Context) {
	workspace, video, user, ok := resolveScope(c)
	if !ok {
		return
	}
	r, ok := dateRange(c)
	if !ok {
		return
	}
	f := parseFilters(c)
	cohort := c.DefaultQuery("cohort", "play_start")

	ctx, cancel := context.WithTimeout(c.Request.Context(), 20*time.Second)
	defer cancel()

	report, err := h.Service.SessionMetrics(ctx, user, workspace, video, r, f, cohort)
	writeAnalyticsResult(c, report, err)
}

func (h *AnalyticsHandler) Quality(c *gin.Context) {
	workspace, video, user, ok := resolveScope(c)
	if !ok {
		return
	}
	r, ok := dateRange(c)
	if !ok {
		return
	}
	f := parseFilters(c)
	mode := c.DefaultQuery("mode", "summary")
	interval := c.DefaultQuery("interval", "day")

	ctx, cancel := context.WithTimeout(c.Request.Context(), 20*time.Second)
	defer cancel()

	report, err := h.Service.Quality(ctx, user, workspace, video, r, f, mode, interval)
	writeAnalyticsResult(c, report, err)
}

func (h *AnalyticsHandler) CreateExport(c *gin.Context) {
	workspace, video, user, ok := resolveScope(c)
	if !ok {
		return
	}
	var req analyticsDTO.CreateExportReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "message": "invalid export payload: " + err.Error()})
		return
	}

	if h.Exports == nil {
		c.JSON(503, gin.H{"success": false, "message": "export service unavailable"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	job, err := h.Exports.CreateExport(ctx, user, workspace, video, &req)
	if err != nil {
		if appErr, ok := err.(*utils.ApiError); ok {
			c.JSON(appErr.Code, gin.H{"success": false, "message": appErr.Message})
			return
		}
		c.JSON(500, gin.H{"success": false, "message": "failed to create export job: " + err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"success": true, "data": job})
}

func (h *AnalyticsHandler) GetExport(c *gin.Context) {
	workspace, _, user, ok := resolveScope(c)
	if !ok {
		return
	}
	exportID, err := uuid.Parse(c.Param("exportId"))
	if err != nil {
		c.JSON(400, gin.H{"success": false, "message": "invalid exportId UUID"})
		return
	}

	if h.Exports == nil {
		c.JSON(503, gin.H{"success": false, "message": "export service unavailable"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	job, err := h.Exports.GetExport(ctx, user, workspace, exportID)
	if err != nil {
		if appErr, ok := err.(*utils.ApiError); ok {
			c.JSON(appErr.Code, gin.H{"success": false, "message": appErr.Message})
			return
		}
		c.JSON(500, gin.H{"success": false, "message": "failed to get export job"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": job})
}

func (h *AnalyticsHandler) DownloadExport(c *gin.Context) {
	workspace, _, user, ok := resolveScope(c)
	if !ok {
		return
	}
	exportID, err := uuid.Parse(c.Param("exportId"))
	if err != nil {
		c.JSON(400, gin.H{"success": false, "message": "invalid exportId UUID"})
		return
	}

	if h.Exports == nil {
		c.JSON(503, gin.H{"success": false, "message": "export service unavailable"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	filePath, format, fileName, err := h.Exports.DownloadExport(ctx, user, workspace, exportID)
	if err != nil {
		if appErr, ok := err.(*utils.ApiError); ok {
			c.JSON(appErr.Code, gin.H{"success": false, "message": appErr.Message})
			return
		}
		c.JSON(500, gin.H{"success": false, "message": "failed to download export"})
		return
	}

	contentType := "text/csv; charset=utf-8"
	if strings.ToLower(format) == "json" {
		contentType = "application/json"
	}

	c.Header("Content-Type", contentType)
	c.Header("Content-Disposition", `attachment; filename="`+fileName+`"`)
	c.File(filePath)
}

func (h *AnalyticsHandler) CancelExport(c *gin.Context) {
	workspace, _, user, ok := resolveScope(c)
	if !ok {
		return
	}
	exportID, err := uuid.Parse(c.Param("exportId"))
	if err != nil {
		c.JSON(400, gin.H{"success": false, "message": "invalid exportId UUID"})
		return
	}

	if h.Exports == nil {
		c.JSON(503, gin.H{"success": false, "message": "export service unavailable"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	if err := h.Exports.CancelExport(ctx, user, workspace, exportID); err != nil {
		if appErr, ok := err.(*utils.ApiError); ok {
			c.JSON(appErr.Code, gin.H{"success": false, "message": appErr.Message})
			return
		}
		c.JSON(500, gin.H{"success": false, "message": "failed to cancel export"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"canceled": true}})
}
