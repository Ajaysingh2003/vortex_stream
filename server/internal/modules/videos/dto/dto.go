package dto

import "github.com/ajaysingh2003/vortex-stream/internal/api/domain"

type Metadata struct {
	HasNextPage bool   `json:"hasNextPage"`
	Total       int  `json:"total"`
	NextCursor  string `json:"nextCursor,omitempty"`
}

type VideoContentsDTO struct {
	Metadata Metadata       `json:"metadata"`
	Items    []domain.Video `json:"items"`
}
