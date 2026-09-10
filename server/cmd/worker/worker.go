package main

import (
	"context"
	"fmt"
	"log"
	"os/signal"
	"syscall"

	clickhouseConfig "github.com/ajaysingh2003/vortex-stream/internal/shared/config/clickhouse"
	natsConfig "github.com/ajaysingh2003/vortex-stream/internal/shared/config/nats"
)

func main() {
	fmt.Println("analytics worker booting")
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	
	fmt.Println("analytics worker connecting to NATS")
	natsClient, err := natsConfig.Connect()
	if err != nil {
		log.Fatal(err)
	}

	defer natsClient.Close()

	fmt.Println("analytics worker connecting to ClickHouse")
	clickhouseClient, err := clickhouseConfig.Connect(ctx)
	if err != nil {
		log.Fatal(err)
	}
	defer clickhouseClient.Close()

	fmt.Println("analytics worker started; consuming analytics.events")
	if err := runAnalyticsConsumer(ctx, natsClient, clickhouseClient); err != nil && ctx.Err() == nil {
		log.Fatal(err)
	}
}
