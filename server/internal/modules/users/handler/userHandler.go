package handler

import (
	"fmt"
	"net/http"
	"time"
	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/users/services"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UserHandler struct {

	UserService services.UserServiceInterface
	WorkspacesService services.WorkspaceServiceInterface
	JwtToken *utils.JwtMaker
	
}

func (h *UserHandler) Register (c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
		Role     string `json:"role" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	testUUid:=uuid.New()
	fmt.Println(testUUid,"leah jaye")

	data,err:=h.UserService.Create(c.Request.Context(), &domain.User{
		Email:    req.Email,
		Password: req.Password,
		ID: testUUid,
		Role: domain.UserRole(req.Role),
	})

	
	if  err!=nil{
		if appErr, ok := err.(*utils.ApiError); ok {
			c.JSON(appErr.Code, gin.H{ "success":false, "message": appErr.Message})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Something went wrong","success":false})
		return
	}

	if data == nil {
	c.JSON(http.StatusInternalServerError, gin.H{"message": "User creation failed","success":false})
	return
	}
	payload := &utils.Claims{
		Id: data.ID,
		Email: data.Email,
		Role:  data.Role,
		Duration: 24*90*time.Hour,
	}

	access_token,_,err:=h.JwtToken.GenerateJwt(payload)
	
	if (err!=nil){
		c.JSON(http.StatusInternalServerError,gin.H{"message":"Something went wrong!"})
		return
	}

	c.SetCookie(
	"access_token",
	access_token,
	60*90,    // 90 minutes
	"/",
	"localhost",
	false,         // set true in production (HTTPS)
	true,          // HttpOnly
	)

	c.JSON(http.StatusOK, gin.H{"success":true,"message": "User Registed Successfully","access_token":access_token})
}

func (h *UserHandler) Login (c *gin.Context){
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid Request"})
		return
	}
	
	data,err := h.UserService.Login(c.Request.Context(),req.Email, req.Password)
	if err != nil {
		if appErr, ok := err.(*utils.ApiError); ok {
			c.JSON(appErr.Code, gin.H{"message": appErr.Message,"success":false})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Something went wrong"})
		return
	}

	activeWorkspace,err:=h.WorkspacesService.GetDefaultWorkspace(c.Request.Context(), data.ID)
	
	if err != nil {
		if appErr, ok := err.(*utils.ApiError); ok {
			c.JSON(appErr.Code, gin.H{"message": appErr.Message,"success":false})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Something went wrong"})
		return
	}
	payload := &utils.Claims{
	Id:    data.ID,
	Email: data.Email,
	Role:  data.Role,
	Duration:   24 * 90 * time.Minute,
	}

	access_token,access_claims,err:=h.JwtToken.GenerateJwt(payload)

	if (err!=nil){
		c.JSON(http.StatusInternalServerError,gin.H{"message":"Something went wrong!","success":false})
		return
	}

	c.SetCookie(
	"access_token",
	access_token,
	60*90,    // 90 minutes
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

	c.JSON(http.StatusOK, gin.H{"message": "Login successful!","token":access_token,"data":access_claims,"workspace_id":activeWorkspace.ID})
}

func (h *UserHandler) Profile (c *gin.Context){
	userId,exists:=c.Get("user_id")
	if !exists{
		c.JSON(http.StatusUnauthorized,gin.H{"message":"Unauthorized"})
		return
	}
	id, ok := userId.(uuid.UUID)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to type asseration","success":false})
					
		}
	data,err := h.UserService.GetUser(c.Request.Context(),id)
	if err != nil {
		if appErr, ok := err.(*utils.ApiError); ok {
			c.JSON(appErr.Code, gin.H{"message": appErr.Message,"success":false})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Something went wrong"})
		return
	}

	

	c.JSON(http.StatusOK, gin.H{"data":data})
}

func (h *UserHandler) CreateWorkspace (c *gin.Context){

	var req struct {
		Name    string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	userIdRaw,exists:=c.Get("user_id")
	if !exists{
		c.JSON(http.StatusUnauthorized,gin.H{"message":"Unauthorized"})
		return
	}

	userId, ok := userIdRaw.(uuid.UUID)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to type asseration","success":false})
					
		}


		workSpacePayload:=&domain.Workspaces{
			Name: req.Name,
			UserID: userId,
			ID: uuid.New(),
		}

		data,err:=h.WorkspacesService.Create(c.Request.Context(), workSpacePayload)

		if err!=nil{
		c.JSON(http.StatusInternalServerError,gin.H{"message":utils.ErrMsg(err),"success":false})
		return
		}

		c.JSON(http.StatusAccepted,gin.H{"message":"Workspace Created","data":data})
}

func (h *UserHandler) GetWorkspaces (c *gin.Context){

	userIdRaw,exists:=c.Get("user_id")
	if !exists{
		c.JSON(http.StatusUnauthorized,gin.H{"message":"Unauthorized"})
		return
	}

	userId, ok := userIdRaw.(uuid.UUID)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to type asseration","success":false})
					
		}

	data,err:=h.WorkspacesService.GetByUserID(c.Request.Context(), userId)

	if err != nil {
		if appErr, ok := err.(*utils.ApiError); ok {
			c.JSON(appErr.Code, gin.H{"message": appErr.Message,"success":false})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Something went wrong"})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"data":data,"success":true})
}

func (h *UserHandler) GetWorkspace (c *gin.Context){

	workspaceIdRaw:=c.Param("id")

	userIdRaw,exists:=c.Get("user_id")
	if !exists{
		c.JSON(http.StatusUnauthorized,gin.H{"message":"Unauthorized"})
		return
	}
	
	userId, ok := userIdRaw.(uuid.UUID)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to type asseration","success":false})
			return
					
		}

		workspaceID, err := uuid.Parse(workspaceIdRaw)

			if err!=nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to type asseration","success":false})
					return
		}

	data,err:=h.WorkspacesService.GetWorkspace(c.Request.Context(),workspaceID, userId)

	if err != nil {
		if appErr, ok := err.(*utils.ApiError); ok {
			c.JSON(appErr.Code, gin.H{"message": appErr.Message,"success":false})
			return
		}
		fmt.Print(err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Something went wrong"})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"data":data,"success":true})
}

