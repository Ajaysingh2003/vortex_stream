package services

import (
	"context"
	"fmt"
	"strings"
	"time"

	model "github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	dto "github.com/ajaysingh2003/vortex-stream/internal/modules/analytics/dto"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/google/uuid"
)

// CTAPerformance generates per-CTA performance and optional series
func (s *AnalyticsService) CTAPerformance(ctx context.Context, user, workspace uuid.UUID, video *uuid.UUID, r dto.DateRange, f dto.FilterParams, mode, interval, sort, order string, limit, offset int) (*dto.CTAPerformanceReport, error) {
	if err := s.AuthorizeReport(ctx, user, workspace, video); err != nil {
		return nil, err
	}
	if err := dto.ValidateCapabilities("ctas", f); err != nil {
		return nil, &utils.ApiError{Code: 400, Message: err.Error()}
	}

	client, err := s.queryClient()
	if err != nil {
		return nil, err
	}

	report := &dto.CTAPerformanceReport{
		ReportMetadata: dto.ReportMetadata{
			Scope:         dto.ScopeMetadata{WorkspaceID: workspace, VideoID: video},
			Range:         r,
			MetricVersion: 2,
			TimeBasis:     "event_activity",
			FilterBasis:   "session_entry",
			AsOf:          time.Now().UTC(),
		},
	}

	if mode == "series" {
		if interval == "" {
			interval = "day"
		}
		points, err := client.CTASeries(ctx, workspace, video, r, f.CTAID, interval)
		if err != nil {
			return nil, err
		}
		report.Series = points
		return report, nil
	}

	if limit <= 0 || limit > 100 {
		limit = 25
	}
	rows, err := client.CTAPerformance(ctx, workspace, video, r, f.CTAID, sort, order, limit, offset)
	if err != nil {
		return nil, err
	}

	// Enrich CTA metadata from PostgreSQL
	var ctaSettings []model.VideoCtaSetting
	ctaQuery := s.DB.WithContext(ctx)
	if video != nil {
		ctaQuery = ctaQuery.Where("video_id = ?", *video)
	} else {
		ctaQuery = ctaQuery.Joins("JOIN video ON video.id = video_cta_setting.video_id").Where("video.workspace_id = ?", workspace)
	}
	_ = ctaQuery.Find(&ctaSettings).Error

	ctaMap := make(map[string]model.VideoCtaSetting)
	for _, cta := range ctaSettings {
		ctaMap[cta.ID.String()] = cta
	}

	for i := range rows {
		if setting, ok := ctaMap[rows[i].CTAID]; ok {
			rows[i].Title = setting.Title
			rows[i].Position = setting.Position
			rows[i].URLOrigin = dto.SafeOrigin(setting.URL)
		} else if rows[i].Title == "" {
			rows[i].Title = "Deleted or Unnamed CTA"
		}
	}

	report.Items = rows
	if len(rows) == limit {
		nextC := dto.EncodeCursor(offset+limit, report.AsOf, sort, order)
		report.NextCursor = &nextC
	}
	return report, nil
}

// ChapterUsage generates chapter navigation, viewed wall-time and completion stats
func (s *AnalyticsService) ChapterUsage(ctx context.Context, user, workspace uuid.UUID, video *uuid.UUID, r dto.DateRange, f dto.FilterParams) (*dto.ChaptersReport, error) {
	if err := s.AuthorizeReport(ctx, user, workspace, video); err != nil {
		return nil, err
	}
	if err := dto.ValidateCapabilities("chapters", f); err != nil {
		return nil, &utils.ApiError{Code: 400, Message: err.Error()}
	}

	client, err := s.queryClient()
	if err != nil {
		return nil, err
	}

	report := &dto.ChaptersReport{
		ReportMetadata: dto.ReportMetadata{
			Scope:         dto.ScopeMetadata{WorkspaceID: workspace, VideoID: video},
			Range:         r,
			MetricVersion: 2,
			TimeBasis:     "media_coverage",
			AsOf:          time.Now().UTC(),
		},
	}

	// 1. Load registered chapters from PostgreSQL
	var chapters []model.VideoChapters
	chQ := s.DB.WithContext(ctx)
	if video != nil {
		chQ = chQ.Where("video_id = ?", *video)
	} else {
		chQ = chQ.Joins("JOIN video ON video.id = video_chapters.video_id").Where("video.workspace_id = ?", workspace)
	}
	_ = chQ.Order("time ASC").Find(&chapters).Error

	// 2. Query ClickHouse chapter interaction
	chMetrics, err := client.ChapterUsage(ctx, workspace, video, r, f.ChapterID)
	if err != nil {
		return nil, err
	}
	metricsMap := make(map[string]dto.ChapterRow)
	for _, m := range chMetrics {
		metricsMap[m.ChapterID] = m
	}

	var items []dto.ChapterRow
	for _, ch := range chapters {
		m := metricsMap[ch.ID.String()]
		startMS := parseTimeToMS(ch.Time)
		row := dto.ChapterRow{
			VideoID:            ch.VideoID,
			ChapterID:          ch.ID.String(),
			Title:              ch.Label,
			StartMS:            startMS,
			NavigationClicks:   m.NavigationClicks,
			NavigatingSessions: m.NavigatingSessions,
			ViewingSessions:    m.ViewingSessions,
			PlaybackMS:         m.PlaybackMS,
		}
		if row.ViewingSessions > 0 {
			row.CompletionRate = float64(row.CompletedSessions) / float64(row.ViewingSessions) * 100
		}
		items = append(items, row)
	}

	// Also append any historical chapters that had telemetry but may have been deleted
	for id, m := range metricsMap {
		found := false
		for _, ch := range chapters {
			if ch.ID.String() == id {
				found = true
				break
			}
		}
		if !found {
			m.Title = "Deleted Chapter"
			items = append(items, m)
		}
	}

	report.Items = items
	return report, nil
}

