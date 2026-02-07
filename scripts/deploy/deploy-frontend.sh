#!/bin/bash
set -e

# AWSプロファイルを設定（このプロジェクト専用）
export AWS_PROFILE=3d-color-concierge

# プロジェクトルートを保存
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
TERRAFORM_DIR="$PROJECT_ROOT/infrastructure/terraform"

# フロントエンドディレクトリに移動
cd "$FRONTEND_DIR"

# 環境変数の確認
if [ -z "$VITE_API_BASE_URL" ]; then
  echo "Warning: VITE_API_BASE_URL is not set. Using default from terraform output."
  echo "If you want to set a custom API URL, export VITE_API_BASE_URL before running this script."
fi

# フロントエンドをビルド
echo "Building frontend..."
npm run build

if [ ! -d "dist" ]; then
  echo "Error: Build failed. dist directory not found."
  exit 1
fi

echo "Build completed successfully."

# Terraformディレクトリに移動
cd "$TERRAFORM_DIR"

# S3バケット名を取得
echo "Getting S3 bucket name from Terraform..."
BUCKET_NAME=$(terraform output -raw frontend_s3_bucket_name 2>/dev/null || echo "")

if [ -z "$BUCKET_NAME" ]; then
  echo "Error: Could not get S3 bucket name from Terraform."
  echo "Please run 'terraform apply' first to create the infrastructure."
  exit 1
fi

echo "S3 bucket name: $BUCKET_NAME"

# S3バケットにファイルをアップロード
echo "Uploading files to S3..."
cd "$FRONTEND_DIR"
aws s3 sync dist/ "s3://$BUCKET_NAME/" --delete --profile 3d-color-concierge

echo "Files uploaded successfully."

# CloudFrontキャッシュを無効化
echo "Invalidating CloudFront cache..."
DISTRIBUTION_ID=$(terraform -chdir="$TERRAFORM_DIR" output -raw cloudfront_distribution_id 2>/dev/null || echo "")

if [ -n "$DISTRIBUTION_ID" ]; then
  aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/*" \
    --profile 3d-color-concierge > /dev/null
  echo "CloudFront cache invalidation created."
else
  echo "Warning: Could not get CloudFront distribution ID. Cache invalidation skipped."
fi

# CloudFront URLを表示
echo ""
echo "=========================================="
echo "Deployment completed!"
echo "=========================================="
CLOUDFRONT_URL=$(terraform -chdir="$TERRAFORM_DIR" output -raw cloudfront_url 2>/dev/null || echo "")
if [ -n "$CLOUDFRONT_URL" ]; then
  echo "Frontend URL: $CLOUDFRONT_URL"
else
  echo "Warning: Could not get CloudFront URL from Terraform output."
fi
echo ""
echo "Note: It may take a few minutes for CloudFront to propagate the changes."
echo ""
