package utils
import (
	"context"
	"time"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	
)

func GenerateUploadURL(client *s3.Client, bucket, key, contentType string) (string, error) {
    presignClient := s3.NewPresignClient(client)

    // 2. Presign the PUT request
    req, err := presignClient.PresignPutObject(
        context.TODO(),
        &s3.PutObjectInput{
            Bucket:      &bucket,
            Key:         &key,
        },
        s3.WithPresignExpires(10*time.Minute),
    )

    if err != nil {
        return "", err
    }

    return req.URL, nil
}