#!/bin/bash
set -euo pipefail

# ECS/Fargate 用バックエンドデプロイスクリプト（ECR push + terraform apply）
#
# 使い方:
#   ./deploy-backend.sh [image_tag]
#
# 例:
#   ./deploy-backend.sh v2-20260216-123000
#
# 前提:
# - AWS CLI / Docker(buildx) / Terraform が利用可能
# - `infrastructure/terraform` が先に apply 済み（ECR/ECS/CloudFront が作成済み）

# プロジェクトルートを保存
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
TERRAFORM_DIR="$PROJECT_ROOT/infrastructure/terraform"

# AWSプロファイル（必要なら外から上書き可）
AWS_PROFILE="${AWS_PROFILE:-3d-color-concierge}"
AWS_REGION="${AWS_REGION:-ap-northeast-1}"

IMAGE_TAG="${1:-}"
if [ -z "$IMAGE_TAG" ]; then
  IMAGE_TAG="v2-$(date +%Y%m%d-%H%M%S)"
fi

echo "Using AWS_PROFILE=$AWS_PROFILE AWS_REGION=$AWS_REGION"
echo "Deploying backend image tag: $IMAGE_TAG"

cd "$TERRAFORM_DIR"

echo "Getting ECR repository URL from Terraform output..."
ECR_REPO_URL="$(terraform output -raw ecr_backend_repository_url 2>/dev/null || true)"
if [ -z "$ECR_REPO_URL" ]; then
  echo "Error: Could not get ecr_backend_repository_url from Terraform."
  echo "Please run 'terraform apply' first to create the infrastructure."
  exit 1
fi
echo "ECR repository: $ECR_REPO_URL"

echo "Logging in to ECR..."
aws ecr get-login-password --region "$AWS_REGION" --profile "$AWS_PROFILE" | \
  docker login --username AWS --password-stdin "$(echo "$ECR_REPO_URL" | cut -d/ -f1)"

echo "Building and pushing multi-arch image (linux/amd64, linux/arm64)..."
cd "$PROJECT_ROOT"
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t "$ECR_REPO_URL:$IMAGE_TAG" \
  --push \
  "$BACKEND_DIR"

echo "Updating terraform.tfvars backend_image_tag..."
cd "$TERRAFORM_DIR"
if ! grep -q '^backend_image_tag' terraform.tfvars; then
  echo "Error: terraform.tfvars does not contain backend_image_tag."
  exit 1
fi
sed -i.bak "s/^backend_image_tag\\s*=\\s*\\\".*\\\"/backend_image_tag = \\\"$IMAGE_TAG\\\"/g" terraform.tfvars
rm -f terraform.tfvars.bak

# Terraform初期化
echo "Initializing Terraform..."
terraform init

# Terraformプラン
echo "Creating Terraform plan..."
terraform plan

# Terraform適用
echo "Applying Terraform configuration..."
read -p "Do you want to apply these changes? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  terraform apply
  echo ""
  echo "=========================================="
  echo "Backend deployment completed!"
  echo "=========================================="
  CLOUDFRONT_URL=$(terraform output -raw cloudfront_url 2>/dev/null || echo "")
  if [ -n "$CLOUDFRONT_URL" ]; then
    echo "CloudFront URL: $CLOUDFRONT_URL"
    echo "WebSocket (Live): ${CLOUDFRONT_URL/https:/wss:}/ws/live"
  fi
else
  echo "Deployment cancelled."
fi

