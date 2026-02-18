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

# Gemini API key sanity check (local dev)
if [ -z "${GEMINI_API_KEY:-}" ]; then
    # .env がある場合は dotenv が読むが、未設定のまま起動するとWS側で 1007 になり分かりづらいので先に止める
    if [ -f ".env" ] && grep -q '^GEMINI_API_KEY=your-gemini-api-key-here' .env; then
        echo "ERROR: GEMINI_API_KEY is still a placeholder in backend/.env. Please set a valid API key and re-run."
        exit 1
    fi
fi

# WebSocket用トークン署名鍵（ローカル開発用）
# - 本番/ECSでは必ず安全な値を環境変数で注入する
# - ローカルは未設定だと /api/ws/token が 500 になるため、自動で生成して有効化する
if [ -z "${WS_TOKEN_SECRET:-}" ]; then
    # Prefer the value in .env if present, to keep local tokens stable across restarts.
    existing_secret="$(grep -E '^WS_TOKEN_SECRET=' .env 2>/dev/null | tail -n 1 | cut -d= -f2- || true)"
    if [ -n "${existing_secret}" ]; then
        WS_TOKEN_SECRET="${existing_secret}"
        export WS_TOKEN_SECRET
    else
        WS_TOKEN_SECRET="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
        export WS_TOKEN_SECRET

        # Ensure .env ends with a newline to avoid concatenating into the last line.
        python3 - <<'PY'
from __future__ import annotations
from pathlib import Path

p = Path(".env")
if not p.exists():
    raise SystemExit(0)
data = p.read_bytes()
if data and not data.endswith(b"\n"):
    p.write_bytes(data + b"\n")
PY

        # Repair a known bad state: GEMINI_API_KEY line accidentally concatenated with WS_TOKEN_SECRET.
        python3 - <<'PY'
from __future__ import annotations
from pathlib import Path

p = Path(".env")
if not p.exists():
    raise SystemExit(0)
lines = p.read_text(encoding="utf-8", errors="replace").splitlines()
out: list[str] = []
for line in lines:
    if line.startswith("GEMINI_API_KEY=") and "WS_TOKEN_SECRET=" in line:
        before, after = line.split("WS_TOKEN_SECRET=", 1)
        out.append(before.rstrip())
        out.append("WS_TOKEN_SECRET=" + after.lstrip())
    else:
        out.append(line)
p.write_text("\n".join(out) + "\n", encoding="utf-8")
PY

        echo "WS_TOKEN_SECRET=${WS_TOKEN_SECRET}" >> .env
        echo "WS_TOKEN_SECRET was not set; generated a local dev secret and stored it in backend/.env"
    fi
fi

# macOS/一部環境ではブラウザが localhost を IPv6(::1) 優先で解決し、
# IPv4(0.0.0.0) だけで待ち受けていると WS が繋がらず 1006 になりうる。
# デフォルトは IPv6 の :: でバインドし、デュアルスタックで受ける。
UVICORN_HOST="${UVICORN_HOST:-::}"
UVICORN_PORT="${UVICORN_PORT:-8000}"
uvicorn app.main:app --reload --host "${UVICORN_HOST}" --port "${UVICORN_PORT}"

