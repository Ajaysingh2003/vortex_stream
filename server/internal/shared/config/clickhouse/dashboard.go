package clickhouse

import (
	"context"
	"fmt"
	"time"

	dto "github.com/ajaysingh2003/vortex-stream/internal/modules/analytics/dto"
	"github.com/google/uuid"
)

var Dimensions = map[string]string{
	"country": "if(country='', 'Unknown', country)", "referrer": "if(referrer='', 'Direct / unknown', referrer)", "page": "if(page_url='', 'Unknown', page_url)", "device": "if(device_type='', 'Unknown', device_type)", "browser": "if(browser='', 'Unknown', browser)", "os": "if(os='', 'Unknown', os)", "utm_source": "if(utm_source='', 'Unknown', utm_source)", "utm_medium": "if(utm_medium='', 'Unknown', utm_medium)", "utm_campaign": "if(utm_campaign='', 'Unknown', utm_campaign)", "surface": "if(JSONExtractString(properties,'surface')='', 'Unknown', JSONExtractString(properties,'surface'))", "video": "toString(video_id)",
}
var Intervals = map[string]string{"hour": "toStartOfHour(event_time)", "day": "toStartOfDay(event_time)", "week": "toStartOfWeek(event_time,1)"}

func DashboardDimension(dimension, interval string) (string, error) {
	if dimension == "series" {
		if expression, ok := Intervals[interval]; ok {
			return "formatDateTime(" + expression + ", '%Y-%m-%dT%H:%i:%SZ', 'UTC')", nil
		}
	}
	if dimension == "summary" {
		return "'all'", nil
	}
	if expression, ok := Dimensions[dimension]; ok {
		return expression, nil
	}
	return "", fmt.Errorf("invalid analytics dimension or interval")
}

