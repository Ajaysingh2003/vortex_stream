package clickhouse

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	clickhouseDriver "github.com/ClickHouse/clickhouse-go/v2"
	analyticsDomain "github.com/ajaysingh2003/vortex-stream/internal/modules/analytics/domain"
	"github.com/google/uuid"
)

type Client struct {
	Conn clickhouseDriver.Conn
}

func Connect(ctx context.Context) (*Client, error) {
	conn, err := clickhouseDriver.Open(&clickhouseDriver.Options{
		Addr: []string{envOr("CLICKHOUSE_ADDR", "clickhouse:9000")},
		Auth: clickhouseDriver.Auth{
			Database: envOr("CLICKHOUSE_DATABASE", "analytics"),
			Username: envOr("CLICKHOUSE_USERNAME", "analytics_user"),
			Password: os.Getenv("CLICKHOUSE_PASSWORD"),
		},
		DialTimeout: 10 * time.Second,
	})
	if err != nil {
		return nil, fmt.Errorf("open ClickHouse connection: %w", err)
	}
	client := &Client{Conn: conn}
	if err := client.Conn.Ping(ctx); err != nil {
		_ = client.Conn.Close()
		return nil, fmt.Errorf("ping ClickHouse: %w", err)
	}
	if err := client.ensureSchema(ctx); err != nil {
		_ = client.Conn.Close()
		return nil, err
	}
	return client, nil
}

func (c *Client) ensureSchema(ctx context.Context) error {
	query := `
CREATE TABLE IF NOT EXISTS analytics_events (
    event_id UUID,
    event_name LowCardinality(String),
    event_version UInt16,
    event_time DateTime64(3, 'UTC'),
    anonymous_id String,
    session_id String,
    playback_session_id String,
    user_id Nullable(UUID),
    workspace_id Nullable(UUID),
    video_id Nullable(UUID),
    page_url String,
    referrer String,
    utm_source String,
    utm_medium String,
    utm_campaign String,
    device_type LowCardinality(String),
    browser LowCardinality(String),
    os LowCardinality(String),
    country LowCardinality(String),
    position_ms Nullable(Int64),
    duration_ms Nullable(Int64),
    properties String,
    event_sequence UInt32 DEFAULT 0,
    media_revision_id String DEFAULT '',
    experience_revision_id String DEFAULT '',
    monotonic_elapsed_ms Int64 DEFAULT 0,
    received_at DateTime64(3, 'UTC') DEFAULT now64(3),
    visibility LowCardinality(String) DEFAULT '',
    surface LowCardinality(String) DEFAULT '',
    is_preview UInt8 DEFAULT 0,
    cta_id String DEFAULT '',
    chapter_id String DEFAULT '',
    subtitle_track_id String DEFAULT '',
    segments_json String DEFAULT '',
    ingested_at DateTime64(3, 'UTC') DEFAULT now64(3)
)
ENGINE = ReplacingMergeTree(ingested_at)
PARTITION BY toYYYYMM(event_time)
ORDER BY (workspace_id, video_id, event_name, event_time, event_id)
TTL event_time + INTERVAL 365 DAY
SETTINGS allow_nullable_key = 1;
`
	if err := c.Conn.Exec(ctx, query); err != nil {
		return fmt.Errorf("create analytics schema: %w", err)
	}

	// Safe evolutionary migrations for existing installations
	alterCols := []string{
		"ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS event_sequence UInt32 DEFAULT 0",
		"ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS media_revision_id String DEFAULT ''",
		"ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS experience_revision_id String DEFAULT ''",
		"ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS monotonic_elapsed_ms Int64 DEFAULT 0",
		"ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS received_at DateTime64(3, 'UTC') DEFAULT now64(3)",
		"ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS visibility LowCardinality(String) DEFAULT ''",
		"ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS surface LowCardinality(String) DEFAULT ''",
		"ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS is_preview UInt8 DEFAULT 0",
		"ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS cta_id String DEFAULT ''",
		"ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS chapter_id String DEFAULT ''",
		"ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS subtitle_track_id String DEFAULT ''",
		"ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS segments_json String DEFAULT ''",
	}
	for _, alter := range alterCols {
		_ = c.Conn.Exec(ctx, alter)
	}

	segmentsQuery := `
CREATE TABLE IF NOT EXISTS analytics_played_segments (
    event_id UUID,
    workspace_id UUID,
    video_id UUID,
    media_revision_id String,
    playback_session_id String,
    slice_index UInt16,
    start_ms Int64,
    end_ms Int64,
    playback_ms Int64,
    playback_rate Float32,
    visibility LowCardinality(String),
    subtitle_track_id String,
    event_time DateTime64(3, 'UTC'),
    ingested_at DateTime64(3, 'UTC') DEFAULT now64(3)
)
ENGINE = ReplacingMergeTree(ingested_at)
PARTITION BY toYYYYMM(event_time)
ORDER BY (workspace_id, video_id, playback_session_id, start_ms, event_id, slice_index)
TTL event_time + INTERVAL 365 DAY;
`
	if err := c.Conn.Exec(ctx, segmentsQuery); err != nil {
		return fmt.Errorf("create analytics_played_segments: %w", err)
	}

	attributionQuery := `
CREATE TABLE IF NOT EXISTS analytics_lead_attributions (
    submission_id UUID,
    workspace_id UUID,
    video_id UUID,
    form_id UUID,
    form_version UInt16,
    placement LowCardinality(String),
    submitted_at DateTime64(3, 'UTC'),
    playback_session_id String,
    media_revision_id String,
    experience_revision_id String,
    country LowCardinality(String),
    country_source LowCardinality(String),
    page_origin String,
    referrer_origin String,
    utm_source String,
    utm_medium String,
    utm_campaign String,
    surface LowCardinality(String),
    attribution_version UInt16,
    skipped UInt8,
    ingested_at DateTime64(3, 'UTC') DEFAULT now64(3)
)
ENGINE = ReplacingMergeTree(ingested_at)
PARTITION BY toYYYYMM(submitted_at)
ORDER BY (workspace_id, video_id, submission_id)
TTL submitted_at + INTERVAL 365 DAY;
`
	if err := c.Conn.Exec(ctx, attributionQuery); err != nil {
		return fmt.Errorf("create analytics_lead_attributions: %w", err)
	}

	return nil
}

