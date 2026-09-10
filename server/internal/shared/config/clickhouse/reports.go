package clickhouse

import (
	"context"
	"fmt"
	"strings"

	analyticsDTO "github.com/ajaysingh2003/vortex-stream/internal/modules/analytics/dto"
	"github.com/google/uuid"
)

func (c *Client) Overview(ctx context.Context, workspaceID uuid.UUID, videoID *uuid.UUID, dateRange analyticsDTO.DateRange) (*analyticsDTO.Overview, error) {
	query, args := scopedQuery(`
SELECT
    countIf(event_name = 'play_started') AS qualified_plays,
    uniqExactIf(anonymous_id, event_name = 'play_started' AND anonymous_id != '') AS unique_anonymous_viewers,
    uniqExactIf(playback_session_id, event_name = 'play_started' AND playback_session_id != '') AS unique_playback_sessions,
    countIf(event_name = 'video_completed') AS completions,
    ifNull(avgIf(if(duration_ms > 0, position_ms / duration_ms * 100, 0), event_name = 'video_progress' AND duration_ms > 0), 0) AS average_progress,
    countIf(event_name = 'video_progress') AS progress_events,
    countIf(event_name = 'cta_displayed') AS cta_displays,
    countIf(event_name = 'cta_clicked') AS cta_clicks,
    countIf(event_name = 'lead_form_submitted') AS form_submissions,
    countIf(event_name IN ('video_error', 'cdn_error', 'quality_switch_failed')) AS playback_errors,
    countIf(event_name = 'buffer_started') AS buffer_events
FROM analytics_events FINAL
WHERE event_time >= ? AND event_time < ?`, workspaceID, videoID, dateRange)

	var result analyticsDTO.Overview
	result.Range = dateRange
	if err := c.Conn.QueryRow(ctx, query, args...).Scan(
		&result.QualifiedPlays, &result.UniqueAnonymousViewers, &result.UniquePlaybackSessions,
		&result.Completions, &result.AverageProgress, &result.TotalProgressEvents,
		&result.CtaDisplays, &result.CtaClicks, &result.FormSubmissions,
		&result.PlaybackErrors, &result.BufferEvents,
	); err != nil {
		return nil, fmt.Errorf("query analytics overview: %w", err)
	}
	if result.QualifiedPlays > 0 {
		result.CompletionRate = float64(result.Completions) / float64(result.QualifiedPlays) * 100
	}
	return &result, nil
}

func (c *Client) TimeSeries(ctx context.Context, workspaceID uuid.UUID, videoID uuid.UUID, dateRange analyticsDTO.DateRange) ([]analyticsDTO.TimeSeriesPoint, error) {
	query, args := scopedQuery(`
SELECT
    toDate(event_time) AS day,
    countIf(event_name = 'play_started') AS qualified_plays,
    uniqExactIf(anonymous_id, event_name = 'play_started' AND anonymous_id != '') AS unique_anonymous_viewers,
    countIf(event_name = 'video_completed') AS completions,
    countIf(event_name = 'cta_clicked') AS cta_clicks,
    countIf(event_name = 'lead_form_submitted') AS form_submissions,
    countIf(event_name IN ('video_error', 'cdn_error', 'quality_switch_failed')) AS playback_errors,
    countIf(event_name = 'buffer_started') AS buffer_events
FROM analytics_events FINAL
WHERE event_time >= ? AND event_time < ?
GROUP BY day
ORDER BY day`, workspaceID, &videoID, dateRange)

	rows, err := c.Conn.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query analytics timeseries: %w", err)
	}
	defer rows.Close()
	points := make([]analyticsDTO.TimeSeriesPoint, 0)
	for rows.Next() {
		var point analyticsDTO.TimeSeriesPoint
		if err := rows.Scan(&point.Date, &point.QualifiedPlays, &point.UniqueAnonymousViewers, &point.Completions, &point.CtaClicks, &point.FormSubmissions, &point.PlaybackErrors, &point.BufferEvents); err != nil {
			return nil, fmt.Errorf("scan analytics timeseries: %w", err)
		}
		points = append(points, point)
	}
	return points, rows.Err()
}

