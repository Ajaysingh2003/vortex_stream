package dto

import (
	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/google/uuid"
)

type Metadata struct {
	HasNextPage bool   `json:"hasNextPage"`
	Total       int  `json:"total"`
	NextCursor  string `json:"nextCursor,omitempty"`
}

type VideoContentsDTO struct {
	Metadata Metadata       `json:"metadata"`
	Items    []domain.Video `json:"items"`
}





type CtaEndScreen struct {
	CtaTitle    string `json:"cta_title"`
	CtaSubTitle string `json:"cta_sub_title"`
	CtaBtnTitle string `json:"cta_btn_title"`
	CtaBtnUrl   string `json:"cta_btn_url"`
}



type SocialLinks struct {
	InstagramUrl string `json:"instagram_url"`
	FacebookUrl  string `json:"facebook_url"`
	MailUrl      string `json:"mail_url"`
	XUrl         string `json:"x_url"`
	LinkedinUrl  string `json:"linkedin_url"`
}



type CustomMessage struct {
	CustomDescription string `json:"custom_description"`
	CustomTitle string `json:"custom_title"`
}



type EndScreenUpsertDTO struct {
	VideoID uuid.UUID                 `json:"video_id" binding:"required"`
	Type    string                 `json:"type" binding:"required,oneof=more_videos cta_action custom_image share_button custom_message"`
	Payload map[string]interface{} `json:"payload" binding:"required"`
}