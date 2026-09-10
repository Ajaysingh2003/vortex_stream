package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"gorm.io/gorm"
)

type HealthHandler struct {
	db          *gorm.DB
	redisClient *redis.Client
	startTime   time.Time
}

func NewHealthHandler(db *gorm.DB, redisClient *redis.Client) *HealthHandler {
	return &HealthHandler{
		db:          db,
		redisClient: redisClient,
		startTime:   time.Now(),
	}
}

type HealthResponse struct {
	Status    string            `json:"status"`
	Timestamp string            `json:"timestamp"`
	Uptime    string            `json:"uptime"`
	Services  map[string]string `json:"services,omitempty"`
}

// HealthCheck returns server status along with dependent services health.
func (h *HealthHandler) HealthCheck(c *gin.Context) {
	if c.Query("liveness") == "true" {
		c.JSON(http.StatusOK, gin.H{
			"status":    "ok",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
			"uptime":    time.Since(h.startTime).Round(time.Second).String(),
		})
		return
	}

	services := make(map[string]string)
	isHealthy := true

	// Check Database connectivity
	if h.db != nil {
		sqlDB, err := h.db.DB()
		if err != nil {
			services["database"] = "down"
			isHealthy = false
		} else {
			ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
			defer cancel()
			if err := sqlDB.PingContext(ctx); err != nil {
				services["database"] = "down"
				isHealthy = false
			} else {
				services["database"] = "up"
			}
		}
	}

	// Check Redis connectivity
	if h.redisClient != nil {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()
		if err := h.redisClient.Ping(ctx).Err(); err != nil {
			services["redis"] = "down"
			isHealthy = false
		} else {
			services["redis"] = "up"
		}
	}

	status := "ok"
	statusCode := http.StatusOK
	if !isHealthy {
		status = "degraded"
		statusCode = http.StatusServiceUnavailable
	}

	c.JSON(statusCode, HealthResponse{
		Status:    status,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Uptime:    time.Since(h.startTime).Round(time.Second).String(),
		Services:  services,
	})
}

// Ping provides a simple and fast liveness check.
func (h *HealthHandler) Ping(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"message": "pong",
	})
}
