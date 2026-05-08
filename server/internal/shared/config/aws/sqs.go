package aws

import (
	"context"
	"fmt"
	"os"
	"github.com/aws/aws-sdk-go-v2/credentials"
	// "github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
)

var SQSClient *sqs.Client

func InitSqs()  {
	region := os.Getenv("AWS_REGION")
	// fmt.Print(region,"lana")
	cfg, err := config.LoadDefaultConfig(context.TODO(),
        config.WithRegion(region),
		config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(
				os.Getenv("AWS_ACCESS_KEY"),
            	os.Getenv("AWS_ACCESS_SECRET"),"",
			),
		),
    )
    if err != nil {
        panic("failed to init SQS: " + err.Error())
    }
	fmt.Print("sqs started")
    
	SQSClient = sqs.NewFromConfig(cfg)
	
}