// CaptionUsage generates track availability, usage rate, and manual selections
func (s *AnalyticsService) CaptionUsage(ctx context.Context, user, workspace uuid.UUID, video *uuid.UUID, r dto.DateRange, f dto.FilterParams) (*dto.CaptionsReport, error) {
	if err := s.AuthorizeReport(ctx, user, workspace, video); err != nil {
		return nil, err
	}
	if err := dto.ValidateCapabilities("captions", f); err != nil {
		return nil, &utils.ApiError{Code: 400, Message: err.Error()}
	}

	client, err := s.queryClient()
	if err != nil {
		return nil, err
	}

	report, err := client.CaptionUsage(ctx, workspace, video, r, f.SubtitleTrackID)
	if err != nil {
		return nil, err
	}
	report.ReportMetadata = dto.ReportMetadata{
		Scope:         dto.ScopeMetadata{WorkspaceID: workspace, VideoID: video},
		Range:         r,
		MetricVersion: 2,
		TimeBasis:     "event_activity",
		AsOf:          time.Now().UTC(),
	}

	// Enrich track labels from PostgreSQL
	var subtitles []model.VideoSubtitle
	subQ := s.DB.WithContext(ctx)
	if video != nil {
		subQ = subQ.Where("video_id = ?", *video)
	} else {
		subQ = subQ.Joins("JOIN video ON video.id = video_subtitle.video_id").Where("video.workspace_id = ?", workspace)
	}
	_ = subQ.Find(&subtitles).Error

	subMap := make(map[string]model.VideoSubtitle)
	for _, sub := range subtitles {
		subMap[sub.Code] = sub
		subMap[fmt.Sprintf("%d", sub.ID)] = sub
	}

	for i := range report.Tracks {
		if sub, ok := subMap[report.Tracks[i].TrackID]; ok {
			report.Tracks[i].Label = sub.Label
			if report.Tracks[i].Language == "" {
				report.Tracks[i].Language = sub.Code
			}
		} else if report.Tracks[i].Label == "" {
			report.Tracks[i].Label = report.Tracks[i].Language
		}
	}

	return report, nil
}

// Heatmap generates actual watched-segment timeline bins
func (s *AnalyticsService) Heatmap(ctx context.Context, user, workspace uuid.UUID, video *uuid.UUID, r dto.DateRange, f dto.FilterParams, bins int) (*dto.HeatmapReport, error) {
	if video == nil {
		return nil, &utils.ApiError{Code: 400, Message: "Select a video for heatmap"}
	}
	if err := s.AuthorizeReport(ctx, user, workspace, video); err != nil {
		return nil, err
	}
	if err := dto.ValidateCapabilities("heatmap", f); err != nil {
		return nil, &utils.ApiError{Code: 400, Message: err.Error()}
	}

	var vid model.Video
	if err := s.DB.WithContext(ctx).Where("id = ? AND workspace_id = ?", *video, workspace).First(&vid).Error; err != nil {
		return nil, &utils.ApiError{Code: 404, Message: "Video not found"}
	}
	durationMS := int64(vid.Duration * 1000)
	if durationMS <= 0 {
		durationMS = 60000 // 1 minute default fallback
	}

	client, err := s.queryClient()
	if err != nil {
		return nil, err
	}

	report, err := client.Heatmap(ctx, workspace, *video, r, f.MediaRevisionID, durationMS, bins)
	if err != nil {
		return nil, err
	}
	report.ReportMetadata = dto.ReportMetadata{
		Scope:         dto.ScopeMetadata{WorkspaceID: workspace, VideoID: video},
		Range:         r,
		MetricVersion: 2,
		TimeBasis:     "play_start_cohort",
		AsOf:          time.Now().UTC(),
		Provisional:   true,
	}
	if report.EligibleSessions > 0 {
		report.Coverage = &dto.CoverageMetadata{
			EligibleSessions: report.EligibleSessions,
			MeasuredSessions: report.MeasuredSessions,
			CoverageRatio:    float64(report.MeasuredSessions) / float64(report.EligibleSessions),
		}
	}
	return report, nil
}

