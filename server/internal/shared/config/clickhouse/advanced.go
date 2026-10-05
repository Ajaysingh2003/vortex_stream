package clickhouse

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/ajaysingh2003/vortex-stream/internal/modules/analytics/dto"
	"github.com/google/uuid"
)

// CTAPerformance queries per-CTA button performance
func (c *Client) CTAPerformance(ctx context.Context, workspaceID uuid.UUID, videoID *uuid.UUID, r dto.DateRange, ctaID string, sort, order string, limit, offset int) ([]dto.CTARow, error) {
	filters := " AND workspace_id = ?"
	args := []any{r.From, r.To, workspaceID}
	if videoID != nil {
		filters += " AND video_id = ?"
		args = append(args, *videoID)
	}
	if ctaID != "" {
		filters += " AND (cta_id = ? OR JSONExtractString(properties, 'cta_id') = ?)"
		args = append(args, ctaID, ctaID)
	}

	query := `
SELECT
    video_id,
    if(cta_id != '', cta_id, JSONExtractString(properties, 'cta_id')) AS resolved_cta_id,
    experience_revision_id,
    toUInt64(countIf(event_name = 'cta_displayed')) AS exposure_events,
    uniqExactIf(playback_session_id, event_name = 'cta_displayed') AS exposed_sessions,
    toUInt64(countIf(event_name = 'cta_clicked')) AS click_events,
    uniqExactIf(playback_session_id, event_name = 'cta_clicked') AS clicking_sessions,
    toUInt64(uniqExactIf(playback_session_id, event_name IN ('lead_form_submitted', 'lead_submission_saved'))) AS post_click_leads,
    ifNull(avgIf(monotonic_elapsed_ms, event_name = 'cta_clicked' AND monotonic_elapsed_ms > 0), 0) AS avg_click_ms,
    toUInt64(countIf(event_name = 'cta_clicked' AND monotonic_elapsed_ms > 0)) AS click_samples
FROM analytics_events FINAL
WHERE event_time >= ? AND event_time < ?` + filters + `
  AND (event_name IN ('cta_displayed', 'cta_clicked') OR (event_name IN ('lead_form_submitted', 'lead_submission_saved') AND playback_session_id != ''))
  AND (cta_id != '' OR JSONExtractString(properties, 'cta_id') != '')
GROUP BY video_id, resolved_cta_id, experience_revision_id
`
	sortCol := "click_events"
	switch sort {
	case "displays", "exposures":
		sortCol = "exposure_events"
	case "click_rate":
		sortCol = "if(exposed_sessions > 0, clicking_sessions / exposed_sessions, 0)"
	}
	sortOrder := "DESC"
	if strings.ToLower(order) == "asc" {
		sortOrder = "ASC"
	}
	query += fmt.Sprintf(" ORDER BY %s %s, resolved_cta_id ASC LIMIT ? OFFSET ?", sortCol, sortOrder)
	args = append(args, limit, offset)

	rows, err := c.Conn.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query cta performance: %w", err)
	}
	defer rows.Close()

	var result []dto.CTARow
	for rows.Next() {
		var r dto.CTARow
		var vid *uuid.UUID
		if err := rows.Scan(
			&vid, &r.CTAID, &r.ExperienceRevisionID,
			&r.ExposureEvents, &r.ExposedSessions,
			&r.ClickEvents, &r.ClickingSessions,
			&r.PostClickSavedLeads,
			&r.AvgTimeToClickMS, &r.TimeToClickSamples,
		); err != nil {
			return nil, fmt.Errorf("scan cta performance: %w", err)
		}
		if vid != nil {
			r.VideoID = *vid
		}
		if r.ExposedSessions > 0 {
			r.ClickRate = float64(r.ClickingSessions) / float64(r.ExposedSessions) * 100
		}
		result = append(result, r)
	}
	return result, rows.Err()
}

