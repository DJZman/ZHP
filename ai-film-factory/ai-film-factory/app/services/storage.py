# S3-compatible storage adapter (Cloudflare R2 recommended)
import os, io
import boto3
from botocore.client import Config
from typing import Optional

ENDPOINT = os.getenv("S3_ENDPOINT_URL")
REGION = os.getenv("S3_REGION", "auto")
ACCESS_KEY = os.getenv("S3_ACCESS_KEY_ID")
SECRET_KEY = os.getenv("S3_SECRET_ACCESS_KEY")
BUCKET = os.getenv("S3_BUCKET", "ai-film-factory")

_session = boto3.session.Session()
_s3 = _session.client(
    "s3",
    endpoint_url=ENDPOINT,
    region_name=REGION,
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY,
    config=Config(signature_version="s3v4"),
)

def put_object(key: str, data: bytes, content_type: Optional[str] = None) -> str:
    extra = {}
    if content_type:
        extra["ContentType"] = content_type
    _s3.put_object(Bucket=BUCKET, Key=key, Body=data, **extra)
    return f"s3://{BUCKET}/{key}"

def get_signed_url(key: str, expires: int = 3600) -> str:
    return _s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": BUCKET, "Key": key},
        ExpiresIn=expires,
    )
