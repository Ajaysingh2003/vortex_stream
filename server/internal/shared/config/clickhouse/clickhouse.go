package clickhouse

import (
	"context"
	"fmt"
	"os"
	"time"

	clickhouseDriver "github.com/ClickHouse/clickhouse-go/v2"
	analyticsDomain "github.com/ajaysingh2003/vortex-stream/internal/modules/analytics/domain"
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
        position_ms, duration_ms, properties
    )`)
	if err != nil {
		return fmt.Errorf("prepare ClickHouse batch: %w", err)
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
	if err := batch.Send(); err != nil {
		return fmt.Errorf("insert ClickHouse events: %w", err)
	}
	return nil
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