// CTASeries queries time-series buckets for CTAs
func (c *Client) CTASeries(ctx context.Context, workspaceID uuid.UUID, videoID *uuid.UUID, r dto.DateRange, ctaID string, interval string) ([]dto.CTASeriesPoint, error) {
	intervalExpr := "toStartOfDay(event_time)"
	if interval == "hour" {
		intervalExpr = "toStartOfHour(event_time)"
	} else if interval == "week" {
		intervalExpr = "toStartOfWeek(event_time, 1)"
	}

	filters := " AND workspace_id = ?"
	args := []any{r.From, r.To, workspaceID}
	if videoID != nil {
		filters += " AND video_id = ?"
		args = append(args, *videoID)
	}
	if ctaID != "" {
		filters += " AND (cta_id = ? OR JSONExtractString(properties, 'cta_id') = ?)"
		args = append(args, ctaID, ctaID)
	}

	query := fmt.Sprintf(`
SELECT
    formatDateTime(%s, '%%Y-%%m-%%dT%%H:%%i:%%SZ', 'UTC') AS bucket,
    if(cta_id != '', cta_id, JSONExtractString(properties, 'cta_id')) AS entity_key,
    toUInt64(countIf(event_name = 'cta_displayed')) AS exposure_events,
    toUInt64(countIf(event_name = 'cta_clicked')) AS click_events
FROM analytics_events FINAL
WHERE event_time >= ? AND event_time < ?`+filters+`
  AND event_name IN ('cta_displayed', 'cta_clicked')
  AND (cta_id != '' OR JSONExtractString(properties, 'cta_id') != '')
GROUP BY bucket, entity_key
ORDER BY bucket ASC, entity_key ASC
`, intervalExpr)

	rows, err := c.Conn.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query cta series: %w", err)
	}
	defer rows.Close()

	var result []dto.CTASeriesPoint
	for rows.Next() {
		var pt dto.CTASeriesPoint
		if err := rows.Scan(&pt.Key, &pt.EntityKey, &pt.ExposureEvents, &pt.ClickEvents); err != nil {
			return nil, err
		}
		if pt.ExposureEvents > 0 {
			pt.ClickRate = float64(pt.ClickEvents) / float64(pt.ExposureEvents) * 100
		}
		result = append(result, pt)
	}
	return result, rows.Err()
}

// ChapterUsage queries chapter navigation and playback statistics
func (c *Client) ChapterUsage(ctx context.Context, workspaceID uuid.UUID, videoID *uuid.UUID, r dto.DateRange, chapterID string) ([]dto.ChapterRow, error) {
	filters := " AND workspace_id = ?"
	args := []any{r.From, r.To, workspaceID}
	if videoID != nil {
		filters += " AND video_id = ?"
		args = append(args, *videoID)
	}
	if chapterID != "" {
		filters += " AND (chapter_id = ? OR JSONExtractString(properties, 'chapter_id') = ?)"
		args = append(args, chapterID, chapterID)
	}

	query := `
SELECT
    video_id,
    if(chapter_id != '', chapter_id, JSONExtractString(properties, 'chapter_id')) AS resolved_chapter_id,
    toUInt64(countIf(event_name = 'chapter_clicked')) AS navigation_clicks,
    uniqExactIf(playback_session_id, event_name = 'chapter_clicked') AS navigating_sessions,
    uniqExactIf(playback_session_id, event_name IN ('play_started', 'playback_heartbeat', 'playback_segments')) AS viewing_sessions,
    toUInt64(sumIf(JSONExtractUInt(properties, 'watch_ms'), event_name = 'playback_heartbeat')) AS playback_ms
FROM analytics_events FINAL
WHERE event_time >= ? AND event_time < ?` + filters + `
  AND (event_name = 'chapter_clicked' OR event_name = 'playback_heartbeat')
  AND (chapter_id != '' OR JSONExtractString(properties, 'chapter_id') != '')
GROUP BY video_id, resolved_chapter_id
ORDER BY playback_ms DESC, navigation_clicks DESC
`
	rows, err := c.Conn.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query chapter usage: %w", err)
	}
	defer rows.Close()

	var result []dto.ChapterRow
	for rows.Next() {
		var row dto.ChapterRow
		var vid *uuid.UUID
		if err := rows.Scan(
			&vid, &row.ChapterID, &row.NavigationClicks, &row.NavigatingSessions,
			&row.ViewingSessions, &row.PlaybackMS,
		); err != nil {
			return nil, err
		}
		if vid != nil {
			row.VideoID = *vid
		}
		result = append(result, row)
	}
	return result, rows.Err()
}

