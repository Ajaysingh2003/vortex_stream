package handler

import (
	"context"
	"crypto/sha256"
	"fmt"
	"net"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
)

var budgetScript = redis.NewScript(`local n=redis.call('INCRBY',KEYS[1],ARGV[1]); if n==tonumber(ARGV[1]) then redis.call('EXPIRE',KEYS[1],60) end; return n`)

func (h *AnalyticsHandler) allow(c *gin.Context, count int) bool {
	if h.Limiter == nil {
		c.JSON(503, gin.H{"message": "Analytics rate limiter unavailable"})
		return false
	}
	host, _, err := net.SplitHostPort(c.Request.RemoteAddr)
	if err != nil {
		host = c.Request.RemoteAddr
	}
	key := fmt.Sprintf("analytics:budget:%x", sha256.Sum256([]byte(host)))
	ctx, cancel := context.WithTimeout(c.Request.Context(), time.Second)
	defer cancel()
	n, err := budgetScript.Run(ctx, h.Limiter, []string{key}, count).Int()
	if err != nil {
		c.JSON(503, gin.H{"message": "Analytics ingestion temporarily unavailable"})
		return false
	}
	if n > 12000 {
		c.Header("Retry-After", "60")
		c.JSON(429, gin.H{"message": "Analytics rate limit exceeded"})
		return false
	}
	return true
}
