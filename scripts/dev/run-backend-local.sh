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
    echo "Creating .env file from .env.example..."
    cp .env.example .env 2>/dev/null || echo "# CORS_ORIGINS=http://localhost:3000,http://localhost:5173" > .env
fi

# FastAPIサーバーを起動
echo "Starting FastAPI server..."
echo "API documentation: http://localhost:8000/docs"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