// CaptionUsage queries caption availability, selections, and playback
func (c *Client) CaptionUsage(ctx context.Context, workspaceID uuid.UUID, videoID *uuid.UUID, r dto.DateRange, subtitleTrackID string) (*dto.CaptionsReport, error) {
	filters := " AND workspace_id = ?"
	args := []any{r.From, r.To, workspaceID}
	if videoID != nil {
		filters += " AND video_id = ?"
		args = append(args, *videoID)
	}

	// 1. Overall caption totals
	overallQuery := `
SELECT
    uniqExactIf(playback_session_id, event_name = 'play_started') AS available_sessions,
    uniqExactIf(playback_session_id, event_name IN ('captions_enabled', 'subtitle_track_selected')) AS enabled_sessions,
    uniqExactIf(playback_session_id, event_name = 'subtitle_track_selected' AND JSONExtractString(properties, 'source') = 'manual') AS manual_sessions
FROM analytics_events FINAL
WHERE event_time >= ? AND event_time < ?` + filters + `
  AND event_name IN ('play_started', 'captions_enabled', 'captions_disabled', 'subtitle_track_selected')
`
	report := &dto.CaptionsReport{Tracks: []dto.CaptionTrackRow{}}
	if err := c.Conn.QueryRow(ctx, overallQuery, args...).Scan(
		&report.CaptionsAvailableSessions,
		&report.CaptionsEnabledSessions,
		&report.ManualSelectSessions,
	); err != nil {
		return nil, fmt.Errorf("query overall captions: %w", err)
	}
	if report.CaptionsAvailableSessions > 0 {
		rate := float64(report.CaptionsEnabledSessions) / float64(report.CaptionsAvailableSessions) * 100
		report.OverallUsageRate = &rate
	}

	// 2. Track breakdown
	trackFilters := filters
	trackArgs := []any{r.From, r.To, workspaceID}
	if videoID != nil {
		trackArgs = append(trackArgs, *videoID)
	}
	if subtitleTrackID != "" {
		trackFilters += " AND (subtitle_track_id = ? OR JSONExtractString(properties, 'subtitle_track_id') = ?)"
		trackArgs = append(trackArgs, subtitleTrackID, subtitleTrackID)
	}

	trackQuery := `
SELECT
    video_id,
    if(subtitle_track_id != '', subtitle_track_id, JSONExtractString(properties, 'subtitle_track_id')) AS resolved_track,
    any(JSONExtractString(properties, 'language')) AS lang,
    any(JSONExtractString(properties, 'source')) AS src,
    uniqExact(playback_session_id) AS sessions,
    toUInt64(sumIf(JSONExtractUInt(properties, 'watch_ms'), event_name = 'playback_heartbeat')) AS playback_ms
FROM analytics_events FINAL
WHERE event_time >= ? AND event_time < ?` + trackFilters + `
  AND (event_name IN ('captions_enabled', 'subtitle_track_selected', 'playback_heartbeat'))
  AND (subtitle_track_id != '' OR JSONExtractString(properties, 'subtitle_track_id') != '')
GROUP BY video_id, resolved_track
ORDER BY sessions DESC
`
	tRows, err := c.Conn.Query(ctx, trackQuery, trackArgs...)
	if err != nil {
		return nil, fmt.Errorf("query caption tracks: %w", err)
	}
	defer tRows.Close()

	for tRows.Next() {
		var tr dto.CaptionTrackRow
		var vid *uuid.UUID
		if err := tRows.Scan(&vid, &tr.TrackID, &tr.Language, &tr.Source, &tr.Sessions, &tr.CaptionPlaybackMS); err != nil {
			return nil, err
		}
		if vid != nil {
			tr.VideoID = *vid
		}
		if report.CaptionsAvailableSessions > 0 {
			tr.UsageRate = float64(tr.Sessions) / float64(report.CaptionsAvailableSessions) * 100
		}
		report.Tracks = append(report.Tracks, tr)
	}
	return report, tRows.Err()
}

