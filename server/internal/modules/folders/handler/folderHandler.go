package handler

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/folders/dto"
	"github.com/ajaysingh2003/vortex-stream/internal/modules/folders/services"
	userServices "github.com/ajaysingh2003/vortex-stream/internal/modules/users/services"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type FolderHandler struct {
	FolderService services.FolderServiceInterface
	UserService userServices.UserServiceInterface
}

func (h *FolderHandler) Create (c *gin.Context){

	workspaceIDRaw:=c.Param("workspaceID")

	workspaceID, err := uuid.Parse(workspaceIDRaw)
	if err!=nil{
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid Workspace ID","success":false})
	}


	var req dto.CreateFolderReqest

	fmt.Print(req,"lol")
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}




	userIdRaw,exists:=c.Get("user_id")

	if !exists{
		c.JSON(http.StatusUnauthorized,gin.H{"message":"Unauthorized","success":true})
		return
	}
	fmt.Print(userIdRaw,"lollol")

	userID, ok := userIdRaw.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to type asseration","success":false})

	}

	user,err:=h.UserService.GetUser(c.Request.Context(), userID)

	if err != nil || !user.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{"message":"You don't have a permission","success":false})
		return
	}

	folder,err:=h.FolderService.Create(c.Request.Context(), &domain.Folder{
		ParentID: req.ParentID,
		Name: req.Name,
		Position: req.Position,
		WorkspaceID: workspaceID,
	} )


	if  err!=nil{
		if appErr, ok := err.(*utils.ApiError); ok {
			c.JSON(appErr.Code, gin.H{ "success":false, "message": utils.ErrMsg(err)})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Something went wrong","success":false})
		return
	}


	c.JSON(http.StatusOK, gin.H{"success":true,"data":folder})


}


func (h *FolderHandler) GetRootFolders (c *gin.Context) {
	
	workspaceIDRaw:=c.Param("workspaceID")

	workspaceID, err := uuid.Parse(workspaceIDRaw)
	if err!=nil{
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid Workspace ID","success":false})
	}

	userIDRaw,exists:=c.Get("user_id")

	if !exists{
		c.JSON(http.StatusUnauthorized,gin.H{"message":"Unauthorized","success":true})
		return
	}

	userID,ok:=userIDRaw.(uuid.UUID)

	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Invalid User ID","success":false})
		return
	}

	data,err:=h.FolderService.GetRootFolders(c.Request.Context(), workspaceID, userID)


	if  err!=nil{
		if appErr, ok := err.(*utils.ApiError); ok {
			c.JSON(appErr.Code, gin.H{ "success":false, "message": utils.ErrMsg(err)})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Something went wrong","success":false})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success":true,"data":data})
}

func (h *FolderHandler) GetChildren (c *gin.Context) {
	
	workspaceIDRaw:=c.Param("workspaceID")
	folderIDRaw:=c.Param("id")

	workspaceID, err := uuid.Parse(workspaceIDRaw)
	if err!=nil{
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid Workspace ID","success":false})
		return
	}

	
	folderID, err := uuid.Parse(folderIDRaw)


	if err!=nil{
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid folder ID","success":false})
		return
	}

	userIDRaw,exists:=c.Get("user_id")

	if !exists{
		c.JSON(http.StatusUnauthorized,gin.H{"message":"Unauthorized","success":false})
		return
	}

	userID,ok:=userIDRaw.(uuid.UUID)
	
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Invalid User ID","success":false})
		return
	}

	data,err:=h.FolderService.GetChildren(c.Request.Context(),folderID,workspaceID,userID)
	
	fmt.Print("leah jaye",data)
	
	if  err!=nil{
		if appErr, ok := err.(*utils.ApiError); ok {
			c.JSON(appErr.Code, gin.H{ "success":false, "message": utils.ErrMsg(err)})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"message": "Something went wrong","success":false})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success":true,"data":data})
}


func (h *FolderHandler) GetByID (c *gin.Context) {

	workspaceIDRaw:=c.Param("workspaceID")

	workspaceID, err := uuid.Parse(workspaceIDRaw)

	if err!=nil{
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid Workspace ID","success":false})
		return
	}

	id,err:=uuid.Parse(c.Param("id"))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid Folder ID","success":false})
		return
	}

	_,exists:=c.Get("user_id")

	if !exists{
		c.JSON(http.StatusUnauthorized,gin.H{"message":"Unauthorized","success":true})
		return
	}

	data,err:=h.FolderService.GetByID(c.Request.Context(), id, workspaceID)


	if  err!=nil{
		if appErr, ok := err.(*utils.ApiError); ok {
			c.JSON(appErr.Code, gin.H{ "success":false, "message": utils.ErrMsg(err)})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Something went wrong","success":false})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success":true,"data":data})
}

