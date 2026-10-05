package services

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	model "github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	dto "github.com/ajaysingh2003/vortex-stream/internal/modules/analytics/dto"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type ExportService struct {
	analytics *AnalyticsService
	db        *gorm.DB
	exportDir string
}

func NewExportService(analytics *AnalyticsService, db *gorm.DB, exportDir string) *ExportService {
	if exportDir == "" {
		exportDir = filepath.Join("tmp", "exports")
	}
	_ = os.MkdirAll(exportDir, 0755)
	return &ExportService{
		analytics: analytics,
		db:        db,
		exportDir: exportDir,
	}
}

func (s *ExportService) CreateExport(ctx context.Context, user, workspace uuid.UUID, video *uuid.UUID, req *dto.CreateExportReq) (*dto.ExportJobDTO, error) {
	if err := s.analytics.AuthorizeReport(ctx, user, workspace, video); err != nil {
		return nil, err
	}
	reportType := req.ReportType
	if reportType == "" {
		reportType = "exports"
	}
	if err := dto.ValidateCapabilities(reportType, req.Filters); err != nil {
		return nil, &utils.ApiError{Code: 400, Message: err.Error()}
	}

	// 1. Idempotency check
	if req.IdempotencyKey != "" {
		var existing model.AnalyticsExport
		if err := s.db.WithContext(ctx).Where("workspace_id = ? AND idempotency_key = ?", workspace, req.IdempotencyKey).First(&existing).Error; err == nil {
			return toExportJobDTO(&existing), nil
		}
	}

	format := strings.ToLower(req.Format)
	if format == "" {
		format = "csv"
	}
	if format != "csv" && format != "json" {
		return nil, &utils.ApiError{Code: 400, Message: "format must be csv or json"}
	}

	paramsBytes, _ := json.Marshal(req)
	job := model.AnalyticsExport{
		ID:             uuid.New(),
		WorkspaceID:    workspace,
		VideoID:        video,
		UserID:         user,
		ReportType:     req.ReportType,
		Format:         format,
		Params:         datatypes.JSON(paramsBytes),
		IdempotencyKey: req.IdempotencyKey,
		Status:         "queued",
		Progress:       0,
		ExpiresAt:      time.Now().UTC().Add(24 * time.Hour),
		CreatedAt:      time.Now().UTC(),
		UpdatedAt:      time.Now().UTC(),
	}

	if err := s.db.WithContext(ctx).Create(&job).Error; err != nil {
		return nil, fmt.Errorf("create export job: %w", err)
	}

	return toExportJobDTO(&job), nil
}

func (s *ExportService) GetExport(ctx context.Context, user, workspace uuid.UUID, exportID uuid.UUID) (*dto.ExportJobDTO, error) {
	if err := s.analytics.AuthorizeReport(ctx, user, workspace, nil); err != nil {
		return nil, err
	}
	var job model.AnalyticsExport
	if err := s.db.WithContext(ctx).Where("id = ? AND workspace_id = ?", exportID, workspace).First(&job).Error; err != nil {
		return nil, &utils.ApiError{Code: 404, Message: "Export job not found"}
	}
	return toExportJobDTO(&job), nil
}

func (s *ExportService) DownloadExport(ctx context.Context, user, workspace uuid.UUID, exportID uuid.UUID) (string, string, string, error) {
	if err := s.analytics.AuthorizeReport(ctx, user, workspace, nil); err != nil {
		return "", "", "", err
	}
	var job model.AnalyticsExport
	if err := s.db.WithContext(ctx).Where("id = ? AND workspace_id = ?", exportID, workspace).First(&job).Error; err != nil {
		return "", "", "", &utils.ApiError{Code: 404, Message: "Export not found"}
	}
	if job.Status != "completed" {
		return "", "", "", &utils.ApiError{Code: 400, Message: fmt.Sprintf("Export is %s", job.Status)}
	}
	if job.ExpiresAt.Before(time.Now().UTC()) {
		return "", "", "", &utils.ApiError{Code: 410, Message: "Export artifact has expired"}
	}
	if _, err := os.Stat(job.FilePath); os.IsNotExist(err) {
		return "", "", "", &utils.ApiError{Code: 404, Message: "Export artifact file not found"}
	}
	fileName := fmt.Sprintf("analytics_%s_%s.%s", job.ReportType, job.ID.String()[:8], job.Format)
	return job.FilePath, job.Format, fileName, nil
}