// Heatmap calculates actual watched-segment bins
func (c *Client) Heatmap(ctx context.Context, workspaceID uuid.UUID, videoID uuid.UUID, r dto.DateRange, mediaRev string, durationMS int64, binsCount int) (*dto.HeatmapReport, error) {
	if binsCount < 20 {
		binsCount = 20
	}
	if binsCount > 200 {
		binsCount = 200
	}
	if durationMS <= 0 {
		durationMS = 60000 // default 1 minute fallback
	}

	report := &dto.HeatmapReport{
		DurationMS: durationMS,
		Bins:       binsCount,
		Items:      make([]dto.HeatmapBin, binsCount),
	}

	binWidth := durationMS / int64(binsCount)
	if binWidth <= 0 {
		binWidth = 1
	}
	for i := 0; i < binsCount; i++ {
		start := int64(i) * binWidth
		end := start + binWidth
		if i == binsCount-1 {
			end = durationMS
		}
		report.Items[i] = dto.HeatmapBin{
			BinIndex: i,
			StartMS:  start,
			EndMS:    end,
		}
	}

	// 1. Get eligible start-cohort sessions
	var eligibleStarts uint64
	_ = c.Conn.QueryRow(ctx, `
SELECT uniqExact(playback_session_id)
FROM analytics_events FINAL
WHERE event_time >= ? AND event_time < ? AND workspace_id = ? AND video_id = ? AND event_name = 'play_started'
`, r.From, r.To, workspaceID, videoID).Scan(&eligibleStarts)
	report.EligibleSessions = eligibleStarts

	// 2. Query played segments from analytics_played_segments
	segQuery := `
SELECT
    playback_session_id,
    start_ms,
    end_ms,
    playback_ms
FROM analytics_played_segments FINAL
WHERE event_time >= ? AND event_time < ? AND workspace_id = ? AND video_id = ?
`
	args := []any{r.From, r.To, workspaceID, videoID}
	if mediaRev != "" {
		segQuery += " AND media_revision_id = ?"
		args = append(args, mediaRev)
	}
	rows, err := c.Conn.Query(ctx, segQuery, args...)
	if err == nil {
		defer rows.Close()
		sessionInBin := make(map[int]map[string]bool)
		for i := 0; i < binsCount; i++ {
			sessionInBin[i] = make(map[string]bool)
		}
		measuredSessions := make(map[string]bool)

		for rows.Next() {
			var sess string
			var sStart, sEnd, pMS int64
			if err := rows.Scan(&sess, &sStart, &sEnd, &pMS); err != nil {
				continue
			}
			measuredSessions[sess] = true
			sliceMedia := sEnd - sStart
			if sliceMedia <= 0 {
				sliceMedia = 1
			}

			for i := 0; i < binsCount; i++ {
				binStart := report.Items[i].StartMS
				binEnd := report.Items[i].EndMS
				if sStart < binEnd && sEnd > binStart {
					overlap := minInt64(sEnd, binEnd) - maxInt64(sStart, binStart)
					if overlap > 0 {
						sessionInBin[i][sess] = true
						proportionalWall := uint64(float64(pMS) * (float64(overlap) / float64(sliceMedia)))
						report.Items[i].PlaybackMS += proportionalWall
						report.Items[i].UniqueCoveredMediaMS += overlap
					}
				}
			}
		}

		report.MeasuredSessions = uint64(len(measuredSessions))
		for i := 0; i < binsCount; i++ {
			watching := uint64(len(sessionInBin[i]))
			report.Items[i].WatchingSessions = watching
			if eligibleStarts > 0 {
				report.Items[i].RetentionRate = float64(watching) / float64(eligibleStarts) * 100
			} else if report.MeasuredSessions > 0 {
				report.Items[i].RetentionRate = float64(watching) / float64(report.MeasuredSessions) * 100
			}
		}
		return report, nil
	}

	// 3. Fallback to milestone retention if no segments exist
	return report, nil
}

