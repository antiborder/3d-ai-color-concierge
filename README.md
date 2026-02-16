# 3D AI Color Concierge

音声（ブラウザ）→ WebSocket → Backend(FastAPI on ECS Fargate) → Gemini Live → 音声返信（ブラウザ再生）までを繋ぐアプリです。

## 構成（概要）
- **Frontend**: 静的ホスティング（S3） + CDN/ルーティング（CloudFront）
- **Backend**: FastAPI（ECS Fargate）
- **Realtime**: ブラウザ ↔ CloudFront ↔ Backend（WebSocket `/ws/live`）
- **LLM**: Gemini Live (`google-genai`)
- **IaC**: Terraform（`infrastructure/terraform/`）

## 前提条件
- Node.js（フロント用）
- Python 3.13（バックエンドローカル実行用。ECSではDocker）
- Docker + `buildx`（multi-arch pushに使用）
- AWS CLI（プロファイル設定済み）
- Terraform

## ローカル開発（フロント）
```bash
npm install
npm start
```

通常は `http://localhost:3000` が開きます。

## ローカル開発（バックエンド）
詳細は `backend/README.md` を参照してください。

## デプロイ（AWS: CloudFront + ECS Fargate）
この手順は「**本番相当（CloudFront配下、同一オリジン）で WebSocket 音声返信まで確認**」するためのものです。

### 0. 重要な変数（Terraform）
`infrastructure/terraform/terraform.tfvars` に最低限これらを設定してください（値は例です）:
- **`gemini_api_key`**: Gemini API Key
- **`ws_token_secret`**: WS token署名用secret
- **`duckdns_domain` / `duckdns_token`**: DuckDNS（バックエンドの到達性のため）
- **`backend_image_tag`**: これからpushするECRイメージタグ
- **`gemini_live_model_name`**: `gemini-2.5-flash-native-audio-preview-12-2025`

### 1. AWS認証（ECR push / Terraform）
以降は例として `AWS_PROFILE=3d-color-concierge` を使います。

```bash
export AWS_PROFILE=3d-color-concierge
aws sts get-caller-identity
```

### 2. Backend: Docker build & push（multi-arch）
Fargateのプラットフォーム差分（amd64/arm64）で詰まらないように **multi-arch** でpushします。

```bash
cd /Users/mo/Projects/3d-color-picker/3d-ai-color-concierge/backend

TAG="v2-$(date +%Y%m%d-%H%M%S)"
echo "$TAG"

# ECR login（403 Forbidden対策として毎回やるのが安全）
AWS_PROFILE=3d-color-concierge aws ecr get-login-password --region ap-northeast-1 \
| docker login --username AWS --password-stdin 478157933567.dkr.ecr.ap-northeast-1.amazonaws.com

docker buildx build --platform linux/amd64,linux/arm64 \
  -t 478157933567.dkr.ecr.ap-northeast-1.amazonaws.com/3d-color-concierge-backend:$TAG \
  --push .
```

### 3. Terraform apply（ECS/CloudFront/設定反映）
`backend_image_tag` を上で出た `TAG` に更新して適用します。

```bash
cd /Users/mo/Projects/3d-color-picker/3d-ai-color-concierge/infrastructure/terraform

# terraform.tfvars の backend_image_tag を更新（手動編集）
terraform init
terraform apply
```

### 4. Frontend: build & deploy（S3 + CloudFront）
既存のスクリプトを使います（詳細は `docs/FRONTEND_DEPLOYMENT.md`）。

```bash
cd /Users/mo/Projects/3d-color-picker/3d-ai-color-concierge/scripts/deploy
./deploy-frontend.sh
```

### 5. 動作確認（CloudWatch Logs）
バックエンドのログを追い、Gemini Live 接続と受信ループが動いていることを確認します。

```bash
AWS_PROFILE=3d-color-concierge aws logs tail /ecs/3d-color-concierge/backend --since 10m --follow
```

少なくとも以下が見えると「SDK・接続・受信ループ開始」まではOKです：
- `google-genai live SDK debug ... google_genai_version: "1.63.0"`
- `GeminiLiveSession recv_loop started (live_type=AsyncSession)`

## トラブルシューティング（よくある詰まり）
### ECR push が 403 Forbidden
`docker login` が別プロファイル/期限切れの可能性が高いです。再ログインしてからpushしてください：

```bash
AWS_PROFILE=3d-color-concierge aws ecr get-login-password --region ap-northeast-1 \
| docker login --username AWS --password-stdin 478157933567.dkr.ecr.ap-northeast-1.amazonaws.com
```

### WebSocket は繋がるが返信音声が返らない
`google-genai==1.63.0` の受信形式は `server_content.model_turn.parts[].inline_data` なので、
バックエンド側がそれを拾って `ws.send_bytes(...)` できているか（CloudWatchログ）を確認してください。

## 関連ドキュメント
- `backend/README.md`（バックエンドのローカル実行・補足）
- `docs/FRONTEND_DEPLOYMENT.md`（フロントデプロイ補足）

