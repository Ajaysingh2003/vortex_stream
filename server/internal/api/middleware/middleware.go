package middleware

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-gonic/gin"
	// "github.com/vickydev03/algo-trading/services/user-service/internal/utils"
	// "github.com/vickydev03/algo-trading/internal/utils"
)



func AuthMiddleware() gin.HandlerFunc {
	// Implement authentication middleware logic here

	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		// fmt.Printf(authHeader,"vickysingh")
		jwtSecret:=os.Getenv("JWT_SECRET_KEY")
		jwtMaker:=utils.NewJwtMaker(jwtSecret)



		if authHeader == "" {
			c.AbortWithStatusJSON(401, gin.H{"error": "missing authorization header"})
			return
		}

		if authHeader == "" ||!strings.HasPrefix(authHeader,"Bearer") {
			c.AbortWithStatusJSON(401, gin.H{"error": "Invalid Token"})
			return
		}

		parts:=strings.Split(authHeader," ")

		if len(parts)!=2 ||parts[0]!="Bearer"{
			c.AbortWithStatusJSON(401,gin.H{"error":"invalid authorization format"})
			return 
		}
		token:=parts[1]
		// tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		
		// utils.VerifyToken(tokenString)
		claims,err:=jwtMaker.VerifyToken(token)
		if err != nil {
			fmt.Print(err,987)
			c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized","success":false})
			return
			
		}

		data,_:=json.MarshalIndent(claims,""," ")

		fmt.Println(string(data),"dtaxx")
		c.Set("user_id", claims.Id)
		c.Set("user_email", claims.Email)
		c.Set("user_role", claims.Role)
		c.Next()
	}
}
