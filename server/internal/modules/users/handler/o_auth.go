package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	// "time"

	"github.com/ajaysingh2003/vortex-stream/internal/shared/config/auth"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-gonic/gin"

	// "github.com/vickydev03/algo-trading/services/user-service/internal/config/auth"
	// "github.com/vickydev03/algo-trading/services/user-service/internal/utils"
	"golang.org/x/oauth2"
)

type GoogleUser struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
}

// type DeviceInfo struct {
// 	Device         string `json:"device"`
// 	OS             string `json:"os"`
// 	Browser        string `json:"browser"`
// 	BrowserVersion string `json:"browser_version"`
// 	IP             string `json:"ip"`
// 	UserAgent      string `json:"user_agent"`
// }


// type reqData struct {
// 	DeviceInfo DeviceInfo `json:"device_info"`
// }



func (h *UserHandler) GoogleLogin(c *gin.Context) {
	// var req reqData

	// if err := c.ShouldBindJSON(&req); err != nil {
	// 	c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	// 	return
	// }

	conf := auth.GoogleOAuthConfig()
	state,err:=utils.GenerateStateToken()

	if err != nil {
		c.JSON(500, gin.H{"error": "state generation failed"})
		return
	}

	url := conf.AuthCodeURL(state, oauth2.AccessTypeOffline)
	c.JSON(http.StatusOK, gin.H{
		"url":url,
	})

	
}



func (h *UserHandler) GoogleCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "code missing"})
		return
	}

	conf := auth.GoogleOAuthConfig()

	token, err := conf.Exchange(context.Background(), code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token exchange failed"})
		return
	}

	client := conf.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user info"})
		return
	}
	defer resp.Body.Close()

	var googleUser GoogleUser

	if err := json.NewDecoder(resp.Body).Decode(&googleUser); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "decode failed"})
		return
	}
	fmt.Print(json.MarshalIndent(googleUser,""," "))

	fmt.Print(googleUser.ID,"google user data")
	//  careate or just login user
	user, err := h.UserService.FindOrCreateGoogleUser(
		c.Request.Context(),
		googleUser.Email,
		googleUser.Name,
		googleUser.Picture,
		googleUser.ID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error(),"success":false})
		return
	}	
	// data_user,err:=h.UserService.GetUserByEmail(ctx ,  )
	activeWorkspace,err:=h.WorkspacesService.GetDefaultWorkspace(c.Request.Context(), user.ID )

	//  JWT token
	fronted_url:=os.Getenv("FRONTED_URL")
	payload := &utils.Claims{
		Email: user.Email,
		Role:  user.Role,
		Duration: 60*90*time.Hour,
		Id: user.ID,
	}
	
	access_token, _,err := h.JwtToken.GenerateJwt(payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "jwt failed"})
		return
	}
	c.SetCookie(
	"access_token",
	access_token,
	7*24*60*60,
	"/",
	"localhost",
	false,         // set true in production (HTTPS)
	true,          // HttpOnly
	)
	

	c.SetCookie(
	"workspace_id",
	activeWorkspace.ID.String(),
	60*90,    // 90 minutes
	"/",
	"localhost",
	false,         // set true in production (HTTPS)
	true,          // HttpOnly
	)


	c.Redirect(http.StatusTemporaryRedirect,fronted_url)
}