// Funnels matches sequential conversion steps per session in order
func (c *Client) Funnels(ctx context.Context, workspaceID uuid.UUID, videoID *uuid.UUID, r dto.DateRange, template string, windowMinutes int) (*dto.FunnelReport, error) {
	if windowMinutes <= 0 {
		windowMinutes = 30
	}
	if windowMinutes > 1440 {
		windowMinutes = 1440
	}

	var stepNames []string
	var eventNames []string

	switch template {
	case "preplay_lead":
		stepNames = []string{"Impression", "Form Opened", "Form Started", "Saved Lead"}
		eventNames = []string{"player_loaded", "lead_form_opened", "lead_form_started", "lead_submission_saved"}
	case "cta_response":
		stepNames = []string{"Play Started", "CTA Displayed", "CTA Clicked"}
		eventNames = []string{"play_started", "cta_displayed", "cta_clicked"}
	case "cta_to_lead":
		stepNames = []string{"CTA Displayed", "CTA Clicked", "Saved Lead"}
		eventNames = []string{"cta_displayed", "cta_clicked", "lead_submission_saved"}
	default: // inplay_lead
		template = "inplay_lead"
		stepNames = []string{"Play Started", "Form Opened", "Form Started", "Saved Lead"}
		eventNames = []string{"play_started", "lead_form_opened", "lead_form_started", "lead_submission_saved"}
	}

	filters := " AND workspace_id = ?"
	args := []any{r.From, r.To, workspaceID}
	if videoID != nil {
		filters += " AND video_id = ?"
		args = append(args, *videoID)
	}

	// Step 1 entry cohort
	entryEvent := eventNames[0]
	step1Query := `
SELECT playback_session_id, min(event_time) AS entry_time
FROM analytics_events FINAL
WHERE event_time >= ? AND event_time < ?` + filters + `
  AND event_name = ?
  AND playback_session_id != ''
GROUP BY playback_session_id
`
	step1Args := append(args, entryEvent)
	rows1, err := c.Conn.Query(ctx, step1Query, step1Args...)
	if err != nil {
		return nil, fmt.Errorf("query funnel step 1: %w", err)
	}
	defer rows1.Close()

	sessionTimes := make(map[string]time.Time)
	for rows1.Next() {
		var s string
		var t time.Time
		if err := rows1.Scan(&s, &t); err == nil {
			sessionTimes[s] = t
		}
	}

	entryCount := uint64(len(sessionTimes))
	report := &dto.FunnelReport{
		Template:            template,
		WindowMinutes:       windowMinutes,
		EntryCohortSessions: entryCount,
		Steps:               make([]dto.FunnelStep, len(eventNames)),
	}

	for i, name := range stepNames {
		report.Steps[i] = dto.FunnelStep{
			StepIndex: i + 1,
			StepName:  name,
			EventName: eventNames[i],
		}
	}
	report.Steps[0].Sessions = entryCount
	if entryCount > 0 {
		report.Steps[0].ConversionRate = 100.0
		report.Steps[0].StepConversionRate = 100.0
	}

	if entryCount == 0 {
		return report, nil
	}

	// For subsequent steps, find earliest subsequent event in window
	currentSessions := sessionTimes
	for stepIdx := 1; stepIdx < len(eventNames); stepIdx++ {
		evName := eventNames[stepIdx]
		nextSessions := make(map[string]time.Time)

		// Check events in analytics_events (or lead_attributions for saved lead)
		evQuery := `
SELECT playback_session_id, min(event_time)
FROM analytics_events FINAL
WHERE event_time >= ? AND event_time <= ?` + filters + `
  AND (event_name = ? OR (event_name = 'lead_form_submitted' AND ? = 'lead_submission_saved'))
  AND playback_session_id != ''
GROUP BY playback_session_id
`
		// Allow up to windowMinutes after the end of range
		windowMax := r.To.Add(time.Duration(windowMinutes) * time.Minute)
		qArgs := []any{r.From, windowMax, workspaceID}
		if videoID != nil {
			qArgs = append(qArgs, *videoID)
		}
		qArgs = append(qArgs, evName, evName)

		evRows, err := c.Conn.Query(ctx, evQuery, qArgs...)
		if err == nil {
			for evRows.Next() {
				var s string
				var evT time.Time
				if err := evRows.Scan(&s, &evT); err == nil {
					if prevT, ok := currentSessions[s]; ok {
						if evT.After(prevT) || evT.Equal(prevT) {
							if evT.Sub(prevT) <= time.Duration(windowMinutes)*time.Minute {
								nextSessions[s] = evT
							}
						}
					}
				}
			}
			evRows.Close()
		}

		stepCount := uint64(len(nextSessions))
		report.Steps[stepIdx].Sessions = stepCount
		prevCount := report.Steps[stepIdx-1].Sessions
		if prevCount > 0 {
			report.Steps[stepIdx].StepConversionRate = float64(stepCount) / float64(prevCount) * 100
			report.Steps[stepIdx].DropOffRate = 100.0 - report.Steps[stepIdx].StepConversionRate
		}
		if entryCount > 0 {
			report.Steps[stepIdx].ConversionRate = float64(stepCount) / float64(entryCount) * 100
		}
		currentSessions = nextSessions
	}

	lastCount := report.Steps[len(report.Steps)-1].Sessions
	report.ConvertedSessions = lastCount
	if entryCount > 0 {
		report.OverallConversionRate = float64(lastCount) / float64(entryCount) * 100
	}
	return report, nil
}

