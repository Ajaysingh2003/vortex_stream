package handler

import (
	"context"
	"strconv"
	"time"

	storage "github.com/ajaysingh2003/vortex-stream/internal/shared/config/clickhouse"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (h *AnalyticsHandler) Dashboard(kind string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Cache-Control", "no-store")
		workspace, ok := pathUUID(c, "workspaceID")
		if !ok {
			return
		}
		user, ok := authenticatedUser(c)
		if !ok {
			return
		}
		var video *uuid.UUID
		raw := c.Param("videoId")
		if raw == "" {
			raw = c.Query("videoId")
		}
		if raw != "" {
			id, err := uuid.Parse(raw)
			if err != nil {
				c.JSON(400, gin.H{"message": "videoId must be a UUID"})
				return
			}
			video = &id
		}
		ctx, cancel := context.WithTimeout(c.Request.Context(), 20*time.Second)
		defer cancel()
		if err := h.Service.AuthorizeReport(ctx, user, workspace, video); err != nil {
			writeAnalyticsResult(c, nil, err)
			return
		}
		if kind == "live" {
			data, err := h.Service.Live(ctx, workspace, video)
			writeAnalyticsResult(c, data, err)
			return
		}
		r, ok := dateRange(c)
		if !ok {
			return
		}
		switch kind {
		case "summary":
			data, err := h.Service.Summary(ctx, workspace, video, r)
			writeAnalyticsResult(c, data, err)
		case "concurrency":
			if r.To.Sub(r.From) > 48*time.Hour {
				c.JSON(400, gin.H{"message": "Concurrency range is limited to 48 hours"})
				return
			}
			data, err := h.Service.Concurrency(ctx, workspace, video, r)
			writeAnalyticsResult(c, gin.H{"range": r, "bucket_seconds": 60, "definition": "distinct active sessions observed per minute; not a subsecond peak", "items": data}, err)
		case "engagement":
			if video == nil {
				c.JSON(400, gin.H{"message": "Select a video for retention"})
				return
			}
			data, err := h.Service.Engagement(ctx, workspace, *video, r)
			writeAnalyticsResult(c, gin.H{"range": r, "items": data}, err)
		default:
			dimension := kind
			interval := c.DefaultQuery("interval", "day")
			if kind == "breakdown" {
				dimension = c.DefaultQuery("dimension", "country")
				if _, ok := storage.Dimensions[dimension]; !ok {
					c.JSON(400, gin.H{"message": "Unsupported breakdown dimension"})
					return
				}
			}
			if kind == "series" {
				if _, ok := storage.Intervals[interval]; !ok {
					c.JSON(400, gin.H{"message": "interval must be hour, day or week"})
					return
				}
				if interval == "hour" && r.To.Sub(r.From) > 31*24*time.Hour {
					c.JSON(400, gin.H{"message": "Hourly series is limited to 31 days"})
					return
				}
			}
			limit, err := strconv.Atoi(c.DefaultQuery("limit", "50"))
			if err != nil || limit < 1 || limit > 100 {
				c.JSON(400, gin.H{"message": "limit must be 1–100"})
				return
			}
			offset, err := strconv.Atoi(c.DefaultQuery("offset", "0"))
			if err != nil || offset < 0 || offset > 10000 {
				c.JSON(400, gin.H{"message": "offset must be 0–10000"})
				return
			}
			if kind == "series" {
				limit = 800
				offset = 0
			}
			rows, err := h.Service.DashboardRows(ctx, workspace, video, r, dimension, interval, limit, offset)
			writeAnalyticsResult(c, gin.H{"range": r, "dimension": dimension, "interval": interval, "limit": limit, "offset": offset, "items": rows, "saved_form_counts_available": dimension == "series" || dimension == "video"}, err)
		}
	}
}
