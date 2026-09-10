package nats

import (
	"fmt"
	"os"
	"time"

	"github.com/nats-io/nats.go"
)

type Client struct {
	Conn     *nats.Conn
	JS       nats.JetStreamContext
	Subject  string
	Stream   string
	Consumer string
}

func Connect() (*Client, error) {
	url := os.Getenv("NATS_URL")
	if url == "" {
		url = "nats://nats:4222"
	}

	conn, err := nats.Connect(url, nats.Name("vortex-stream"))
	if err != nil {
		return nil, fmt.Errorf("connect to NATS: %w", err)
	}

	js, err := conn.JetStream()
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("initialize NATS JetStream: %w", err)
	}

	client := &Client{
		Conn: conn, JS: js,
		Subject:  envOr("NATS_SUBJECT", "analytics.events"),
		Stream:   envOr("NATS_STREAM", "ANALYTICS_EVENTS"),
		Consumer: envOr("NATS_CONSUMER", "analytics-clickhouse"),
	}

	if err := client.ensureStream(); err != nil {
		conn.Close()
		return nil, err
	}
	return client, nil
}

func (c *Client) ensureStream() error {
	if _, err := c.JS.StreamInfo(c.Stream); err != nil {
		if err != nats.ErrStreamNotFound {
			return fmt.Errorf("inspect NATS stream: %w", err)
		}
		if _, err := c.JS.AddStream(&nats.StreamConfig{
			Name: c.Stream, Subjects: []string{c.Subject},
			Storage: nats.FileStorage, Retention: nats.LimitsPolicy,
			MaxAge: 30 * 24 * time.Hour,
		}); err != nil {
			return fmt.Errorf("create NATS stream: %w", err)
		}
	}
	return nil
}

func (c *Client) EnsureConsumer() (*nats.Subscription, error) {
	sub, err := c.JS.PullSubscribe(c.Subject, c.Consumer, nats.BindStream(c.Stream))
	if err != nil {
		return nil, fmt.Errorf("create NATS consumer: %w", err)
	}
	return sub, nil
}

func (c *Client) Close() {
	if c == nil || c.Conn == nil {
		return
	}
	_ = c.Conn.Drain()
	c.Conn.Close()
}

func envOr(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
