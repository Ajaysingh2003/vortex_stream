package analyticsauth

import (
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"testing"
	"time"
)

func TestPlaybackTokenScopeAndExpiry(t *testing.T) {
	t.Setenv("JWT_SECRET_KEY", "analytics-test-secret")
	video, workspace := uuid.New(), uuid.New()
	token, err := Issue(video, workspace)
	if err != nil {
		t.Fatal(err)
	}
	if err = Verify(token, video, workspace); err != nil {
		t.Fatal(err)
	}
	if Verify(token, uuid.New(), workspace) == nil || Verify(token, video, uuid.New()) == nil {
		t.Fatal("accepted another video's scope")
	}
	expired, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims{VideoID: video, WorkspaceID: workspace, RegisteredClaims: jwt.RegisteredClaims{Audience: jwt.ClaimStrings{"player-analytics"}, ExpiresAt: jwt.NewNumericDate(time.Now().Add(-time.Hour))}}).SignedString([]byte("analytics-test-secret"))
	if err != nil {
		t.Fatal(err)
	}
	if Verify(expired, video, workspace) == nil {
		t.Fatal("accepted expired token")
	}
	t.Setenv("JWT_SECRET_KEY", "")
	if _, err = Issue(video, workspace); err == nil {
		t.Fatal("issued without secret")
	}
}
