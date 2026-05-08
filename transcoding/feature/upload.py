import os
from config.aws import get_client

def upload_to_r2(local_folder: str, video_id: str):
    client = get_client()
    bucket = "vortex-primary"
    print(bucket,"leah jaye")
    uploaded = 0

    for root, dirs, files in os.walk(local_folder):
        for file in files:
            local_path = os.path.join(root, file)

            # convert local path to R2 key
            # /tmp/hls/{video_id}/1080p/seg000.ts
            # → processed/{video_id}/1080p/seg000.ts
            relative_path = os.path.relpath(local_path, local_folder)
            r2_key = f"processed/{video_id}/{relative_path}"

            # set correct content type
            content_type = "application/x-mpegURL" if file.endswith(".m3u8") else "video/MP2T"

            client.upload_file(
                Filename=local_path,
                Bucket=bucket,
                Key=r2_key,
                ExtraArgs={"ContentType": content_type}
            )

            uploaded += 1
            print(f"uploaded: {r2_key}")

    print(f"upload complete ✅ — {uploaded} files uploaded")