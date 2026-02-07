# フロントエンドデプロイ手順

## 前提条件

1. AWS CLIがインストールされていること
2. `aws configure --profile 3d-color-concierge`で認証情報が設定されていること
3. Terraformがインストールされていること
4. バックエンドのAPI Gatewayが既にデプロイされていること

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

**重要**: `main.tf`に重複しているAPI Gatewayリソース（355-372行目）がある場合は、削除してください。既存のAPI Gatewayリソース（147-160行目）が正しく動作します。

### 2. 環境変数の設定

フロントエンドのビルド時にAPI GatewayのURLを設定します。

```bash
cd frontend

# .envファイルを作成（.env.exampleをコピー）
cp .env.example .env

# .envファイルを編集して、API GatewayのURLを設定
# VITE_API_BASE_URL=https://r9o5cdmnbc.execute-api.ap-northeast-1.amazonaws.com/dev
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

CloudFront URLを取得して、API GatewayのCORS設定に追加する必要があります。

```bash
cd infrastructure/terraform

# CloudFront URLを取得
CLOUDFRONT_URL=$(terraform output -raw cloudfront_url)
echo "CloudFront URL: $CLOUDFRONT_URL"
```

その後、以下のいずれかの方法でCORS設定を更新します：

#### 方法1: Terraform変数を更新

`terraform.tfvars`ファイルにCloudFront URLを追加：

```hcl
cors_origins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://<cloudfront-domain-name>.cloudfront.net"
]
```

その後、`terraform apply`を実行してAPI Gatewayを更新します。

#### 方法2: AWSコンソールから手動更新

1. AWSコンソールでAPI Gatewayに移動
2. CORS設定を編集
3. CloudFront URLを追加

## トラブルシューティング

### S3バケットが見つからない

Terraformでインフラが作成されていない可能性があります。`terraform apply`を実行してください。

### CloudFrontキャッシュが更新されない

CloudFrontのキャッシュ無効化には数分かかることがあります。しばらく待ってから再度アクセスしてください。

### CORSエラーが発生する

API GatewayのCORS設定にCloudFront URLが含まれているか確認してください。

## デプロイ後の確認

1. CloudFront URLにアクセスして、アプリケーションが表示されることを確認
2. 音声認識機能が動作することを確認
3. APIリクエストが正常に送信されることを確認（ブラウザの開発者ツールで確認）
