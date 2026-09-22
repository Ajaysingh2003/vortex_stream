package handler

import (
	"context"
	"fmt"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/ajaysingh2003/vortex-stream/internal/modules/form/dto"
	services "github.com/ajaysingh2003/vortex-stream/internal/modules/form/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type captureFormService struct {
	services.FormServiceInterface
	saved *dto.CreateFormReq
}

func (s *captureFormService) Create(_ context.Context, form *dto.CreateFormReq, _ uuid.UUID) error {
	s.saved = form
	return nil
}

func TestUpsertPreservesScheduledFormTime(t *testing.T) {
	gin.SetMode(gin.TestMode)
	for _, placement := range []string{"before_video", "during_video", "after_video"} {
		t.Run(placement, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(recorder)
			c.Params = gin.Params{{Key: "workspaceId", Value: uuid.NewString()}, {Key: "id", Value: uuid.NewString()}}
			c.Set("user_id", uuid.New())
			c.Request = httptest.NewRequest("POST", "/form", strings.NewReader(fmt.Sprintf(`{"placement":%q,"show_at":12.5,"allow_skip":true,"fields":[]}`, placement)))
			c.Request.Header.Set("Content-Type", "application/json")
			service := &captureFormService{}
			(&FormHandler{FormService: service}).UpsertForm(c)
			if recorder.Code != 200 {
				t.Fatalf("unexpected response: %s", recorder.Body.String())
			}
			if service.saved == nil || service.saved.ShowAt == nil || *service.saved.ShowAt != 12.5 {
				t.Fatal("saved form lost its scheduled time")
			}
			if service.saved.Placement != placement || !service.saved.AllowSkip {
				t.Fatal("saved form lost its placement or skip preference")
			}
		})
	}
}
