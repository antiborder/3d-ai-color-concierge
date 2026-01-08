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
cp .env.example .env
# .envファイルを編集して必要な環境変数を設定
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

### 前提条件

- AWS CLIがインストールされていること
- `aws configure --profile 3d-color-concierge`で認証情報が設定されていること
- Terraformがインストールされていること

### デプロイ方法

デプロイスクリプトを使用（推奨）：

```bash
./scripts/deploy/deploy-backend.sh
```

このスクリプトは自動的に`3d-color-concierge`プロファイルを使用し、以下の処理を実行します：
1. Lambda用の依存関係をLinux互換のwheelとしてインストール
2. TerraformでLambda関数とAPI Gatewayをデプロイ
3. デプロイ後のクリーンアップ

デプロイが完了すると、APIエンドポイントのURLが表示されます。

### 手動デプロイ

```bash
export AWS_PROFILE=3d-color-concierge
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

## テスト

### ローカル環境

```bash
# ヘルスチェック
curl http://localhost:8000/health

# 音声処理エンドポイント（モック）
curl -X POST http://localhost:8000/api/voice/process \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "赤を選んで",
    "current_color": {"r": 128, "g": 128, "b": 128},
    "conversation_history": [],
    "language": "ja"
  }'
```

### デプロイ後のテスト

デプロイ完了後、表示されたAPIエンドポイントに対してテストを実行：

```bash
# ヘルスチェック
curl https://<api-endpoint>/dev/health

# ルートエンドポイント
curl https://<api-endpoint>/dev/
```
