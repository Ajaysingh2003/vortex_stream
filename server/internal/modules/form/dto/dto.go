package dto


type CreateFormReq struct {
	VideoID     string           `json:"video_id" validate:"required,uuid"`
	WorkspaceID string           `json:"workspace_id" validate:"required,uuid"`
	Placement   string           `json:"placement" validate:"required,oneof=before_video during_video after_video"`
	ShowAt      *float64         `json:"show_at" validate:"omitempty,required_if=Placement during_video"`
	AllowSkip   bool             `json:"allow_skip"`
	Fields      []CreateFieldReq `json:"fields" validate:"required,dive,required"`
}

// CreateFieldReq represents a single field layout config inside the Form creation payload.
type CreateFieldReq struct {
	Label    string            `json:"label" validate:"required"`
	Type     string            `json:"type" validate:"required,oneof=text dropdown checkbox"`
	Position int               `json:"position" validate:"required,min=1"`
	Options  []CreateOptionReq `json:"options" validate:"required_if=Type dropdown required_if=Type checkbox,dive"`
}

// CreateOptionReq represents individual selection items for dynamic Select or Checkbox inputs.
type CreateOptionReq struct {
	Label    string `json:"label" validate:"required"`
	Position int    `json:"position" validate:"required,min=1"`
}