// Funnels matches sequential conversion steps per session in order
func (s *AnalyticsService) Funnels(ctx context.Context, user, workspace uuid.UUID, video *uuid.UUID, r dto.DateRange, f dto.FilterParams, template string, windowMinutes int) (*dto.FunnelReport, error) {
	if err := s.AuthorizeReport(ctx, user, workspace, video); err != nil {
		return nil, err
	}
	if err := dto.ValidateCapabilities("funnels", f); err != nil {
		return nil, &utils.ApiError{Code: 400, Message: err.Error()}
	}
	if r.To.Sub(r.From) > 31*24*time.Hour {
		return nil, &utils.ApiError{Code: 400, Message: "Funnel cohort range is limited to 31 days"}
	}

	client, err := s.queryClient()
	if err != nil {
		return nil, err
	}

	report, err := client.Funnels(ctx, workspace, video, r, template, windowMinutes)
	if err != nil {
		return nil, err
	}
	report.ReportMetadata = dto.ReportMetadata{
		Scope:         dto.ScopeMetadata{WorkspaceID: workspace, VideoID: video},
		Range:         r,
		MetricVersion: 2,
		TimeBasis:     "session_cohort",
		FilterBasis:   "session_entry",
		AsOf:          time.Now().UTC(),
	}
	return report, nil
}

// LeadAttribution reports saved submission attribution from PostgreSQL (authoritative source)
func (s *AnalyticsService) LeadAttribution(ctx context.Context, user, workspace uuid.UUID, video *uuid.UUID, r dto.DateRange, dimension string) (*dto.LeadAttributionReport, error) {
	if err := s.AuthorizeReport(ctx, user, workspace, video); err != nil {
		return nil, err
	}

	colMap := map[string]string{
		"country":      "a.country",
		"utm_campaign": "a.utm_campaign",
		"utm_source":   "a.utm_source",
		"utm_medium":   "a.utm_medium",
		"referrer":     "a.referrer_origin",
		"surface":      "a.surface",
	}
	column, ok := colMap[dimension]
	if !ok {
		column = "a.country"
		dimension = "country"
	}

	report := &dto.LeadAttributionReport{
		ReportMetadata: dto.ReportMetadata{
			Scope:         dto.ScopeMetadata{WorkspaceID: workspace, VideoID: video},
			Range:         r,
			MetricVersion: 2,
			TimeBasis:     "submission_time",
			FilterBasis:   "submission_snapshot",
			AsOf:          time.Now().UTC(),
		},
		Dimension: dimension,
		Items:     []dto.LeadAttributionRow{},
	}

	// PostgreSQL query on authoritative lead_submission_attribution joined with lead_form_submission
	q := s.DB.WithContext(ctx).Table("lead_submission_attribution a").
		Joins("JOIN lead_form_submission s ON s.id = a.submission_id").
		Where("a.workspace_id = ? AND a.submitted_at >= ? AND a.submitted_at < ?", workspace, r.From, r.To)
	if video != nil {
		q = q.Where("a.video_id = ?", *video)
	}

	type AttrResult struct {
		DimVal  string
		Saved   uint64
		Skipped uint64
		Total   uint64
	}
	var results []AttrResult
	err := q.Select(fmt.Sprintf("COALESCE(NULLIF(%s, ''), 'Unknown') AS dim_val, count(*) FILTER (WHERE a.skipped = false) AS saved, count(*) FILTER (WHERE a.skipped = true) AS skipped, count(*) AS total", column)).
		Group("dim_val").
		Order("saved DESC, dim_val ASC").
		Scan(&results).Error
	if err != nil {
		return nil, fmt.Errorf("query lead attribution: %w", err)
	}

	var totalSaved, totalSkipped uint64
	for _, res := range results {
		totalSaved += res.Saved
		totalSkipped += res.Skipped
		row := dto.LeadAttributionRow{
			DimensionValue:    res.DimVal,
			SavedSubmissions:  res.Saved,
			SkippedSubmissions: res.Skipped,
			TotalSubmissions:  res.Total,
		}
		report.Items = append(report.Items, row)
	}
	report.TotalSavedSubmissions = totalSaved
	report.TotalSkippedSubmissions = totalSkipped

	// Check total submissions in PostgreSQL for reconciliation
	var pgTotal int64
	subQ := s.DB.WithContext(ctx).Table("lead_form_submission s").
		Joins("JOIN lead_form f ON f.id = s.form_id").
		Where("f.workspace_id = ? AND s.created_at >= ? AND s.created_at < ? AND s.skipped = false", workspace, r.From, r.To)
	if video != nil {
		subQ = subQ.Where("s.video_id = ?", *video)
	}
	_ = subQ.Count(&pgTotal).Error
	report.PostgresAuthoritativeTotal = uint64(pgTotal)
	report.Reconciled = totalSaved == uint64(pgTotal)

	for i := range report.Items {
		if totalSaved > 0 {
			report.Items[i].SharePercent = float64(report.Items[i].SavedSubmissions) / float64(totalSaved) * 100
		}
	}
	return report, nil
}

