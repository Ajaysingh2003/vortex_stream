import boto3
import os

def get_client():
    try:
        return boto3.client(
        's3',
        endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ['R2_ACCESS_KEY'],
        aws_secret_access_key=os.environ['R2_SECRET_KEY'],
        region_name='auto'
    )
    except  Exception as e:
        print(e)
