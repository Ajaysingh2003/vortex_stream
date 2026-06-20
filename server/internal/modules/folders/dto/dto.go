package dto

import (
	"time"

	"github.com/google/uuid"
)



type CreateFolderReqest struct {
	Name     string     `json:"name" binding:"required,min=1,max=255"`
    ParentID *uuid.UUID `json:"parentId"`
    Position int        `json:"position"`
}

type ContentItemDTO struct {
    ID           uuid.UUID   `json:"id"`
    Name         string      `json:"name"`
    Type         string      `json:"type"`
    ThumbnailURL string      `json:"thumbnailUrl,omitempty"`
    Duration     *int        `json:"duration,omitempty"`
    Position     *int        `json:"position,omitempty"`
    ChildCount   *int        `json:"childCount,omitempty"`
    ParentID    **uuid.UUID     `json:"parentId,omitempty"`
    CreatedAt    time.Time   `json:"createdAt"`
}

type Metadata struct {
    HasNextPage bool             `json:"hasNextPage"`
     Total       int64            `json:"total"`
    NextCursor  string           `json:"nextCursor,omitempty"`
}

type FolderContentsDTO struct {
    Metadata    Metadata   `json:"metadata"`
    Items       []ContentItemDTO `json:"items"`
}


type UpdateFolderRequest struct {
    Name string `json:"name" binding:"required"`
}