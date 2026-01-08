"""
Lambda handler for FastAPI application using Mangum
"""
import os
from mangum import Mangum
from app.main import app

# API Gateway v2 HTTP APIのステージ名をベースパスとして設定
# 環境変数から取得、デフォルトは空文字列（ステージ名がパスに含まれない場合）
stage_name = os.getenv("API_STAGE_NAME", "")
api_gateway_base_path = f"/{stage_name}" if stage_name else ""

# Mangum adapter for AWS Lambda
# api_gateway_base_path: API Gatewayのステージ名がパスに含まれる場合に設定
handler = Mangum(
    app,
    lifespan="off",
    api_gateway_base_path=api_gateway_base_path if api_gateway_base_path else None
)