func (h *FolderHandler) Move (c *gin.Context) {

	var req struct {
		NewParentID *uuid.UUID `json:"new_parent_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	_,exists:=c.Get("user_id")

	if !exists{
		c.JSON(http.StatusUnauthorized,gin.H{"message":"Unauthorized","success":false})
		return
	}

	workspaceIDRaw:=c.Param("workspaceID")

	workspaceID, err := uuid.Parse(workspaceIDRaw)

	if err!=nil{
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid Workspace ID","success":false})
		return
	}

	id,err:=uuid.Parse(c.Param("id"))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid Folder ID","success":false})
		return
	}


	err=h.FolderService.Relocate(c.Request.Context(), id,req.NewParentID, workspaceID)


	if err != nil {

    var appErr *utils.ApiError
    if errors.As(err, &appErr) {
        c.JSON(appErr.Code, gin.H{
            "success": false,
            "message": utils.ErrMsg(err),
        })
        return
    }

    c.JSON(http.StatusInternalServerError, gin.H{
        "success": false,
        "message": "Something went wrong",
    })
    return
	}

	c.JSON(http.StatusOK, gin.H{"success":true,"message":"Folder Moved Successfully"})
}

func (r *FolderHandler) GetContent (c *gin.Context) {

	userIDRaw,exists:=c.Get("user_id") 

	if !exists{
		c.JSON(http.StatusUnauthorized,gin.H{"message":"Unauthorized","success":true})
		return
	}

	userId,ok:=userIDRaw.(uuid.UUID)

	if !ok {
		c.JSON(http.StatusUnauthorized,gin.H{"message":"Unauthorized","success":false})
		return
	}

	workspaceId,err:=uuid.Parse(c.Param("workspaceID"))

	if err!=nil{
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid Workspace ID","success":false})
		return
	}
	id,err:=uuid.Parse(c.Param("id"))

	if err!=nil{
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid Folder ID","success":false})
		return
	}

	cursor := c.Query("cursor")

	limit:=10
	if l := c.Query("limit"); l != "" {
    parsed, err := strconv.Atoi(l)
    if err == nil && parsed > 0 && parsed <= 100 {
        limit = parsed
    }
	}

	data,err:=r.FolderService.GetContent(c.Request.Context(), id,workspaceId,userId,cursor,limit)


	if err != nil {

    var appErr *utils.ApiError
    if errors.As(err, &appErr) {
        c.JSON(appErr.Code, gin.H{
            "success": false,
            "message": utils.ErrMsg(err),
        })
		return
		
    }
	fmt.Print(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Internal server error"})
    
        return
	}

	fmt.Print(data,"data")
	c.JSON(http.StatusOK, gin.H{"data":data,"success":true})
}

func (h *FolderHandler) GetBreadcrumbsHandler (c *gin.Context) {
	// 1. Extract raw parameters from path or query string
	workspaceIDRaw := c.Param("workspaceID")
	folderIDRaw := c.Param("id") // Or c.Query("id") if passed as a query param

	// 2. Parse mandatory Workspace ID
	workspaceID, err := uuid.Parse(workspaceIDRaw)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid Workspace ID"})
		return
	}

	// 3. Extract and parse Authenticated User ID from your auth middleware context
	userIDValue, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Missing authentication context"})
		return
	}
	userID, ok := userIDValue.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Invalid authentication context format"})
		return
	}

	// 4. Handle root level versus nested folder parameter checks
	if folderIDRaw == "" || folderIDRaw == "null" || folderIDRaw == "undefined" {
		// If there is no folder ID, they are at the root workspace view. 
		// Return an empty array layout immediately to save a DB trip.
		c.JSON(http.StatusOK, gin.H{"success": true, "data": []domain.Folder{}})
		return
	}

	folderID, err := uuid.Parse(folderIDRaw)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid Folder ID"})
		return
	}

	// 5. Execute the Service operation
	ctx := c.Request.Context()
	breadcrumbs, err := h.FolderService.GetFolderBreadcrumbs(ctx, folderID, workspaceID, userID)
	if err != nil {
		// Type-assert to custom API error structures if applicable
		if apiErr, ok := err.(*utils.ApiError); ok {
			c.JSON(apiErr.Code, gin.H{"success": false, "message": apiErr.Message})
			return
		}
		
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to resolve folder path tree"})
		return
	}

	// 6. Return the clean structural path mapping
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    breadcrumbs,
	})
}

func (h *FolderHandler) GetRootData (c *gin.Context){

	userIDRaw,exists:=c.Get("user_id") 

	if !exists{
		c.JSON(http.StatusUnauthorized,gin.H{"message":"Unauthorized","success":true})
		return
	}

	userId,ok:=userIDRaw.(uuid.UUID)

	if !ok {
		c.JSON(http.StatusUnauthorized,gin.H{"message":"Unauthorized","success":false})
		return
	}

	workspaceId,err:=uuid.Parse(c.Param("workspaceID"))

	if err!=nil{
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid Workspace ID","success":false})
		return
	}
	// id,err:=uuid.Parse(c.Param("id"))

	// if err!=nil{
	// 	c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid Folder ID","success":false})
	// 	return
	// }

	cursor := c.Query("cursor")

	limit:=10
	if l := c.Query("limit"); l != "" {
    parsed, err := strconv.Atoi(l)
    if err == nil && parsed > 0 && parsed <= 100 {
        limit = parsed
    }
	}

	fmt.Println(cursor,"sonali")

	data,err:=h.FolderService.GetRootData(c.Request.Context(),workspaceId,userId,cursor,limit)


	if err != nil {

    var appErr *utils.ApiError
    if errors.As(err, &appErr) {
        c.JSON(appErr.Code, gin.H{
            "success": false,
            "message": utils.ErrMsg(err),
        })
		return
		
    }
	fmt.Print(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Internal server error"})
    
        return
	}

	

	c.JSON(http.StatusOK, gin.H{"data":data,"success":true})
}