// Aggregate once per playback session and dimension. FINAL removes retries before sums.
func sessionSQL(workspace uuid.UUID, video *uuid.UUID, r dto.DateRange, key string) (string, []any) {
	return scopedQuery(`SELECT `+key+` AS k,video_id,playback_session_id,
 any(anonymous_id) AS viewer,
 max(event_name='play_started') AS viewed,
 max(event_name='player_loaded') AS impression,
 max(event_name='video_completed') AS completed,
 countIf(event_name='video_replayed') AS replays,
 sumIf(JSONExtractUInt(properties,'watch_ms'),event_name='playback_heartbeat') AS watch_ms,
 countIf(event_name='cta_displayed') AS cta_displays,
 countIf(event_name='cta_clicked') AS cta_clicks,
 max(event_name='cta_displayed') AS cta_exposed,
 max(event_name='cta_clicked') AS cta_clicked,
 max(event_name='lead_form_opened') AS form_opened,
 max(event_name='lead_form_submitted') AS form_submitted,
 countIf(event_name='lead_form_opened') AS form_opens,
 countIf(event_name='lead_form_started') AS form_starts,
 countIf(event_name='lead_form_failed') AS form_failures,
 uniqExactIf(JSONExtractString(properties,'submission_id'),event_name='lead_form_submitted' AND JSONExtractString(properties,'submission_id')!='') AS observed_submissions,
 countIf(event_name IN ('video_error','cdn_error','quality_switch_failed')) AS errors,
 countIf(event_name='buffer_started') AS buffers,
 sumIf(JSONExtractUInt(properties,'buffer_ms'),event_name='buffer_ended') AS buffer_ms,
 sumIf(JSONExtractUInt(properties,'startup_ms'),event_name='first_frame_rendered') AS startup_ms,
 countIf(event_name='first_frame_rendered') AS startup_samples,
 max(if(duration_ms>0,least(100.0,ifNull(position_ms,0)/duration_ms*100),0)) AS progress,
 countIf(event_name='end_screen_displayed') AS end_displays,
 countIf(event_name='end_screen_clicked') AS end_clicks
FROM analytics_events FINAL
WHERE event_time >= ? AND event_time < ? AND playback_session_id!=''
GROUP BY k,video_id,playback_session_id`, workspace, video, r)
}
func (c *Client) Dashboard(ctx context.Context, workspace uuid.UUID, video *uuid.UUID, r dto.DateRange, dimension, interval string, limit, offset int) ([]dto.MetricRow, error) {
	key, err := DashboardDimension(dimension, interval)
	if err != nil {
		return nil, err
	}
	inner, args := sessionSQL(workspace, video, r, key)
	query := `SELECT k,toUInt64(sum(viewed)),uniqExactIf(viewer,viewed=1 AND viewer!=''),toUInt64(sum(impression)),toUInt64(sum(watch_ms)),toUInt64(sum(viewed*completed)),toUInt64(sum(replays)),toUInt64(sum(cta_displays)),toUInt64(sum(cta_clicks)),toUInt64(sum(cta_exposed)),toUInt64(sum(cta_exposed*cta_clicked)),toUInt64(sum(form_opens)),toUInt64(sum(form_starts)),toUInt64(sum(form_failures)),toUInt64(sum(observed_submissions)),toUInt64(sum(errors)),toUInt64(sum(buffers)),toUInt64(sum(buffer_ms)),if(sum(startup_samples)>0,sum(startup_ms)/sum(startup_samples),0),if(countIf(viewed=1)>0,sumIf(progress,viewed=1)/countIf(viewed=1),0),toUInt64(sum(end_displays)),toUInt64(sum(end_clicks)),toUInt64(sum(viewed*impression)),toUInt64(sum(form_opened)),toUInt64(sum(form_opened*form_submitted)) FROM (` + inner + `) GROUP BY k`
	if dimension == "series" {
		query += " ORDER BY k ASC"
	} else {
		query += " ORDER BY sum(viewed) DESC,k ASC"
	}
	query += " LIMIT ? OFFSET ?"
	args = append(args, limit, offset)
	rows, err := c.Conn.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := []dto.MetricRow{}
	for rows.Next() {
		row := dto.MetricRow{}
		m := &row.Metrics
		if err := rows.Scan(&row.Key, &m.Views, &m.UniqueViewers, &m.Impressions, &m.PlaybackMS, &m.Completions, &m.Replays, &m.CTADisplays, &m.CTAClicks, &m.CTAExposedSessions, &m.CTAClickingSessions, &m.FormOpens, &m.FormStarts, &m.FormFailures, &m.ObservedSubmissions, &m.Errors, &m.BufferEvents, &m.BufferMS, &m.StartupMS, &m.AverageProgress, &m.EndScreenDisplays, &m.EndScreenClicks, &m.ImpressionPlays, &m.FormOpenedSessions, &m.FormConvertedSessions); err != nil {
			return nil, err
		}
		m.Rates()
		result = append(result, row)
	}
	return result, rows.Err()
}
func (c *Client) Engagement(ctx context.Context, workspace, video uuid.UUID, r dto.DateRange) ([]dto.Engagement, error) {
	inner, args := sessionSQL(workspace, &video, r, "'all'")
	rows, err := c.Conn.Query(ctx, `SELECT threshold,toUInt64(countIf(viewed=1 AND (threshold=0 OR (threshold=100 AND completed=1) OR (threshold<100 AND progress>=threshold)))),toUInt64(countIf(viewed=1)) FROM (`+inner+`) ARRAY JOIN [0,25,50,75,90,100] AS threshold GROUP BY threshold ORDER BY threshold`, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := []dto.Engagement{}
	for rows.Next() {
		var bucket uint8
		var n, base uint64
		if err := rows.Scan(&bucket, &n, &base); err != nil {
			return nil, err
		}
		item := dto.Engagement{Bucket: fmt.Sprintf("%d", bucket), Sessions: n}
		if base > 0 {
			item.Percent = float64(n) / float64(base) * 100
		}
		result = append(result, item)
	}
	return result, rows.Err()
}
func (c *Client) Live(ctx context.Context, workspace uuid.UUID, video *uuid.UUID) (*dto.LiveReport, error) {
	now := time.Now().UTC()
	r := dto.DateRange{From: now.Add(-90 * time.Second), To: now}
	query, args := scopedQuery(`SELECT toString(video_id),playback_session_id,argMax(anonymous_id,event_time),argMax(country,event_time),argMax(JSONExtractBool(properties,'active'),tuple(event_time,event_id)) AS active FROM analytics_events FINAL WHERE event_time >= ? AND event_time < ? AND JSONHas(properties,'active')
GROUP BY video_id,playback_session_id
HAVING active=true`, workspace, video, r)
	rows, err := c.Conn.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := &dto.LiveReport{AsOf: now, WindowSeconds: 90, Countries: []dto.LiveRow{}, Videos: []dto.LiveRow{}}
	unique := map[string]bool{}
	countries := map[string]*dto.LiveRow{}
	videos := map[string]*dto.LiveRow{}
	seen := map[string]map[string]bool{}
	for rows.Next() {
		var vid, session, viewer, country string
		var active bool
		if err := rows.Scan(&vid, &session, &viewer, &country, &active); err != nil {
			return nil, err
		}
		result.ActiveSessions++
		unique[viewer] = true
		if country == "" {
			country = "Unknown"
		}
		for i, pair := range []struct {
			key    string
			values map[string]*dto.LiveRow
		}{{country, countries}, {vid, videos}} {
			if pair.values[pair.key] == nil {
				pair.values[pair.key] = &dto.LiveRow{Key: pair.key}
			}
			pair.values[pair.key].ActiveSessions++
			k := fmt.Sprint(i) + pair.key
			if seen[k] == nil {
				seen[k] = map[string]bool{}
			}
			seen[k][viewer] = true
			pair.values[pair.key].UniqueViewers = uint64(len(seen[k]))
		}
	}
	result.UniqueViewers = uint64(len(unique))
	for _, v := range countries {
		result.Countries = append(result.Countries, *v)
	}
	for _, v := range videos {
		result.Videos = append(result.Videos, *v)
	}
	return result, rows.Err()
}
func (c *Client) Concurrency(ctx context.Context, workspace uuid.UUID, video *uuid.UUID, r dto.DateRange) ([]dto.LiveRow, error) {
	query, args := scopedQuery(`SELECT formatDateTime(toStartOfMinute(event_time),'%Y-%m-%dT%H:%i:%SZ','UTC') AS bucket,uniqExact(tuple(video_id,playback_session_id)),uniqExact(anonymous_id) FROM analytics_events FINAL WHERE event_time >= ? AND event_time < ? AND event_name='playback_heartbeat' AND JSONExtractBool(properties,'active')=true
GROUP BY bucket
ORDER BY bucket`, workspace, video, r)
	rows, err := c.Conn.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []dto.LiveRow{}
	for rows.Next() {
		var item dto.LiveRow
		if err := rows.Scan(&item.Key, &item.ActiveSessions, &item.UniqueViewers); err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, rows.Err()
}