// SessionMetrics queries cohort-correct average watch duration
func (c *Client) SessionMetrics(ctx context.Context, workspaceID uuid.UUID, videoID *uuid.UUID, r dto.DateRange, cohort string) (*dto.SessionMetricsReport, error) {
	filters := " AND workspace_id = ?"
	args := []any{r.From, r.To, workspaceID}
	if videoID != nil {
		filters += " AND video_id = ?"
		args = append(args, *videoID)
	}

	query := `
SELECT
    playback_session_id,
    minIf(event_time, event_name = 'play_started') AS first_play,
    max(event_time) AS last_active,
    toUInt64(sumIf(JSONExtractUInt(properties, 'watch_ms'), event_name = 'playback_heartbeat')) AS watch_ms,
    max(event_name = 'video_completed') AS is_completed
FROM analytics_events FINAL
WHERE workspace_id = ?`
	queryArgs := []any{workspaceID}
	if videoID != nil {
		query += " AND video_id = ?"
		queryArgs = append(queryArgs, *videoID)
	}
	query += `
  AND playback_session_id != ''
GROUP BY playback_session_id
HAVING first_play >= ? AND first_play < ?
`
	queryArgs = append(queryArgs, r.From, r.To)

	rows, err := c.Conn.Query(ctx, query, queryArgs...)
	if err != nil {
		return nil, fmt.Errorf("query session metrics: %w", err)
	}
	defer rows.Close()

	now := time.Now().UTC()
	cutoff := now
	report := &dto.SessionMetricsReport{
		Cohort:            cohort,
		ObservationCutoff: cutoff,
	}

	var totalObservedMS, totalFinalizedMS uint64
	for rows.Next() {
		var sess string
		var firstPlay, lastActive time.Time
		var watchMS uint64
		var isCompleted uint8
		if err := rows.Scan(&sess, &firstPlay, &lastActive, &watchMS, &isCompleted); err != nil {
			return nil, err
		}

		report.EligibleSessions++
		totalObservedMS += watchMS

		// 90 min inactivity or explicit completion finalizes session
		inactiveDuration := now.Sub(lastActive)
		isFinalized := isCompleted == 1 || inactiveDuration >= 90*time.Minute
		if now.Sub(firstPlay) > 24*time.Hour {
			report.CappedSessions++
			isFinalized = true
		}

		if isFinalized {
			report.FinalizedSessions++
			totalFinalizedMS += watchMS
		} else {
			report.ProvisionalSessions++
		}
	}

	if report.EligibleSessions > 0 {
		report.AverageObservedWatchMS = float64(totalObservedMS) / float64(report.EligibleSessions)
	}
	if report.FinalizedSessions > 0 {
		report.AverageFinalizedWatchMS = float64(totalFinalizedMS) / float64(report.FinalizedSessions)
	}
	return report, rows.Err()
}

