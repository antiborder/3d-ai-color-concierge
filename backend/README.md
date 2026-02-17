# 3D Color Concierge Backend

## セットアップ

### 1. 仮想環境の作成

```bash
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 2. 依存関係のインストール

```bash
pip install -r requirements.txt
```

### 3. 環境変数の設定

```bash
cp env.example .env
# .envファイルを編集してGEMINI_API_KEYを設定
```

**重要**: `GEMINI_API_KEY`は必須です。APIキーは以下から取得できます：
- https://makersuite.google.com/app/apikey

`.env`ファイルの例：
```
GEMINI_API_KEY=your-gemini-api-key-here
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
ENVIRONMENT=development
```

### 4. AWS認証情報の設定

このプロジェクト専用のAWSプロファイルを設定します：

```bash
aws configure --profile 3d-color-concierge
```

入力内容：
- AWS Access Key ID: 作成したアクセスキーID
- AWS Secret Access Key: 作成したシークレットアクセスキー
- Default region name: `ap-northeast-1`
- Default output format: `json`

**重要**: アクセスキーは`.env`ファイルには含めないでください。AWS CLI設定ファイル（`~/.aws/credentials`）を使用してください。

### 5. ローカル開発サーバーの起動

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

APIドキュメント: http://localhost:8000/docs

## デプロイ

このリポジトリのバックエンドは **ECS(Fargate) 上の FastAPI** としてデプロイします（Lambda手順は使用しません）。

### 前提条件
- AWS CLI がインストールされていること
- `aws configure --profile 3d-color-concierge` で認証情報が設定されていること
- Terraform がインストールされていること
- Docker + `buildx`（multi-arch build/push に使用）

### 1) ECRへ Docker イメージを build/push（multi-arch）
Fargate のプラットフォーム差分（amd64/arm64）で `CannotPullContainerError` にならないよう、**multi-arch** で push します。

```bash
export AWS_PROFILE=3d-color-concierge

cd /Users/mo/Projects/3d-color-picker/3d-ai-color-concierge/backend

TAG="v2-$(date +%Y%m%d-%H%M%S)"

# ECR login（403 Forbidden 対策として毎回やるのが安全）
AWS_PROFILE=3d-color-concierge aws ecr get-login-password --region ap-northeast-1 \
| docker login --username AWS --password-stdin 478157933567.dkr.ecr.ap-northeast-1.amazonaws.com

docker buildx build --platform linux/amd64,linux/arm64 \
  -t 478157933567.dkr.ecr.ap-northeast-1.amazonaws.com/3d-color-concierge-backend:$TAG \
  --push .
echo "$TAG"
```

### 2) Terraform apply（ECS/Fargate へ反映）
`infrastructure/terraform/terraform.tfvars` の **`backend_image_tag` を上の `TAG` に更新**し、適用します。

また、最低限以下の変数が必要です（値は例）:
- `gemini_api_key`
- `ws_token_secret`
- `gemini_live_model_name`（例: `gemini-2.5-flash-native-audio-preview-12-2025`）

```bash
export AWS_PROFILE=3d-color-concierge
cd /Users/mo/Projects/3d-color-picker/3d-ai-color-concierge/infrastructure/terraform
terraform init
terraform apply --auto-approve
```

### 3) CloudWatch Logs で確認

```bash
AWS_PROFILE=3d-color-concierge aws logs tail /ecs/3d-color-concierge/backend --since 10m --follow
```

少なくとも以下が見えると、Gemini Live 接続・受信ループ開始までOKです：
- `google-genai live SDK debug ... google_genai_version: "1.63.0"`
- `GeminiLiveSession recv_loop started (live_type=AsyncSession)`

### 参考
フロントデプロイ（S3+CloudFront）は `docs/FRONTEND_DEPLOYMENT.md` を参照してください。

## テスト

ここでは **ECS/Fargate + CloudFront 配下**の確認に寄せます。

### 1) CloudFront 経由で WS トークン取得
`/api/ws/token` が 200 を返せれば、Backend への疎通と Cookie/トークン発行が概ねOKです。

```bash
curl -i "https://<cloudfront-domain>/api/ws/token?return_token=1"
```

期待:
- `HTTP/2 200`
- ボディが `{"token":"..."}` のJSON

### 2) CloudFront 経由で WebSocket 接続（手元で確認）
ブラウザ（フロント）で確認するのが基本ですが、CLI で疎通だけ確認したい場合は `wscat` を使えます。

```bash
# 例: Node 製 wscat（未インストールなら: npm i -g wscat）
wscat -c "wss://<cloudfront-domain>/ws/live?ws_token=<token>"
```

接続後、最初に start を送ります:

```json
{"type":"start","language":"ja"}
```

### 3) CloudWatch Logs で Backend の挙動を見る

```bash
AWS_PROFILE=3d-color-concierge aws logs tail /ecs/3d-color-concierge/backend --since 10m --follow
```

目安:
- `GeminiLiveSession recv_loop started (live_type=AsyncSession)` が出る
- 音声入力後に `LiveServerMessage.server_content...` の解釈が進み、ブラウザへ `ws.send_bytes(...)` が返る（=返信音声が聞こえる）
