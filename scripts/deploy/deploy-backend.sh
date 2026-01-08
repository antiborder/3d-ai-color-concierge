#!/bin/bash
set -e

# AWSプロファイルを設定（このプロジェクト専用）
export AWS_PROFILE=3d-color-concierge

# プロジェクトルートを保存
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

# バックエンドディレクトリに移動
cd "$BACKEND_DIR"

# Lambda用の依存関係をクリーンアップ（以前のデプロイで残っている場合）
echo "Cleaning up previous Lambda dependencies..."
rm -rf *.dist-info __pycache__ */__pycache__ */*/__pycache__
find . -type d -name "*.dist-info" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name "__pycache__" -not -path "./venv/*" -exec rm -rf {} + 2>/dev/null || true

# Lambda用の依存関係をbackendディレクトリに直接インストール
# LambdaはLinux環境で実行されるため、Linux用のwheelをダウンロードする必要がある
echo "Installing dependencies for Lambda deployment (Linux compatible)..."

# pipのバージョンを確認（--platformオプションはpip 21.3+で利用可能）
PIP_CMD=""
if command -v pip3 &> /dev/null; then
    PIP_CMD="pip3"
elif command -v pip &> /dev/null; then
    PIP_CMD="pip"
else
    echo "Error: pip or pip3 not found. Please install Python and pip."
    exit 1
fi

# Lambda用のLinux互換パッケージをインストール
# LambdaはLinux環境（manylinux2014_x86_64）で実行されるため、Linux用のwheelをダウンロードする必要がある
# --platform: Lambdaの実行環境に合わせてLinux用のwheelをダウンロード
# --only-binary=:all: ソースからビルドせず、wheelのみを使用（macOSでビルドしてもLinuxでは動作しないため）
# --python-version: Python 3.13を指定
# --implementation cp: CPython実装を指定
echo "Installing packages with Linux-compatible wheels..."
echo "Note: This may take a few minutes as it downloads Linux wheels..."

if ! $PIP_CMD install -r requirements.txt -t . --upgrade \
    --platform manylinux2014_x86_64 \
    --only-binary=:all: \
    --python-version 3.13 \
    --implementation cp; then
    echo ""
    echo "ERROR: Failed to install packages with Linux wheels."
    echo "This usually means one or more packages don't have pre-built wheels for Linux x86_64."
    echo ""
    echo "Possible solutions:"
    echo "1. Check if all packages in requirements.txt have Linux wheels available"
    echo "2. Consider using a Lambda Layer for dependencies"
    echo "3. Use Docker to build the deployment package (recommended for production)"
    echo ""
    exit 1
fi

echo "Successfully installed all packages with Linux-compatible wheels."

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
    
    # Lambda用の依存関係をクリーンアップ
    echo "Cleaning up Lambda dependencies..."
    cd "$BACKEND_DIR"
    rm -rf *.dist-info */__pycache__ */*/__pycache__
    find . -type d -name "*.dist-info" -exec rm -rf {} + 2>/dev/null || true
    find . -type d -name "__pycache__" -not -path "./venv/*" -exec rm -rf {} + 2>/dev/null || true
    # インストールされたパッケージディレクトリを削除
    rm -rf fastapi uvicorn mangum pydantic pydantic_settings pydantic_core starlette anyio click h11 httptools pyyaml uvloop watchfiles websockets python_multipart botocore boto3 jmespath s3transfer python_dateutil urllib3 idna six typing_extensions annotated_types dotenv 2>/dev/null || true
else
    echo "Deployment cancelled."
    # キャンセル時もクリーンアップ
    echo "Cleaning up Lambda dependencies..."
    cd "$BACKEND_DIR"
    rm -rf *.dist-info */__pycache__ */*/__pycache__
    find . -type d -name "*.dist-info" -exec rm -rf {} + 2>/dev/null || true
    find . -type d -name "__pycache__" -not -path "./venv/*" -exec rm -rf {} + 2>/dev/null || true
    rm -rf fastapi uvicorn mangum pydantic pydantic_settings pydantic_core starlette anyio click h11 httptools pyyaml uvloop watchfiles websockets python_multipart botocore boto3 jmespath s3transfer python_dateutil urllib3 idna six typing_extensions annotated_types dotenv 2>/dev/null || true
fi