func (s *ExportService) CancelExport(ctx context.Context, user, workspace uuid.UUID, exportID uuid.UUID) error {
	if err := s.analytics.AuthorizeReport(ctx, user, workspace, nil); err != nil {
		return err
	}
	var job model.AnalyticsExport
	if err := s.db.WithContext(ctx).Where("id = ? AND workspace_id = ?", exportID, workspace).First(&job).Error; err != nil {
		return &utils.ApiError{Code: 404, Message: "Export not found"}
	}
	if job.Status == "completed" || job.Status == "expired" {
		if job.FilePath != "" {
			_ = os.Remove(job.FilePath)
		}
	}
	return s.db.WithContext(ctx).Model(&job).Updates(map[string]interface{}{
		"status":     "canceled",
		"updated_at": time.Now().UTC(),
	}).Error
}

// Run executes the background export processor
func (s *ExportService) Run(ctx context.Context) {
	ticker := time.NewTicker(3 * time.Second)
	cleanerTicker := time.NewTicker(30 * time.Minute)
	defer ticker.Stop()
	defer cleanerTicker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.processNextJob(ctx)
		case <-cleanerTicker.C:
			s.cleanExpiredArtifacts(ctx)
		}
	}
}

func (s *ExportService) processNextJob(ctx context.Context) {
	var job model.AnalyticsExport
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("status = 'queued'").Order("created_at ASC").First(&job).Error; err != nil {
			return err
		}
		return tx.Model(&job).Updates(map[string]interface{}{
			"status":     "running",
			"progress":   10,
			"updated_at": time.Now().UTC(),
		}).Error
	})
	if err != nil {
		return
	}

	var req dto.CreateExportReq
	_ = json.Unmarshal(job.Params, &req)

	filePath := filepath.Join(s.exportDir, fmt.Sprintf("%s.%s", job.ID.String(), job.Format))
	rowCount, err := s.generateReportFile(ctx, &job, &req, filePath)
	if err != nil {
		_ = s.db.WithContext(ctx).Model(&job).Updates(map[string]interface{}{
			"status":        "failed",
			"error_message": err.Error(),
			"updated_at":    time.Now().UTC(),
		}).Error
		return
	}

	fi, _ := os.Stat(filePath)
	var fileSize int64
	if fi != nil {
		fileSize = fi.Size()
	}
	now := time.Now().UTC()
	_ = s.db.WithContext(ctx).Model(&job).Updates(map[string]interface{}{
		"status":       "completed",
		"progress":     100,
		"file_path":    filePath,
		"file_size":    fileSize,
		"row_count":    rowCount,
		"completed_at": &now,
		"updated_at":   now,
	}).Error
}