// QualitySummary queries playback quality statistics and percentiles
func (c *Client) QualitySummary(ctx context.Context, workspaceID uuid.UUID, videoID *uuid.UUID, r dto.DateRange) (*dto.QualitySummary, error) {
	filters := " AND workspace_id = ?"
	args := []any{r.From, r.To, workspaceID}
	if videoID != nil {
		filters += " AND video_id = ?"
		args = append(args, *videoID)
	}

	query := `
SELECT
    uniqExactIf(playback_session_id, event_name = 'player_loaded') AS eligible_attempts,
    uniqExactIf(playback_session_id, event_name = 'play_started') AS started_sessions,
    countIf(event_name = 'first_frame_rendered' AND JSONExtractUInt(properties, 'startup_ms') > 0) AS startup_samples,
    avgIf(JSONExtractUInt(properties, 'startup_ms'), event_name = 'first_frame_rendered' AND JSONExtractUInt(properties, 'startup_ms') > 0) AS avg_startup,
    quantileIf(0.5)(JSONExtractUInt(properties, 'startup_ms'), event_name = 'first_frame_rendered' AND JSONExtractUInt(properties, 'startup_ms') > 0) AS median_startup,
    quantileIf(0.95)(JSONExtractUInt(properties, 'startup_ms'), event_name = 'first_frame_rendered' AND JSONExtractUInt(properties, 'startup_ms') > 0) AS p95_startup,
    countIf(event_name = 'buffer_ended' AND JSONExtractUInt(properties, 'buffer_ms') > 0) AS rebuffer_samples,
    quantileIf(0.5)(JSONExtractUInt(properties, 'buffer_ms'), event_name = 'buffer_ended' AND JSONExtractUInt(properties, 'buffer_ms') > 0) AS median_buffer,
    quantileIf(0.95)(JSONExtractUInt(properties, 'buffer_ms'), event_name = 'buffer_ended' AND JSONExtractUInt(properties, 'buffer_ms') > 0) AS p95_buffer,
    toUInt64(countIf(event_name = 'buffer_started')) AS buffer_events,
    uniqExactIf(playback_session_id, event_name = 'buffer_started') AS buffer_sessions,
    toUInt64(sumIf(JSONExtractUInt(properties, 'watch_ms'), event_name = 'playback_heartbeat')) AS watch_ms,
    toUInt64(sumIf(JSONExtractUInt(properties, 'buffer_ms'), event_name = 'buffer_ended')) AS buffer_ms,
    uniqExactIf(playback_session_id, event_name IN ('video_error', 'cdn_error', 'quality_switch_failed')) AS error_sessions
FROM analytics_events FINAL
WHERE event_time >= ? AND event_time < ?` + filters + `
  AND playback_session_id != ''
`
	var (
		attempts, started, startupSamples, rebufferSamples, bufferEvents, bufferSessions, watchMS, bufferMS, errorSessions uint64
		avgStartup, medStartup, p95Startup, medBuffer, p95Buffer                                                            float64
	)

	if err := c.Conn.QueryRow(ctx, query, args...).Scan(
		&attempts, &started, &startupSamples, &avgStartup, &medStartup, &p95Startup,
		&rebufferSamples, &medBuffer, &p95Buffer, &bufferEvents, &bufferSessions,
		&watchMS, &bufferMS, &errorSessions,
	); err != nil {
		return nil, fmt.Errorf("query quality summary: %w", err)
	}

	summary := &dto.QualitySummary{
		Cohort:                   "play_start",
		EligibleSessions:         attempts,
		StartedSessions:          started,
		StartupSamples:           startupSamples,
		StartupMeanMS:            avgStartup,
		RebufferEvents:           bufferEvents,
		RebufferAffectedSessions: bufferSessions,
	}

	// Percentiles require at least 20 samples to avoid misleading noise
	if startupSamples >= 20 {
		summary.StartupMedianMS = &medStartup
		summary.StartupP95MS = &p95Startup
	} else {
		summary.InsufficientData = true
	}

	if rebufferSamples >= 20 {
		summary.RebufferMedianMS = &medBuffer
		summary.RebufferP95MS = &p95Buffer
	}

	if watchMS+bufferMS > 0 {
		summary.RebufferRatio = float64(bufferMS) / float64(watchMS+bufferMS)
	}
	if started > 0 {
		summary.PlaybackErrorSessionRate = float64(errorSessions) / float64(started) * 100
	}
	if attempts > 0 {
		failedBeforePlay := attempts - started
		if failedBeforePlay > 0 && errorSessions > 0 {
			summary.FailureBeforeFirstPlayRate = float64(failedBeforePlay) / float64(attempts) * 100
		}
	}

	return summary, nil
}