// SessionMetrics queries cohort-correct average watch duration
func (s *AnalyticsService) SessionMetrics(ctx context.Context, user, workspace uuid.UUID, video *uuid.UUID, r dto.DateRange, f dto.FilterParams, cohort string) (*dto.SessionMetricsReport, error) {
	if err := s.AuthorizeReport(ctx, user, workspace, video); err != nil {
		return nil, err
	}
	if err := dto.ValidateCapabilities("session-metrics", f); err != nil {
		return nil, &utils.ApiError{Code: 400, Message: err.Error()}
	}

	client, err := s.queryClient()
	if err != nil {
		return nil, err
	}

	if cohort == "" {
		cohort = "play_start"
	}
	report, err := client.SessionMetrics(ctx, workspace, video, r, cohort)
	if err != nil {
		return nil, err
	}
	report.ReportMetadata = dto.ReportMetadata{
		Scope:             dto.ScopeMetadata{WorkspaceID: workspace, VideoID: video},
		Range:             r,
		MetricVersion:     2,
		TimeBasis:         "play_start_cohort",
		AsOf:              time.Now().UTC(),
		ObservationCutoff: &report.ObservationCutoff,
		Provisional:       report.ProvisionalSessions > 0,
	}
	return report, nil
}

// Quality generates playback quality statistics and percentiles
func (s *AnalyticsService) Quality(ctx context.Context, user, workspace uuid.UUID, video *uuid.UUID, r dto.DateRange, f dto.FilterParams, mode, interval string) (*dto.QualityReport, error) {
	if err := s.AuthorizeReport(ctx, user, workspace, video); err != nil {
		return nil, err
	}
	if err := dto.ValidateCapabilities("quality", f); err != nil {
		return nil, &utils.ApiError{Code: 400, Message: err.Error()}
	}

	client, err := s.queryClient()
	if err != nil {
		return nil, err
	}

	report := &dto.QualityReport{
		ReportMetadata: dto.ReportMetadata{
			Scope:         dto.ScopeMetadata{WorkspaceID: workspace, VideoID: video},
			Range:         r,
			MetricVersion: 2,
			TimeBasis:     "play_start_cohort",
			AsOf:          time.Now().UTC(),
		},
	}

	if mode == "series" {
		if interval == "" {
			interval = "day"
		}
		points, err := client.QualitySeries(ctx, workspace, video, r, interval)
		if err != nil {
			return nil, err
		}
		report.Series = points
		return report, nil
	}

	summary, err := client.QualitySummary(ctx, workspace, video, r)
	if err != nil {
		return nil, err
	}
	report.Summary = summary
	return report, nil
}

func parseTimeToMS(raw string) int64 {
	// Parse formats like "01:23" or "01:23:45" or raw seconds
	parts := strings.Split(raw, ":")
	if len(parts) == 2 {
		var m, sec int64
		_, _ = fmt.Sscanf(raw, "%d:%d", &m, &sec)
		return (m*60 + sec) * 1000
	} else if len(parts) == 3 {
		var h, m, sec int64
		_, _ = fmt.Sscanf(raw, "%d:%d:%d", &h, &m, &sec)
		return (h*3600 + m*60 + sec) * 1000
	}
	var sec float64
	_, _ = fmt.Sscanf(raw, "%f", &sec)
	return int64(sec * 1000)
}
