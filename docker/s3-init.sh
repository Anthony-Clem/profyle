#!/bin/sh
# Idempotent bucket setup for local S3 (RustFS). Mirrors the R2 bucket config in staging/prod:
# public read on users/* only, and CORS so the browser can PUT to presigned URLs.
set -eu

aws configure set default.s3.addressing_style path

if ! aws s3api head-bucket --bucket "$S3_BUCKET" 2>/dev/null; then
  aws s3api create-bucket --bucket "$S3_BUCKET"
fi

aws s3api put-bucket-policy --bucket "$S3_BUCKET" --policy "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [{
    \"Sid\": \"PublicReadUserFiles\",
    \"Effect\": \"Allow\",
    \"Principal\": \"*\",
    \"Action\": [\"s3:GetObject\"],
    \"Resource\": [\"arn:aws:s3:::$S3_BUCKET/users/*\"]
  }]
}"

aws s3api put-bucket-cors --bucket "$S3_BUCKET" --cors-configuration "{
  \"CORSRules\": [{
    \"AllowedOrigins\": [\"$APP_ORIGIN\"],
    \"AllowedMethods\": [\"PUT\", \"GET\"],
    \"AllowedHeaders\": [\"*\"],
    \"ExposeHeaders\": [\"ETag\"],
    \"MaxAgeSeconds\": 3000
  }]
}"

echo "s3-init: bucket $S3_BUCKET ready"
