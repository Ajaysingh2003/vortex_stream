package dto

import "gorm.io/datatypes"

type GeneralSettingsReq struct {
	CtaEnabled bool `json:"ctaEnabled"`
	Autoplay   bool `json:"autoplay"`
	Preload    bool `json:"preload"`
	Loop       bool `json:"loop"`
	Captions   bool `json:"captions"`
}

type ControlSettingsReq struct {
	DownloadButton bool `json:"downloadButton"`
	DisableSeekbar bool `json:"disableSeekbar"`
	ShowControls   bool `json:"showControls"`
	SkipForward    bool `json:"skipForward"`
	SkipBackward   bool `json:"skipBackward"`
	FullScreen     bool `json:"fullScreen"`
	Volume         bool `json:"volume"`
	PlaybackRate   bool `json:"playbackRate"`
	PipButton      bool `json:"popButton"`
	MuteButton     bool `json:"muteButton"`
}

type BrandingSettingsReq struct {
	LogoURL         string `json:"logoUrl"`
	LogoPosition    string `json:"logoPosition"`
	LogoWidth       int    `json:"logoWidth"`
	PrimaryColor    string `json:"primaryColor"`
	AccentColor     string `json:"accentColor"`
	IconColor       string `json:"iconColor"`
	BackgroundColor string `json:"backgroundColor"`
}

type SecuritySettings struct {
	WatermarkEnabled  bool   `json:"watermarkEnabled"`
	WatermarkTextType string `json:"watermarkTextType"`
	WatermarkImage    string `json:"watermarkImage"`
}

type UpdatePlayerReq struct {
	GeneralSettings  *GeneralSettingsReq  `json:"general_settings" binding:"omitempty"`
	ControlSettings  *ControlSettingsReq  `json:"control_settings" binding:"omitempty"`
	BrandingSettings *BrandingSettingsReq `json:"branding_settings" binding:"omitempty"`
	SecuritySettings *SecuritySettings    `json:"security_settings" binding:"omitempty"`
	AdvancedSettings *datatypes.JSON      `json:"advanced_settings" binding:"omitempty"`
}
