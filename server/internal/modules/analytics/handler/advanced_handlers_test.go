package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func TestHeatmapRequiresVideoID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	h := &AnalyticsHandler{}
	r := gin.New()

	userID := uuid.New()
	workspaceID := uuid.New()

	r.Use(func(c *gin.Context) {
		c.Set("user_id", userID)
		c.Next()
	})

	r.GET("/api/v1/workspaces/:workspaceID/analytics/heatmap", h.Heatmap)

	req, _ := http.NewRequest(http.MethodGet, "/api/v1/workspaces/"+workspaceID.String()+"/analytics/heatmap?from=2026-01-01T00:00:00Z&to=2026-01-02T00:00:00Z", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 when videoId is missing, got %d. Body: %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatal(err)
	}
	if resp["message"] != "videoId is required for heatmap" {
		t.Fatalf("unexpected error message: %v", resp["message"])
	}
}

func TestCTAsInvalidCursor(t *testing.T) {
	gin.SetMode(gin.TestMode)

	h := &AnalyticsHandler{}
	r := gin.New()

	userID := uuid.New()
	workspaceID := uuid.New()

	r.Use(func(c *gin.Context) {
		c.Set("user_id", userID)
		c.Next()
	})

	r.GET("/api/v1/workspaces/:workspaceID/analytics/ctas", h.CTAs)

	req, _ := http.NewRequest(http.MethodGet, "/api/v1/workspaces/"+workspaceID.String()+"/analytics/ctas?from=2026-01-01T00:00:00Z&to=2026-01-02T00:00:00Z&cursor=invalid-cursor-string", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for invalid cursor, got %d", w.Code)
	}
}

func TestCreateExportMissingBody(t *testing.T) {
	gin.SetMode(gin.TestMode)

	h := &AnalyticsHandler{}
	r := gin.New()

	userID := uuid.New()
	workspaceID := uuid.New()

	r.Use(func(c *gin.Context) {
		c.Set("user_id", userID)
		c.Next()
	})

	r.POST("/api/v1/workspaces/:workspaceID/analytics/exports", h.CreateExport)

	req, _ := http.NewRequest(http.MethodPost, "/api/v1/workspaces/"+workspaceID.String()+"/analytics/exports", bytes.NewBufferString(`{}`))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for empty create export body, got %d", w.Code)
	}
}
