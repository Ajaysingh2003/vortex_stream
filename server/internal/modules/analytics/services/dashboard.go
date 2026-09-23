package services

import (
	"context"
	"time"

	model "github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	dto "github.com/ajaysingh2003/vortex-stream/internal/modules/analytics/dto"
	"github.com/ajaysingh2003/vortex-stream/internal/shared/utils"
	"github.com/google/uuid"
)

func (s *AnalyticsService) AuthorizeReport(ctx context.Context, user, workspace uuid.UUID, video *uuid.UUID) error {
	if err := s.authorizeWorkspace(ctx, user, workspace); err != nil {
		return err
	}
	if video != nil {
		var n int64
		if err := s.DB.WithContext(ctx).Model(&model.Video{}).Where("id=? AND workspace_id=?", *video, workspace).Count(&n).Error; err != nil {
			return err
		}
		if n == 0 {
			return &utils.ApiError{Code: 404, Message: "Video not found in this workspace"}
		}
	}
	return nil
}
func (s *AnalyticsService) savedForms(ctx context.Context, workspace uuid.UUID, video *uuid.UUID, r dto.DateRange, key string) (map[string][2]uint64, error) {
	expressions := map[string]string{"summary": "'all'", "video": "s.video_id::text", "hour": "to_char(date_trunc('hour', s.created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"')", "day": "to_char(date_trunc('day', s.created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"')", "week": "to_char(date_trunc('week', s.created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"')"}
	expr, ok := expressions[key]
	if !ok {
		return map[string][2]uint64{}, nil
	}
	q := s.DB.WithContext(ctx).Table("lead_form_submission s").Joins("JOIN lead_form f ON f.id=s.form_id").Where("f.workspace_id=? AND s.created_at>=? AND s.created_at<?", workspace, r.From, r.To)
	if video != nil {
		q = q.Where("s.video_id=?", *video)
	}
	var rows []struct {
		Key       string
		Completed uint64
		Skipped   uint64
	}
	if err := q.Select(expr + " AS key,count(*) FILTER (WHERE s.skipped=false) AS completed,count(*) FILTER (WHERE s.skipped=true) AS skipped").Group("key").Scan(&rows).Error; err != nil {
		return nil, err
	}
	out := map[string][2]uint64{}
	for _, row := range rows {
		out[row.Key] = [2]uint64{row.Completed, row.Skipped}
	}
	return out, nil
}
func (s *AnalyticsService) DashboardRows(ctx context.Context, workspace uuid.UUID, video *uuid.UUID, r dto.DateRange, dimension, interval string, limit, offset int) ([]dto.MetricRow, error) {
	client, err := s.queryClient()
	if err != nil {
		return nil, err
	}
	rows, err := client.Dashboard(ctx, workspace, video, r, dimension, interval, limit, offset)
	if err != nil {
		return nil, err
	}
	key := dimension
	if dimension == "series" {
		key = interval
	}
	forms, err := s.savedForms(ctx, workspace, video, r, key)
	if err != nil {
		return nil, err
	}
	byKey := map[string]dto.MetricRow{}
	for _, row := range rows {
		byKey[row.Key] = row
	}
	if dimension == "summary" && len(rows) == 0 {
		rows = append(rows, dto.MetricRow{Key: "all"})
	}
	if dimension == "series" {
		rows = []dto.MetricRow{}
		at := r.From.UTC()
		switch interval {
		case "hour":
			at = at.Truncate(time.Hour)
		case "day":
			at = time.Date(at.Year(), at.Month(), at.Day(), 0, 0, 0, 0, time.UTC)
		case "week":
			at = time.Date(at.Year(), at.Month(), at.Day(), 0, 0, 0, 0, time.UTC)
			at = at.AddDate(0, 0, -(int(at.Weekday())+6)%7)
		}
		for at.Before(r.To) {
			k := at.Format("2006-01-02T15:04:05Z")
			row := byKey[k]
			row.Key = k
			rows = append(rows, row)
			if interval == "hour" {
				at = at.Add(time.Hour)
			} else if interval == "week" {
				at = at.AddDate(0, 0, 7)
			} else {
				at = at.AddDate(0, 0, 1)
			}
		}
	}
	for i := range rows {
		counts := forms[rows[i].Key]
		rows[i].Metrics.FormSubmissions = counts[0]
		rows[i].Metrics.FormSkips = counts[1]
		rows[i].Metrics.Rates()
	}
	if dimension == "video" && len(rows) > 0 {
		ids := []string{}
		for _, row := range rows {
			ids = append(ids, row.Key)
		}
		var videos []model.Video
		if err := s.DB.WithContext(ctx).Unscoped().Where("id IN ? AND workspace_id=?", ids, workspace).Find(&videos).Error; err != nil {
			return nil, err
		}
		for i := range rows {
			rows[i].Title = "Deleted video"
			for _, v := range videos {
				if v.ID.String() == rows[i].Key {
					rows[i].Title = v.Title
				}
			}
		}
	}
	return rows, nil
}
func (s *AnalyticsService) Summary(ctx context.Context, workspace uuid.UUID, video *uuid.UUID, r dto.DateRange) (*dto.SummaryReport, error) {
	previous := dto.DateRange{From: r.From.Add(-r.To.Sub(r.From)), To: r.From}
	current, err := s.DashboardRows(ctx, workspace, video, r, "summary", "day", 1, 0)
	if err != nil {
		return nil, err
	}
	old, err := s.DashboardRows(ctx, workspace, video, previous, "summary", "day", 1, 0)
	if err != nil {
		return nil, err
	}
	out := &dto.SummaryReport{Range: r, PreviousRange: previous, Current: current[0].Metrics, Previous: old[0].Metrics, GeneratedAt: time.Now().UTC(), Change: map[string]*float64{}}
	for key, pair := range map[string][2]uint64{"views": {out.Current.Views, out.Previous.Views}, "unique_viewers": {out.Current.UniqueViewers, out.Previous.UniqueViewers}, "impressions": {out.Current.Impressions, out.Previous.Impressions}, "playback_ms": {out.Current.PlaybackMS, out.Previous.PlaybackMS}, "form_submissions": {out.Current.FormSubmissions, out.Previous.FormSubmissions}, "cta_clicks": {out.Current.CTAClicks, out.Previous.CTAClicks}} {
		if pair[1] == 0 {
			out.Change[key] = nil
		} else {
			n := (float64(pair[0]) - float64(pair[1])) / float64(pair[1]) * 100
			out.Change[key] = &n
		}
	}
	return out, nil
}
func (s *AnalyticsService) Live(ctx context.Context, w uuid.UUID, v *uuid.UUID) (*dto.LiveReport, error) {
	c, err := s.queryClient()
	if err != nil {
		return nil, err
	}
	return c.Live(ctx, w, v)
}
func (s *AnalyticsService) Concurrency(ctx context.Context, w uuid.UUID, v *uuid.UUID, r dto.DateRange) ([]dto.LiveRow, error) {
	c, err := s.queryClient()
	if err != nil {
		return nil, err
	}
	return c.Concurrency(ctx, w, v, r)
}
func (s *AnalyticsService) Engagement(ctx context.Context, w, v uuid.UUID, r dto.DateRange) ([]dto.Engagement, error) {
	c, err := s.queryClient()
	if err != nil {
		return nil, err
	}
	return c.Engagement(ctx, w, v, r)
}