func (c *Client) InsertEvents(ctx context.Context, events []analyticsDomain.Event) error {
	if len(events) == 0 {
		return nil
	}
	batch, err := c.Conn.PrepareBatch(ctx, `INSERT INTO analytics_events (
        event_id, event_name, event_version, event_time, anonymous_id, session_id,
        playback_session_id, user_id, workspace_id, video_id, page_url, referrer,
        utm_source, utm_medium, utm_campaign, device_type, browser, os, country,
        position_ms, duration_ms, properties, event_sequence, media_revision_id,
        experience_revision_id, monotonic_elapsed_ms, received_at, visibility,
        surface, is_preview, cta_id, chapter_id, subtitle_track_id, segments_json
    )`)
	if err != nil {
		// Fallback to legacy insert signature if database hasn't applied alter columns yet
		return c.insertLegacyEvents(ctx, events)
	}

	defer batch.Abort()

	var playedSegments []analyticsDomain.Event
	var attributionEvents []analyticsDomain.Event

	for _, event := range events {
		var previewVal uint8
		if event.IsPreview {
			previewVal = 1
		}
		var segmentsJSON string
		if len(event.Segments) > 0 {
			if b, err := json.Marshal(event.Segments); err == nil {
				segmentsJSON = string(b)
			}
			playedSegments = append(playedSegments, event)
		}
		if event.EventName == "lead_submission_saved" {
			attributionEvents = append(attributionEvents, event)
		}

		if err := batch.Append(
			event.EventID, event.EventName, event.EventVersion, event.OccurredAt,
			event.AnonymousID, event.SessionID, event.PlaybackSessionID,
			event.UserID, event.WorkspaceID, event.VideoID, event.PageURL, event.Referrer,
			event.UTMSource, event.UTMMedium, event.UTMCampaign, event.DeviceType,
			event.Browser, event.OS, event.Country, event.PositionMS, event.DurationMS,
			string(event.Properties), event.EventSequence, event.MediaRevisionID,
			event.ExperienceRevisionID, event.MonotonicElapsedMS, event.ReceivedAt,
			event.Visibility, event.Surface, previewVal, event.CTAID, event.ChapterID,
			event.SubtitleTrackID, segmentsJSON,
		); err != nil {
			return fmt.Errorf("append ClickHouse event: %w", err)
		}
	}
	if err := batch.Send(); err != nil {
		return fmt.Errorf("insert ClickHouse events: %w", err)
	}

	if len(playedSegments) > 0 {
		if err := c.insertPlayedSegments(ctx, playedSegments); err != nil {
			// Log or return error
			return fmt.Errorf("insert ClickHouse played segments: %w", err)
		}
	}

	if len(attributionEvents) > 0 {
		if err := c.insertLeadAttributions(ctx, attributionEvents); err != nil {
			return fmt.Errorf("insert ClickHouse lead attributions: %w", err)
		}
	}

	return nil
}

