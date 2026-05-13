package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	appconfig "github.com/ajaysingh2003/vortex-stream/internal/shared/config/aws"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	// appconfig "yourproject/config"
)

type VideoJob struct {
    VideoKey string `json:"video_key"`
    VideoID  string `json:"video_id"`
}

func PushVideoJob(videoKey, videoID string) error {
    payload, err := json.Marshal(VideoJob{
        VideoKey: videoKey,
        VideoID:  videoID,
    })
	fmt.Print("india",payload)
	
	if err != nil {
		return err
	}
    data, err := appconfig.SQSClient.SendMessage(context.TODO(), &sqs.SendMessageInput{
        QueueUrl:    aws.String(os.Getenv("SQS_QUEUE_URL")),
        MessageBody: aws.String(string(payload)),
    })
	
	
	if err!=nil{
		fmt.Print(err,"leah")
		return err
	}
	fmt.Print(data.MessageId,"leah goti")

	return  nil
}