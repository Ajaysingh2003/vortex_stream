package dto

type File struct {
	Name string `json:"name"`
	Type string `json:"type"`
	Size int64  `json:"size"`
}