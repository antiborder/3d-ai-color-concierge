# 3D Color Concierge Backend

## セットアップ

### 1. 仮想環境の作成

```bash
python -m venv venv
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

### 4. ローカル開発サーバーの起動

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

APIドキュメント: http://localhost:8000/docs

## デプロイ

### Lambda関数のデプロイ

Terraformを使用してデプロイします。

```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

## テスト

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

