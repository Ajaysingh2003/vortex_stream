package handler

import (
	"context"
	"net/http"
	"time"

	analyticsDomain "github.com/ajaysingh2003/vortex-stream/internal/modules/analytics/domain"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/analytics/services"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/geoip"
	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
)

type AnalyticsHandler struct {
	Service *services.AnalyticsService
	Limiter *redis.Client
	GeoIP   *geoip.Resolver
}

func (h *AnalyticsHandler) Ingest(c *gin.Context) {
	// Analytics is intentionally public because embedded players are public, but
	// keep individual requests bounded before decoding arbitrary JSON.
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 1<<20)
	var batch analyticsDomain.Batch
	if err := c.ShouldBindJSON(&batch); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid analytics payload", "error": err.Error()})
		return
	}
	if len(batch.Events) == 0 || len(batch.Events) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "events must contain between 1 and 100 events"})
		return
	}
	if !h.allow(c, len(batch.Events)) {
		return
	}
	country := ""
	if h.GeoIP != nil {
		country = h.GeoIP.Country(c.Request)
	}
	for index := range batch.Events {
		// Country is server-derived. Ignore any client-supplied value.
		batch.Events[index].Country = country
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()
	if err := h.Service.PrepareViewerBatch(ctx, batch.Events); err != nil {
		writeAnalyticsResult(c, nil, err)
		return
	}
	if err := h.Service.PublishBatch(ctx, batch.Events); err != nil {
		writeAnalyticsResult(c, nil, err)
		return
	}
	c.Status(http.StatusAccepted)
}