func (c *Client) Retention(ctx context.Context, workspaceID uuid.UUID, videoID uuid.UUID, dateRange analyticsDTO.DateRange) ([]analyticsDTO.Retention, error) {
	query, args := scopedQuery(`
SELECT
    event_name AS bucket,
    uniqExactIf(playback_session_id, playback_session_id != '') AS sessions
FROM analytics_events FINAL
WHERE event_time >= ? AND event_time < ?
  AND event_name IN ('play_started', 'video_25_percent', 'video_50_percent', 'video_75_percent', 'video_90_percent', 'video_completed')
GROUP BY event_name
ORDER BY indexOf(['play_started', 'video_25_percent', 'video_50_percent', 'video_75_percent', 'video_90_percent', 'video_completed'], event_name)`, workspaceID, &videoID, dateRange)

	rows, err := c.Conn.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query analytics retention: %w", err)
	}
	defer rows.Close()
	items := make([]analyticsDTO.Retention, 0)
	var baseline uint64
	for rows.Next() {
		var item analyticsDTO.Retention
		if err := rows.Scan(&item.Bucket, &item.UniquePlaybackSessions); err != nil {
			return nil, fmt.Errorf("scan analytics retention: %w", err)
		}
		if item.Bucket == "play_started" {
			baseline = item.UniquePlaybackSessions
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	for index := range items {
		if baseline > 0 {
			items[index].Percentage = float64(items[index].UniquePlaybackSessions) / float64(baseline) * 100
		}
	}
	return items, nil
}

func (c *Client) Technical(ctx context.Context, workspaceID uuid.UUID, videoID uuid.UUID, dimension string, dateRange analyticsDTO.DateRange) ([]analyticsDTO.TechnicalBreakdown, error) {
	column, ok := map[string]string{
		"country": "country", "device": "device_type", "browser": "browser", "os": "os",
	}[dimension]
	if !ok {
		return nil, fmt.Errorf("unsupported technical dimension %q", dimension)
	}
	query, args := scopedQuery(fmt.Sprintf(`
SELECT
    %s AS dimension,
    countIf(event_name = 'play_started') AS qualified_plays,
    countIf(event_name IN ('video_error', 'cdn_error', 'quality_switch_failed')) AS playback_errors,
    countIf(event_name = 'buffer_started') AS buffer_events,
    ifNull(avgIf(if(duration_ms > 0, position_ms / duration_ms * 100, 0), event_name = 'video_progress' AND duration_ms > 0), 0) AS average_progress
FROM analytics_events FINAL
WHERE event_time >= ? AND event_time < ?
GROUP BY dimension
ORDER BY qualified_plays DESC
LIMIT 100`, column), workspaceID, &videoID, dateRange)

	rows, err := c.Conn.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query technical analytics: %w", err)
	}
	defer rows.Close()
	items := make([]analyticsDTO.TechnicalBreakdown, 0)
	for rows.Next() {
		var item analyticsDTO.TechnicalBreakdown
		if err := rows.Scan(&item.Dimension, &item.QualifiedPlays, &item.PlaybackErrors, &item.BufferEvents, &item.AverageProgress); err != nil {
			return nil, fmt.Errorf("scan technical analytics: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (c *Client) Funnel(ctx context.Context, workspaceID uuid.UUID, videoID *uuid.UUID, dateRange analyticsDTO.DateRange) (*analyticsDTO.Funnel, error) {
	query, args := scopedQuery(`
SELECT
    countIf(event_name = 'cta_displayed') AS cta_displays,
    countIf(event_name = 'cta_clicked') AS cta_clicks,
    countIf(event_name = 'lead_form_opened') AS lead_form_opens,
    countIf(event_name = 'lead_form_started') AS lead_form_starts,
    countIf(event_name = 'lead_form_submitted') AS lead_submissions,
    countIf(event_name = 'lead_form_failed') AS lead_form_failures,
    countIf(event_name = 'end_screen_displayed') AS end_screen_displays,
    countIf(event_name = 'end_screen_clicked') AS end_screen_clicks
FROM analytics_events FINAL
WHERE event_time >= ? AND event_time < ?`, workspaceID, videoID, dateRange)

	var result analyticsDTO.Funnel
	result.Range = dateRange
	if err := c.Conn.QueryRow(ctx, query, args...).Scan(
		&result.CtaDisplays, &result.CtaClicks, &result.LeadFormOpens, &result.LeadFormStarts,
		&result.LeadSubmissions, &result.LeadFormFailures, &result.EndScreenDisplays, &result.EndScreenClicks,
	); err != nil {
		return nil, fmt.Errorf("query sales funnel: %w", err)
	}
	if result.CtaDisplays > 0 {
		result.CtaClickRate = float64(result.CtaClicks) / float64(result.CtaDisplays) * 100
	}
	if result.CtaDisplays > 0 {
		result.LeadConversionRate = float64(result.LeadSubmissions) / float64(result.CtaDisplays) * 100
	}
	return &result, nil
}

func (c *Client) ConversionSeries(ctx context.Context, workspaceID uuid.UUID, videoID *uuid.UUID, dateRange analyticsDTO.DateRange) ([]analyticsDTO.ConversionPoint, error) {
	query, args := scopedQuery(`
SELECT
    toDate(event_time) AS day,
    countIf(event_name = 'cta_displayed') AS cta_displays,
    countIf(event_name = 'cta_clicked') AS cta_clicks,
    countIf(event_name = 'lead_form_submitted') AS lead_submissions,
    countIf(event_name = 'end_screen_clicked') AS end_screen_clicks
FROM analytics_events FINAL
WHERE event_time >= ? AND event_time < ?
GROUP BY day
ORDER BY day`, workspaceID, videoID, dateRange)

	rows, err := c.Conn.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query conversion series: %w", err)
	}
	defer rows.Close()
	items := make([]analyticsDTO.ConversionPoint, 0)
	for rows.Next() {
		var item analyticsDTO.ConversionPoint
		if err := rows.Scan(&item.Date, &item.CtaDisplays, &item.CtaClicks, &item.LeadSubmissions, &item.EndScreenClicks); err != nil {
			return nil, fmt.Errorf("scan conversion series: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func scopedQuery(query string, workspaceID uuid.UUID, videoID *uuid.UUID, dateRange analyticsDTO.DateRange) (string, []any) {
	args := []any{dateRange.From, dateRange.To}
	filters := " AND workspace_id = ?"
	args = append(args, workspaceID)
	if videoID != nil {
		filters += " AND video_id = ?"
		args = append(args, *videoID)
	}
	insertAt := len(query)
	for _, clause := range []string{"\nGROUP BY", "\nORDER BY", "\nLIMIT"} {
		if index := strings.Index(query, clause); index >= 0 && index < insertAt {
			insertAt = index
		}
	}
	query = query[:insertAt] + filters + query[insertAt:]
	return query, args
}
