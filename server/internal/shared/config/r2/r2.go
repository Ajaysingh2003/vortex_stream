package config

import (
	"context"
	"fmt"
	"os"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)
func NewR2Client(ctx context.Context, accountID, accessKey, secretKey string) (*s3.Client, error) {
   
    cfg, err := config.LoadDefaultConfig(ctx,
        config.WithRegion("auto"),
        config.WithCredentialsProvider(credentials.StaticCredentialsProvider{
            Value: aws.Credentials{
                AccessKeyID:     accessKey, 
                SecretAccessKey: secretKey,
                SessionToken:    "", 
                Source:          "Static",
            },
        }),
    )

    if err != nil {
        return nil, fmt.Errorf("failed to load R2 config: %w", err)
    }

    client := s3.NewFromConfig(cfg, func(o *s3.Options) {
        o.BaseEndpoint = aws.String(fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountID))
        o.UsePathStyle = true 
    })

    return client, nil
}

func R2Client () *s3.Client {
	ctx := context.Background()
	accountId := os.Getenv("R2_ACCOUNT_ID")
	apiKey := os.Getenv("R2_ACCESS_KEY")
	r2secret := os.Getenv("R2_SECRET_KEY")
	
	r2Client, err := NewR2Client(ctx, accountId, apiKey , r2secret)
	if err != nil {
		panic(err)
	}
	
	return r2Client
}