package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"

	analyticsDomain "github.com/ajaysingh2003/vortex-stream/internal/modules/analytics/domain"
	clickhouseConfig "github.com/ajaysingh2003/vortex-stream/internal/shared/config/clickhouse"
	natsConfig "github.com/ajaysingh2003/vortex-stream/internal/shared/config/nats"
	"github.com/nats-io/nats.go"
)

func runAnalyticsConsumer(ctx context.Context, natsClient *natsConfig.Client, clickhouseClient *clickhouseConfig.Client) error {
	sub, err := natsClient.EnsureConsumer()
	if err != nil {
		return err
	}

	defer sub.Unsubscribe()
	for {
		if err := ctx.Err(); err != nil {
			return err
		}
		messages, err := sub.Fetch(10, nats.MaxWait(2*time.Second))
		if err != nil {
			if errors.Is(err, nats.ErrTimeout) {
				continue
			}
			return fmt.Errorf("fetch analytics messages: %w", err)
		}

		for _, message := range messages {
			var batch analyticsDomain.Batch
			if err := json.Unmarshal(message.Data, &batch); err != nil {
				_ = message.Term()
				continue
			}
			if err := clickhouseClient.InsertEvents(ctx, batch.Events); err != nil {
				_ = message.NakWithDelay(5 * time.Second)
				log.Print("analytics storage unavailable; delivery will retry")
				continue
			}
			if err := message.Ack(); err != nil {
				return fmt.Errorf("ack analytics message: %w", err)
			}
		}
	}
}