func (c *Client) insertLegacyEvents(ctx context.Context, events []analyticsDomain.Event) error {
	batch, err := c.Conn.PrepareBatch(ctx, `INSERT INTO analytics_events (
        event_id, event_name, event_version, event_time, anonymous_id, session_id,
        playback_session_id, user_id, workspace_id, video_id, page_url, referrer,
        utm_source, utm_medium, utm_campaign, device_type, browser, os, country,
        position_ms, duration_ms, properties
    )`)
	if err != nil {
		return fmt.Errorf("prepare legacy ClickHouse batch: %w", err)
	}
	defer batch.Abort()
	for _, event := range events {
		if err := batch.Append(
			event.EventID, event.EventName, event.EventVersion, event.OccurredAt,
			event.AnonymousID, event.SessionID, event.PlaybackSessionID,
			event.UserID, event.WorkspaceID, event.VideoID, event.PageURL, event.Referrer,
			event.UTMSource, event.UTMMedium, event.UTMCampaign, event.DeviceType,
			event.Browser, event.OS, event.Country, event.PositionMS, event.DurationMS,
			string(event.Properties),
		); err != nil {
			return fmt.Errorf("append ClickHouse event: %w", err)
		}
	}
	return batch.Send()
}

func (c *Client) insertPlayedSegments(ctx context.Context, events []analyticsDomain.Event) error {
	batch, err := c.Conn.PrepareBatch(ctx, `INSERT INTO analytics_played_segments (
        event_id, workspace_id, video_id, media_revision_id, playback_session_id,
        slice_index, start_ms, end_ms, playback_ms, playback_rate, visibility,
        subtitle_track_id, event_time
    )`)
	if err != nil {
		return err
	}
	defer batch.Abort()
	for _, e := range events {
		if e.WorkspaceID == nil || e.VideoID == nil {
			continue
		}
		for idx, slice := range e.Segments {
			rate := float32(slice.Rate)
			if rate <= 0 {
				rate = 1.0
			}
			vis := slice.Visibility
			if vis == "" {
				vis = e.Visibility
			}
			sub := slice.SubtitleTrackID
			if sub == "" {
				sub = e.SubtitleTrackID
			}
			if err := batch.Append(
				e.EventID, *e.WorkspaceID, *e.VideoID, e.MediaRevisionID, e.PlaybackSessionID,
				uint16(idx), slice.StartMS, slice.EndMS, slice.PlaybackMS, rate, vis, sub, e.OccurredAt,
			); err != nil {
				return err
			}
		}
	}
	return batch.Send()
}

func (c *Client) insertLeadAttributions(ctx context.Context, events []analyticsDomain.Event) error {
	batch, err := c.Conn.PrepareBatch(ctx, `INSERT INTO analytics_lead_attributions (
        submission_id, workspace_id, video_id, form_id, form_version, placement,
        submitted_at, playback_session_id, media_revision_id, experience_revision_id,
        country, country_source, page_origin, referrer_origin, utm_source, utm_medium,
        utm_campaign, surface, attribution_version, skipped
    )`)
	if err != nil {
		return err
	}
	defer batch.Abort()
	for _, e := range events {
		if e.WorkspaceID == nil || e.VideoID == nil {
			continue
		}
		var p map[string]interface{}
		_ = json.Unmarshal(e.Properties, &p)
		subIDStr, _ := p["submission_id"].(string)
		subID, err := uuid.Parse(subIDStr)
		if err != nil {
			continue
		}
		formIDStr, _ := p["form_id"].(string)
		formID, _ := uuid.Parse(formIDStr)
		placement, _ := p["placement"].(string)
		formVer, _ := p["form_version"].(float64)
		countrySrc, _ := p["country_source"].(string)
		pageOrig, _ := p["page_origin"].(string)
		refOrig, _ := p["referrer_origin"].(string)
		attrVer, _ := p["attribution_version"].(float64)
		skippedVal, _ := p["skipped"].(bool)
		var skippedUint uint8
		if skippedVal {
			skippedUint = 1
		}

		if err := batch.Append(
			subID, *e.WorkspaceID, *e.VideoID, formID, uint16(formVer), placement,
			e.OccurredAt, e.PlaybackSessionID, e.MediaRevisionID, e.ExperienceRevisionID,
			e.Country, countrySrc, pageOrig, refOrig, e.UTMSource, e.UTMMedium,
			e.UTMCampaign, e.Surface, uint16(attrVer), skippedUint,
		); err != nil {
			return err
		}
	}
	return batch.Send()
}

func (c *Client) Close() error {
	if c == nil || c.Conn == nil {
		return nil
	}
	return c.Conn.Close()
}

func envOr(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