func (s *ExportService) generateReportFile(ctx context.Context, job *model.AnalyticsExport, req *dto.CreateExportReq, targetPath string) (int64, error) {
	f, err := os.Create(targetPath)
	if err != nil {
		return 0, fmt.Errorf("create target export file: %w", err)
	}
	defer f.Close()

	r, ok := parseExportDateRange(req.From, req.To)
	if !ok {
		return 0, fmt.Errorf("invalid export date range")
	}

	var rows [][]string
	var headers []string

	switch job.ReportType {
	case "ctas":
		headers = []string{"VideoID", "CTAID", "Title", "URLOrigin", "Position", "ExposureEvents", "ExposedSessions", "ClickEvents", "ClickingSessions", "ClickRate", "AvgTimeToClickMS", "PostClickSavedLeads"}
		report, err := s.analytics.CTAPerformance(ctx, job.UserID, job.WorkspaceID, job.VideoID, r, req.Filters, "", "", "clicks", "desc", 10000, 0)
		if err != nil {
			return 0, err
		}
		for _, item := range report.Items {
			rows = append(rows, []string{
				item.VideoID.String(),
				dto.EscapeCSVCell(item.CTAID),
				dto.EscapeCSVCell(item.Title),
				dto.EscapeCSVCell(item.URLOrigin),
				dto.EscapeCSVCell(item.Position),
				strconv.FormatUint(item.ExposureEvents, 10),
				strconv.FormatUint(item.ExposedSessions, 10),
				strconv.FormatUint(item.ClickEvents, 10),
				strconv.FormatUint(item.ClickingSessions, 10),
				fmt.Sprintf("%.2f%%", item.ClickRate),
				fmt.Sprintf("%.2f", item.AvgTimeToClickMS),
				strconv.FormatUint(item.PostClickSavedLeads, 10),
			})
		}
	case "chapters":
		headers = []string{"VideoID", "ChapterID", "Title", "StartMS", "NavigationClicks", "NavigatingSessions", "ViewingSessions", "PlaybackMS", "CompletionRate"}
		report, err := s.analytics.ChapterUsage(ctx, job.UserID, job.WorkspaceID, job.VideoID, r, req.Filters)
		if err != nil {
			return 0, err
		}
		for _, item := range report.Items {
			rows = append(rows, []string{
				item.VideoID.String(),
				dto.EscapeCSVCell(item.ChapterID),
				dto.EscapeCSVCell(item.Title),
				strconv.FormatInt(item.StartMS, 10),
				strconv.FormatUint(item.NavigationClicks, 10),
				strconv.FormatUint(item.NavigatingSessions, 10),
				strconv.FormatUint(item.ViewingSessions, 10),
				strconv.FormatUint(item.PlaybackMS, 10),
				fmt.Sprintf("%.2f%%", item.CompletionRate),
			})
		}
	case "captions":
		headers = []string{"VideoID", "TrackID", "Language", "Label", "Source", "Sessions", "CaptionPlaybackMS", "UsageRate"}
		report, err := s.analytics.CaptionUsage(ctx, job.UserID, job.WorkspaceID, job.VideoID, r, req.Filters)
		if err != nil {
			return 0, err
		}
		for _, item := range report.Tracks {
			rows = append(rows, []string{
				item.VideoID.String(),
				dto.EscapeCSVCell(item.TrackID),
				dto.EscapeCSVCell(item.Language),
				dto.EscapeCSVCell(item.Label),
				dto.EscapeCSVCell(item.Source),
				strconv.FormatUint(item.Sessions, 10),
				strconv.FormatUint(item.CaptionPlaybackMS, 10),
				fmt.Sprintf("%.2f%%", item.UsageRate),
			})
		}
	case "lead_attribution":
		headers = []string{"DimensionValue", "SavedSubmissions", "SkippedSubmissions", "TotalSubmissions", "SharePercent"}
		report, err := s.analytics.LeadAttribution(ctx, job.UserID, job.WorkspaceID, job.VideoID, r, req.Dimension)
		if err != nil {
			return 0, err
		}
		for _, item := range report.Items {
			rows = append(rows, []string{
				dto.EscapeCSVCell(item.DimensionValue),
				strconv.FormatUint(item.SavedSubmissions, 10),
				strconv.FormatUint(item.SkippedSubmissions, 10),
				strconv.FormatUint(item.TotalSubmissions, 10),
				fmt.Sprintf("%.2f%%", item.SharePercent),
			})
		}
	case "quality":
		headers = []string{"Cohort", "EligibleSessions", "StartedSessions", "StartupMeanMS", "RebufferRatio", "ErrorSessionRate"}
		report, err := s.analytics.Quality(ctx, job.UserID, job.WorkspaceID, job.VideoID, r, req.Filters, "summary", "")
		if err != nil {
			return 0, err
		}
		if report.Summary != nil {
			rows = append(rows, []string{
				report.Summary.Cohort,
				strconv.FormatUint(report.Summary.EligibleSessions, 10),
				strconv.FormatUint(report.Summary.StartedSessions, 10),
				fmt.Sprintf("%.2f", report.Summary.StartupMeanMS),
				fmt.Sprintf("%.4f", report.Summary.RebufferRatio),
				fmt.Sprintf("%.2f%%", report.Summary.PlaybackErrorSessionRate),
			})
		}
	default: // summary / fallback
		headers = []string{"Views", "UniqueViewers", "Impressions", "PlaybackMS", "Completions", "FormSubmissions", "CTAClicks"}
		summary, err := s.analytics.Summary(ctx, job.WorkspaceID, job.VideoID, r)
		if err != nil {
			return 0, err
		}
		rows = append(rows, []string{
			strconv.FormatUint(summary.Current.Views, 10),
			strconv.FormatUint(summary.Current.UniqueViewers, 10),
			strconv.FormatUint(summary.Current.Impressions, 10),
			strconv.FormatUint(summary.Current.PlaybackMS, 10),
			strconv.FormatUint(summary.Current.Completions, 10),
			strconv.FormatUint(summary.Current.FormSubmissions, 10),
			strconv.FormatUint(summary.Current.CTAClicks, 10),
		})
	}

	if job.Format == "json" {
		var jsonRecords []map[string]string
		for _, row := range rows {
			record := make(map[string]string)
			for i, val := range row {
				if i < len(headers) {
					record[headers[i]] = val
				}
			}
			jsonRecords = append(jsonRecords, record)
		}
		b, err := json.MarshalIndent(jsonRecords, "", "  ")
		if err != nil {
			return 0, err
		}
		if _, err := f.Write(b); err != nil {
			return 0, err
		}
		return int64(len(rows)), nil
	}

	// CSV writing with formula injection escaping
	w := csv.NewWriter(f)
	if err := w.Write(headers); err != nil {
		return 0, err
	}
	for _, row := range rows {
		if err := w.Write(row); err != nil {
			return 0, err
		}
	}
	w.Flush()
	return int64(len(rows)), w.Error()
}

