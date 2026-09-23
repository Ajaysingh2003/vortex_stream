package analyticsauth

import (
	"fmt"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"os"
	"time"
)

type claims struct {
	VideoID     uuid.UUID `json:"video_id"`
	WorkspaceID uuid.UUID `json:"workspace_id"`
	jwt.RegisteredClaims
}

func Issue(video, workspace uuid.UUID) (string, error) {
	secret := os.Getenv("JWT_SECRET_KEY")
	if secret == "" {
		return "", fmt.Errorf("analytics signing is unavailable")
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims{VideoID: video, WorkspaceID: workspace, RegisteredClaims: jwt.RegisteredClaims{Audience: jwt.ClaimStrings{"player-analytics"}, ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)), IssuedAt: jwt.NewNumericDate(time.Now())}}).SignedString([]byte(secret))
}
func Verify(raw string, video, workspace uuid.UUID) error {
	secret := os.Getenv("JWT_SECRET_KEY")
	if secret == "" {
		return fmt.Errorf("analytics signing is unavailable")
	}
	var payload claims
	_, err := jwt.ParseWithClaims(raw, &payload, func(_ *jwt.Token) (interface{}, error) { return []byte(secret), nil }, jwt.WithValidMethods([]string{"HS256"}), jwt.WithAudience("player-analytics"), jwt.WithExpirationRequired())
	if err != nil || payload.VideoID != video || payload.WorkspaceID != workspace {
		return fmt.Errorf("invalid playback analytics token")
	}
	return nil
}
