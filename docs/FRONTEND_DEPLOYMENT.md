# フロントエンドデプロイ手順

## 前提条件

1. AWS CLIがインストールされていること
2. `aws configure --profile 3d-color-concierge`で認証情報が設定されていること
3. Terraformがインストールされていること
4. バックエンド（ECS/Fargate）がTerraformで作成済みであること（CloudFront配下 `/api/*`, `/ws/*` に到達できる）

## デプロイ手順

### 1. Terraformでインフラをデプロイ

まず、S3バケットとCloudFrontディストリビューションを作成します。

```bash
cd infrastructure/terraform

# Terraform初期化
terraform init

# プラン確認
terraform plan

# 適用（確認後）
terraform apply
```

### 2. 環境変数の設定

フロントエンドのビルド時に CloudFront 配下の API/WS を参照するように設定します（同一オリジン推奨）。

```bash
cd frontend

# .envファイルを作成（.env.exampleをコピー）
cp .env.example .env

# .envファイルを編集して、CloudFront（同一オリジン）のURLを設定
# VITE_API_BASE_URL=https://<cloudfront-domain-name>.cloudfront.net
# VITE_WS_BASE_URL=wss://<cloudfront-domain-name>.cloudfront.net
```

### 3. フロントエンドをデプロイ

デプロイスクリプトを実行します。

```bash
cd ../scripts/deploy
./deploy-frontend.sh
```

このスクリプトは以下を実行します：
1. フロントエンドをビルド
2. S3バケットにファイルをアップロード
3. CloudFrontキャッシュを無効化
4. CloudFront URLを表示

### 4. CORS設定の更新（初回のみ）

CloudFront URLを取得して、バックエンドのCORS許可オリジンに追加します（Terraform変数 `cors_origins`）。

```bash
cd infrastructure/terraform

# CloudFront URLを取得
CLOUDFRONT_URL=$(terraform output -raw cloudfront_url)
echo "CloudFront URL: $CLOUDFRONT_URL"
```

その後、以下の方法でCORS設定を更新します：

#### 方法1: Terraform変数を更新

`terraform.tfvars`ファイルにCloudFront URLを追加：

```hcl
cors_origins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://<cloudfront-domain-name>.cloudfront.net"
]
```

その後、`terraform apply`を実行してバックエンド（ECSタスク定義の環境変数 `CORS_ORIGINS`）を更新します。

## トラブルシューティング

### S3バケットが見つからない

Terraformでインフラが作成されていない可能性があります。`terraform apply`を実行してください。

### CloudFrontキャッシュが更新されない

CloudFrontのキャッシュ無効化には数分かかることがあります。しばらく待ってから再度アクセスしてください。

### CORSエラーが発生する

バックエンドの `CORS_ORIGINS` に CloudFront URL が含まれているか確認してください（Terraform `cors_origins`）。

## デプロイ後の確認

1. CloudFront URLにアクセスして、アプリケーションが表示されることを確認
2. 音声認識機能が動作することを確認
3. APIリクエストが正常に送信されることを確認（ブラウザの開発者ツールで確認）