// QualitySeries queries daily or hourly quality time-series
func (c *Client) QualitySeries(ctx context.Context, workspaceID uuid.UUID, videoID *uuid.UUID, r dto.DateRange, interval string) ([]dto.QualitySeriesPoint, error) {
	intervalExpr := "toStartOfDay(event_time)"
	if interval == "hour" {
		intervalExpr = "toStartOfHour(event_time)"
	} else if interval == "week" {
		intervalExpr = "toStartOfWeek(event_time, 1)"
	}

	filters := " AND workspace_id = ?"
	args := []any{r.From, r.To, workspaceID}
	if videoID != nil {
		filters += " AND video_id = ?"
		args = append(args, *videoID)
	}

	query := fmt.Sprintf(`
SELECT
    formatDateTime(%s, '%%Y-%%m-%%dT%%H:%%i:%%SZ', 'UTC') AS bucket,
    ifNull(avgIf(JSONExtractUInt(properties, 'startup_ms'), event_name = 'first_frame_rendered' AND JSONExtractUInt(properties, 'startup_ms') > 0), 0) AS startup_mean,
    toUInt64(sumIf(JSONExtractUInt(properties, 'watch_ms'), event_name = 'playback_heartbeat')) AS watch_ms,
    toUInt64(sumIf(JSONExtractUInt(properties, 'buffer_ms'), event_name = 'buffer_ended')) AS buffer_ms,
    uniqExactIf(playback_session_id, event_name IN ('video_error', 'cdn_error', 'quality_switch_failed')) AS error_sessions,
    uniqExactIf(playback_session_id, event_name = 'play_started') AS started_sessions
FROM analytics_events FINAL
WHERE event_time >= ? AND event_time < ?`+filters+`
  AND playback_session_id != ''
GROUP BY bucket
ORDER BY bucket ASC
`, intervalExpr)

	rows, err := c.Conn.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query quality series: %w", err)
	}
	defer rows.Close()

	var result []dto.QualitySeriesPoint
	for rows.Next() {
		var pt dto.QualitySeriesPoint
		var watchMS, bufferMS, errorSessions uint64
		if err := rows.Scan(&pt.Key, &pt.StartupMeanMS, &watchMS, &bufferMS, &errorSessions, &pt.Sessions); err != nil {
			return nil, err
		}
		if watchMS+bufferMS > 0 {
			pt.RebufferRatio = float64(bufferMS) / float64(watchMS+bufferMS)
		}
		if pt.Sessions > 0 {
			pt.PlaybackErrorSessionRate = float64(errorSessions) / float64(pt.Sessions) * 100
		}
		result = append(result, pt)
	}
	return result, rows.Err()
}

func minInt64(a, b int64) int64 {
	if a < b {
		return a
	}
	return b
}

func maxInt64(a, b int64) int64 {
	if a > b {
		return a
	}
	return b
}