func (s *ExportService) cleanExpiredArtifacts(ctx context.Context) {
	now := time.Now().UTC()
	var expiredJobs []model.AnalyticsExport
	if err := s.db.WithContext(ctx).Where("expires_at < ? AND status = 'completed'", now).Find(&expiredJobs).Error; err != nil {
		return
	}
	for _, job := range expiredJobs {
		if job.FilePath != "" {
			_ = os.Remove(job.FilePath)
		}
		_ = s.db.WithContext(ctx).Model(&job).Updates(map[string]interface{}{
			"status":     "expired",
			"updated_at": now,
		}).Error
	}
}

func toExportJobDTO(job *model.AnalyticsExport) *dto.ExportJobDTO {
	downloadURL := ""
	if job.Status == "completed" {
		downloadURL = fmt.Sprintf("/api/v1/workspaces/%s/analytics/exports/%s/download", job.WorkspaceID.String(), job.ID.String())
	}
	return &dto.ExportJobDTO{
		ID:           job.ID,
		WorkspaceID:  job.WorkspaceID,
		VideoID:      job.VideoID,
		ReportType:   job.ReportType,
		Format:       job.Format,
		Status:       job.Status,
		Progress:     job.Progress,
		RowCount:     job.RowCount,
		FileSize:     job.FileSize,
		DownloadURL:  downloadURL,
		ErrorMessage: job.ErrorMessage,
		ExpiresAt:    job.ExpiresAt,
		CreatedAt:    job.CreatedAt,
		CompletedAt:  job.CompletedAt,
	}
}

func parseExportDateRange(fromStr, toStr string) (dto.DateRange, bool) {
	from, err1 := time.Parse(time.RFC3339, fromStr)
	if err1 != nil {
		from, err1 = time.Parse("2006-01-02", fromStr)
	}
	to, err2 := time.Parse(time.RFC3339, toStr)
	if err2 != nil {
		to, err2 = time.Parse("2006-01-02", toStr)
		if err2 == nil {
			to = to.Add(24 * time.Hour)
		}
	}
	if err1 != nil || err2 != nil || !to.After(from) {
		now := time.Now().UTC()
		return dto.DateRange{From: now.Add(-30 * 24 * time.Hour), To: now}, true
	}
	return dto.DateRange{From: from.UTC(), To: to.UTC()}, true
}
