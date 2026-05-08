import os
import sys
import boto3
from botocore.exceptions import ClientError, EndpointConnectionError
from config.aws import get_client
def download_file(video_key: str, output_path: str) -> None:
    client = get_client()
    bucket_name = os.getenv("R2_BUCKET")

    # validate env vars
    if not bucket_name:
        raise EnvironmentError("R2_BUCKET is not set")
    if not video_key:
        raise ValueError("video_key cannot be empty")
    if not output_path:
        raise ValueError("output_path cannot be empty")

    try:
        head = client.head_object(Bucket=bucket_name, Key=video_key)
        total_size = head['ContentLength']
        print(f"starting download — key: {video_key} size: {total_size / 1024 / 1024:.2f} MB")

        downloaded = 0

        def progress(bytes_transferred):
            nonlocal downloaded
            downloaded += bytes_transferred
            percent = (downloaded / total_size) * 100
            print(f"download progress: {percent:.1f}%", end='\r')

        client.download_file(
            Bucket=bucket_name,
            Key=video_key,
            Filename=output_path,
            Callback=progress
        )

        print(f"\ndownload complete ✅ — saved to {output_path}")

    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == '404':
            print(f"error: video not found in R2 — key: {video_key}")
            sys.exit(1)
        elif error_code == '403':
            print(f"error: access denied — check R2 credentials")
            sys.exit(1)
        else:
            print(f"error: R2 client error — {error_code}: {e}")
            sys.exit(1)

    except EndpointConnectionError:
        print("error: cannot connect to R2 — check R2_ACCOUNT_ID and network")
        sys.exit(1)

    except OSError as e:
        print(f"error: cannot write to {output_path} — {e}")
        sys.exit(1)

    except Exception as e:
        print(f"error: unexpected error during download — {e}")
        sys.exit(1)