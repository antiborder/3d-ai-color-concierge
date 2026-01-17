#!/bin/bash
set -e

# バックエンドディレクトリに移動
cd "$(dirname "$0")/../../backend"

# 仮想環境が存在しない場合は作成
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# 仮想環境をアクティベート
echo "Activating virtual environment..."
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係のインストール
echo "Installing dependencies..."
pip install -r requirements.txt

# 環境変数ファイルが存在しない場合は作成
if [ ! -f ".env" ]; then
    echo "Creating .env file from env.example..."
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "Please edit .env file and set your GEMINI_API_KEY"
    else
        echo "# Gemini API Configuration" > .env
        echo "GEMINI_API_KEY=your-gemini-api-key-here" >> .env
        echo "# CORS_ORIGINS=http://localhost:3000,http://localhost:5173" >> .env
        echo "ENVIRONMENT=development" >> .env
        echo "API_VERSION=v1" >> .env
        echo "API_STAGE_NAME=dev" >> .env
        echo "Please edit .env file and set your GEMINI_API_KEY"
    fi
fi

# FastAPIサーバーを起動
echo "Starting FastAPI server..."
echo "API documentation: http://localhost:8000/docs"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

