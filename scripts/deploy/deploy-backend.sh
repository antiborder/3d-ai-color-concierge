#!/bin/bash
set -e

# バックエンドディレクトリに移動
cd "$(dirname "$0")/../../backend"

# 依存関係のインストール
echo "Installing dependencies..."
pip install -r requirements.txt

# Terraformディレクトリに移動
cd ../infrastructure/terraform

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
    echo "Deployment completed!"
    echo "API endpoint: $(terraform output -raw api_stage_url)"
else
    echo "Deployment cancelled."
fi

