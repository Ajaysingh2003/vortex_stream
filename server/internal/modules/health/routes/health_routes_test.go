package routes

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/ajaysingh2003/vortex-stream/internal/modules/health/handler"
	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func TestSetupHealthRoutes(t *testing.T) {
	r := gin.New()
	h := handler.NewHealthHandler(nil, nil)
	SetupHealthRoutes(r, h)

	endpoints := []string{
		"/health",
		"/healthz",
		"/ping",
		"/api/v1/health",
		"/api/v1/ping",
	}

	for _, endpoint := range endpoints {
		t.Run(endpoint, func(t *testing.T) {
			req, _ := http.NewRequest(http.MethodGet, endpoint, nil)
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			if w.Code != http.StatusOK {
				t.Fatalf("expected status %d for %s, got %d", http.StatusOK, endpoint, w.Code)
			}

			var body map[string]interface{}
			if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
				t.Fatalf("failed to parse json for %s: %v", endpoint, err)
			}

			if body["status"] != "ok" {
				t.Errorf("expected status 'ok' for %s, got %v", endpoint, body["status"])
			}
		})
	}
}
