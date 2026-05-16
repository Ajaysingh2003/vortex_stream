package middleware

import (
	"strings"

	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-gonic/gin"
)


func AuthMiddleware(jwtMaker *utils.JwtMaker) gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")

        if authHeader == "" {
            c.AbortWithStatusJSON(401, gin.H{"error": "missing authorization header"})
            return
        }

        parts := strings.SplitN(authHeader, " ", 2)
        if len(parts) != 2 || parts[0] != "Bearer" {
            c.AbortWithStatusJSON(401, gin.H{"error": "invalid authorization format"})
            return
        }

        claims, err := jwtMaker.VerifyToken(parts[1])
        if err != nil {
            c.AbortWithStatusJSON(401, gin.H{"error": "unauthorized", "success": false})
            return
        }

        c.Set("user_id", claims.Id)
        c.Set("user_email", claims.Email)
        c.Set("user_role", claims.Role)
        c.Next()
    }
}