package dto

import (
	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/google/uuid"
)

type Metadata struct {
	HasNextPage bool   `json:"hasNextPage"`
	Total       int    `json:"total"`
	NextCursor  string `json:"nextCursor,omitempty"`
}

type VideoContentsDTO struct {
	Metadata Metadata       `json:"metadata"`
	Items    []domain.Video `json:"items"`
}

// VideoOverviewDTO is the aggregate data shown by the video library overview
// card. Queue is included in Pending because both states represent videos that
// have not yet begun processing.
type VideoOverviewDTO struct {
	TotalVideos     int64                   `json:"totalVideos"`
	StatusBreakdown VideoStatusBreakdownDTO `json:"statusBreakdown"`
}

type VideoStatusBreakdownDTO struct {
	Ready      int64 `json:"ready"`
	Processing int64 `json:"processing"`
	Pending    int64 `json:"pending"`
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
	CustomTitle       string `json:"custom_title"`
}

type EndScreenUpsertDTO struct {
	VideoID uuid.UUID              `json:"video_id" binding:"required"`
	Type    string                 `json:"type" binding:"required,oneof=more_videos cta_action custom_image share_button custom_message"`
	Payload map[string]interface{} `json:"payload" binding:"required"`
}

type SubtitleItemInput struct {
	FileName    string `json:"file_name" binding:"required"`
	Code        string `json:"code" binding:"required"`
	Label       string `json:"label" binding:"required"`
	SubtitleUrl string `json:"subtitle_url" binding:"required"`
}

type VideoChapterInput struct {
	Time  string `json:"time" binding:"required"`
	Label string `json:"label" binding:"required"`
}

type VideoReq struct {

	// Assumed mapping payload token from your layout configuration setup
	VideoID string              `json:"video_id" binding:"required,uuid"`
	Items   []SubtitleItemInput `json:"items" binding:"required,dive"`
}

type VideoChapterReq struct {

	// Assumed mapping payload token from your layout configuration setup
	VideoID string              `json:"video_id" binding:"required,uuid"`
	Items   []VideoChapterInput `json:"items" binding:"required,dive"`
}

type VideoCtaInput struct {
	Title           string `json:"title" binding:"required"`
	StartTime       string `json:"start_time" binding:"required"`
	EndTime         string `json:"end_time" binding:"required"`
	Url             string `json:"url" binding:"required"`
	Position        string `json:"position" binding:"required,oneof=top-left top_right bottom_left bottom_right center"`
	OpenIn          string `json:"open_in" binding:"required,oneof=same_tab new_tab"`
	FontColor       string `json:"font_color" binding:"omitempty,hexcolor"`
	BackgroundColor string `json:"background_color" binding:"omitempty,hexcolor"`
}

type VideoCtaReq struct {

	// Assumed mapping payload token from your layout configuration setup
	VideoID string          `json:"video_id" binding:"required,uuid"`
	Items   []VideoCtaInput `json:"items" binding:"required,dive"`
}

type FilterOptions struct {
	Date       *string `json:"date,omitempty"`
	Visibility *string `json:"visibility,omitempty"`
	Sort       *string `json:"sort,omitempty"`
}
