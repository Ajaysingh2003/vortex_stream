package services

import (
	"context"
	"fmt"
	"testing"
	"time"

	model "github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	dto "github.com/ajaysingh2003/vortex-stream/internal/modules/analytics/dto"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type mockWorkspaceRepo struct {
	workspace *model.Workspaces
}

func (m *mockWorkspaceRepo) CreateTx(ctx context.Context, tx *gorm.DB, workspace *model.Workspaces) (*model.Workspaces, error) {
	return nil, nil
}
func (m *mockWorkspaceRepo) Create(ctx context.Context, workspace *model.Workspaces) (*model.Workspaces, error) {
	return nil, nil
}
func (m *mockWorkspaceRepo) GetByID(ctx context.Context, ID uuid.UUID) (*model.Workspaces, error) {
	return m.workspace, nil
}
func (m *mockWorkspaceRepo) GetByUserID(ctx context.Context, userId uuid.UUID) ([]model.Workspaces, error) {
	return nil, nil
}
func (m *mockWorkspaceRepo) GetDefaultWorkspace(ctx context.Context, userID uuid.UUID) (*model.Workspaces, error) {
	return nil, nil
}
func (m *mockWorkspaceRepo) GetWorkspaceWithUserId(ctx context.Context, id, userId uuid.UUID) (*model.Workspaces, error) {
	if m.workspace != nil && m.workspace.ID == id && m.workspace.UserID == userId {
		return m.workspace, nil
	}
	return nil, fmt.Errorf("workspace not found")
}

func TestParseTimeToMS(t *testing.T) {
	tests := []struct {
		input    string
		expected int64
	}{
		{"00:00", 0},
		{"01:23", 83000},
		{"02:15:30", 8130000},
		{"10:00", 600000},
		{"00:01:05", 65000},
		{"45.5", 45500},
		{"0", 0},
		{"100", 100000},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got := parseTimeToMS(tt.input)
			if got != tt.expected {
				t.Fatalf("parseTimeToMS(%q) = %d; expected %d", tt.input, got, tt.expected)
			}
		})
	}
}

func TestExportValidationRules(t *testing.T) {
	user := uuid.New()
	workspace := uuid.New()

	repo := &mockWorkspaceRepo{
		workspace: &model.Workspaces{ID: workspace, UserID: user},
	}
	analytics := &AnalyticsService{
		workspaceRepo: repo,
	}
	svc := &ExportService{analytics: analytics}

	ctx := context.Background()

	// 1. Invalid capability filter
	badFilterReq := &dto.CreateExportReq{
		ReportType: "summary",
		Format:     "csv",
		From:       time.Now().Add(-time.Hour).Format(time.RFC3339),
		To:         time.Now().Format(time.RFC3339),
		Filters:    dto.FilterParams{CTAID: "not-allowed-on-summary"},
	}
	_, err := svc.CreateExport(ctx, user, workspace, nil, badFilterReq)
	if err == nil {
		t.Fatal("expected error when unsupported filter is supplied")
	}
	if apiErr, ok := err.(*utils.ApiError); !ok || apiErr.Code != 400 {
		t.Fatalf("expected ApiError with status 400, got: %v", err)
	}

	// 2. Invalid format
	badFormatReq := &dto.CreateExportReq{
		ReportType: "summary",
		Format:     "xml",
		From:       time.Now().Add(-time.Hour).Format(time.RFC3339),
		To:         time.Now().Format(time.RFC3339),
	}
	_, err = svc.CreateExport(ctx, user, workspace, nil, badFormatReq)
	if err == nil {
		t.Fatal("expected error for invalid export format (xml)")
	}
	if apiErr, ok := err.(*utils.ApiError); !ok || apiErr.Code != 400 {
		t.Fatalf("expected ApiError with status 400, got: %v", err)
	}

	// 3. Unauthorized user
	otherUser := uuid.New()
	_, err = svc.CreateExport(ctx, otherUser, workspace, nil, badFormatReq)
	if err == nil {
		t.Fatal("expected error for unauthorized user")
	}
}

func TestExportJobConversion(t *testing.T) {
	jobID := uuid.New()
	workspaceID := uuid.New()
	videoID := uuid.New()
	now := time.Now().UTC()
	completedAt := now.Add(time.Minute)

	job := &model.AnalyticsExport{
		ID:           jobID,
		WorkspaceID:  workspaceID,
		VideoID:      &videoID,
		ReportType:   "heatmap",
		Format:       "csv",
		Status:       "completed",
		Progress:     100,
		RowCount:     50,
		FileSize:     2048,
		ExpiresAt:    now.Add(24 * time.Hour),
		CreatedAt:    now,
		CompletedAt:  &completedAt,
		ErrorMessage: "",
	}

	jobDTO := toExportJobDTO(job)
	if jobDTO.ID != jobID {
		t.Errorf("expected ID %v, got %v", jobID, jobDTO.ID)
	}
	expectedURL := fmt.Sprintf("/api/v1/workspaces/%s/analytics/exports/%s/download", workspaceID.String(), jobID.String())
	if jobDTO.DownloadURL != expectedURL {
		t.Errorf("unexpected download URL: %s, expected %s", jobDTO.DownloadURL, expectedURL)
	}
	if jobDTO.Status != "completed" {
		t.Errorf("expected completed, got %s", jobDTO.Status)
	}
	if jobDTO.RowCount != 50 || jobDTO.FileSize != 2048 {
		t.Errorf("unexpected counts: %d rows, %d bytes", jobDTO.RowCount, jobDTO.FileSize)
	}

	// For non-completed job, download URL should be empty
	job.Status = "processing"
	pendingDTO := toExportJobDTO(job)
	if pendingDTO.DownloadURL != "" {
		t.Errorf("expected empty download URL for processing job, got %s", pendingDTO.DownloadURL)
	}
}
