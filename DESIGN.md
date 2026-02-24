# 3D AI Color Curator - 設計ドキュメント

## 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [機能仕様](#機能仕様)
3. [インフラ構成・アーキテクチャ](#インフラ構成アーキテクチャ)
4. [技術スタック](#技術スタック)
5. [プロジェクト構造](#プロジェクト構造)
6. [データフロー](#データフロー)
7. [実装ステップ（段階的実装プラン）](#実装ステップ段階的実装プラン)
8. [注意点・制約事項](#注意点制約事項)

---

## プロジェクト概要

### 目的
3Dカラーピッカーアプリに音声操作機能とAIカラーキュレーター機能を統合し、音声による直感的な色選択・調整と、AIによるカラーコーディネート提案を実現する。

### 主要機能
1. **音声操作機能**: 音声による色選択、値調整、表示変更などのUI操作
2. **AIカラーキュレーター**: ユーザーの要望に基づいた色の提案とカラーコーディネート
3. **多言語対応**: 日本語・英語対応
4. **音声読み上げ**: チャットボット応答の音声合成

---

## 機能仕様

### 1. 音声操作機能

#### 1.1 対応コマンド

| コマンドタイプ | 説明 | 例 |
|--------------|------|-----|
| SELECT_COLOR | 色を選択 | 「赤を選んで」「落ち着いた青を選んで」 |
| ADJUST_VALUE | 値を調整 | 「明度を上げて」「彩度を下げて」 |
| CHANGE_SHAPE | 色空間を切り替え | 「RGBに切り替えて」「HSLモードにして」 |
| TOGGLE_LABEL | ラベルの表示/非表示 | 「ラベルを表示して」 |
| SET_COLOR | RGB値を直接設定 | 「Rを255に」 |

#### 1.2 音声認識
- **技術**: Web Speech API
- **対応言語**: 日本語（ja-JP）、英語（en-US）
- **フィードバック**: 音声認識中は視覚的フィードバック（わかりやすい記号）
- **フォールバック**: テキスト入力欄を常時配置

#### 1.3 コマンド実行
- 既存のハンドラー関数を再利用
- 音声コマンドと通常のUI操作で同じロジックを使用
- リアルタイムでUI更新

### 2. AIカラーキュレーター機能

#### 2.1 機能概要
- **統合処理**: コマンド解析とチャットボットを同一LLM（Gemini 3 Flash）で処理
- **会話履歴**: 会話履歴を考慮した意図抽出と応答生成

#### 2.2 カラーコーディネート提案

##### 提案の種類
1. **単色提案**
   - ユーザー要望に基づいて1色を提案
   - 提案された色を自動的にUIに適用（選択状態にする）
   - カラーキューブなどに反映

2. **カラーコーディネート提案**
   - 3組まで提案（初期実装）
   - 提案パターン（優先順位順）:
     1. 文字色・背景色（Text/Background）
     2. Primary/Secondary色
     3. 枠色・中身の色（Border/Content）
     4. その他（Accent色、グラデーションなど）
   - 複数の色を選択状態にはしない
   - カラーキューブ上で複数の色を点滅させるなどで強調表示

##### 提案の流れ
1. ユーザーが色のイメージを音声で伝える
2. AIが単色かコーディネートかを判断
3. 単色の場合: 1色を提案して自動適用
4. コーディネートの場合: ユーザーにコーディネートの種類を確認
5. 3組のコーディネートを提案して強調表示

#### 2.3 会話履歴
- **保持方法**: セッション内のみ（ページリロード後はリセット）
- **最大件数**: 50件
- **上限超過時**: 古いものから自動削除
- **表示**: チャット履歴モーダルで確認可能

### 3. 音声合成（TTS）

#### 3.1 対応言語
- 日本語、英語
- ユーザー選択言語で応答

#### 3.2 再生制御
- **ユーザーが話し始めた場合**: 再生を停止してAIはユーザーに傾聴
- **AIの音声再生中に新しい音声が来た場合**: キューイングで古いものから順に再生
- **停止ボタン**: 必要（手動で再生停止可能）

#### 3.3 技術
- Web Speech Synthesis API（ブラウザ側）

### 4. 多言語対応

#### 4.1 対応範囲
- **UI全体**: ボタン、メッセージなど
- **エラーメッセージ**: 多言語化
- **音声認識・合成**: 日本語・英語対応
- **LLM応答**: ユーザー選択言語で応答

#### 4.2 言語切り替えUI
- ヘッダーに言語切り替えボタンを配置

### 5. UI/UX仕様

#### 5.1 音声認識UI
- **ボタンデザイン**: マイクアイコンのみ
- **認識中**: わかりやすい視覚的フィードバック
- **認識結果プレビュー**: 不要（チャット履歴モーダルで確認）

#### 5.2 チャット履歴
- チャット履歴ボタンでモーダルを表示
- 会話履歴を確認可能

#### 5.3 ローディング表示
- LLM処理中はローディング表示
- タイムアウト: 20秒

---

## インフラ構成・アーキテクチャ

### 全体構成図

```
┌─────────────────────────────────────────────────────────────┐
│  ユーザー（スマホブラウザ: Chrome等）                         │
│  ├── React + TypeScript (SPA)                               │
│  ├── Web Speech API (音声認識)                               │
│  ├── Web Speech Synthesis API (音声合成)                      │
│  └── 3D Color Picker UI (React Three Fiber)                  │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTPS
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  CloudFront (CDN)                                            │
│  ├── カスタムドメイン（将来対応）                             │
│  ├── SSL証明書（自動）                                        │
│  └── APIリクエスト: キャッシュなし                            │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌──────────────┐    ┌──────────────────────────┐
│  S3 Bucket   │    │  ECS (Fargate)            │
│  (静的ファイル) │    │  (Python + FastAPI)      │
│              │    │  ├── REST: /api/*          │
│              │    │  └── WS:   /ws/*           │
└──────────────┘    └──────────┬───────────────┘
                               │
                               ▼
                    ┌──────────────────────────┐
                     │  Gemini Live API         │
                     │  ├── 音声ストリーミング   │
                     │  ├── tool call（UI操作）  │
                    │  └── 多言語対応          │
                    └──────────────────────────┘
```

### インフラ詳細

#### フロントエンド
- **ホスティング**: AWS S3
- **CDN**: CloudFront
- **カスタムドメイン**: 将来対応（初回実装では不要）
- **SSL**: CloudFrontで自動対応

#### バックエンド
- **実行環境**: AWS ECS (Fargate)
- **フレームワーク**: FastAPI (Python)
- **エンドポイント**: CloudFront 経由で `/api/*` と `/ws/*` をECSへプロキシ

#### CloudFront設定
- **キャッシュポリシー**: APIリクエストはキャッシュしない
- **CORS**: CloudFront経由のアクセス + 開発環境のオリジンを許可
- **SSL/TLS**: 強制

### セキュリティ

#### APIキー管理
- **方法**: 環境変数（ECSタスク定義で設定）
- **Gemini APIキー**: 環境変数で管理

#### CORS設定
- **本番環境**: CloudFront経由のアクセスのみ許可
- **開発環境**: 別途追加（localhost等）

---

## 技術スタック

### フロントエンド
- **フレームワーク**: React 18
- **言語**: TypeScript
- **3D表示**: React Three Fiber (@react-three/fiber)
- **3Dユーティリティ**: @react-three/drei
- **状態管理**: React Hooks (useState, useCallback等)
- **多言語対応**: i18next
- **音声認識**: Web Speech API
- **音声合成**: Web Speech Synthesis API
- **スタイリング**: styled-components (既存)

### バックエンド
- **言語**: Python 3.13
- **フレームワーク**: FastAPI
- **LLM**: Google Gemini 3 Flash API
- **実行環境**: AWS ECS (Fargate)

### インフラ
- **フロントエンドホスティング**: AWS S3
- **CDN**: AWS CloudFront
- **バックエンド**: AWS ECS (Fargate)

---

## プロジェクト構造

### フォルダ構成（モノレポ構成）

本プロジェクトは、フロントエンドとバックエンドを一つのリポジトリに含むモノレポ構成を採用します。

```
3d-ai-color-concierge/
│
├── frontend/                          # フロントエンド（React + TypeScript）
│   ├── public/                        # 静的ファイル
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── ...
│   │
│   ├── src/                          # ソースコード
│   │   ├── components/               # Reactコンポーネント
│   │   │   ├── ColorPicker/          # 3Dカラーピッカー関連
│   │   │   │   ├── Structure.tsx
│   │   │   │   ├── ControlPane.tsx
│   │   │   │   ├── Particles.tsx
│   │   │   │   ├── Focus.tsx
│   │   │   │   ├── FocusPlane.tsx
│   │   │   │   └── ...
│   │   │   ├── VoiceControl/         # 音声操作関連
│   │   │   │   ├── VoiceRecognitionButton.tsx
│   │   │   │   ├── TextInputFallback.tsx
│   │   │   │   └── VoiceFeedback.tsx
│   │   │   ├── Chatbot/              # チャットボット関連
│   │   │   │   ├── ChatbotInterface.tsx
│   │   │   │   ├── ChatHistoryModal.tsx
│   │   │   │   └── ColorCoordinator.tsx
│   │   │   └── common/               # 共通コンポーネント
│   │   │       ├── Header.tsx
│   │   │       ├── LanguageSwitcher.tsx
│   │   │       └── LoadingSpinner.tsx
│   │   │
│   │   ├── hooks/                    # カスタムフック
│   │   │   ├── useVoiceRecognition.ts
│   │   │   ├── useVoiceCommand.ts
│   │   │   ├── useChatbot.ts
│   │   │   ├── useTTS.ts
│   │   │   └── useColorState.ts
│   │   │
│   │   ├── services/                 # API呼び出し・外部サービス
│   │   │   ├── api/                  # APIクライアント
│   │   │   │   ├── voiceApi.ts
│   │   │   │   └── websocketApi.ts
│   │   │   └── utils/                # ユーティリティ
│   │   │       ├── colorUtils.ts
│   │   │       └── speechUtils.ts
│   │   │
│   │   ├── i18n/                     # 多言語対応
│   │   │   ├── index.ts
│   │   │   ├── locales/
│   │   │   │   ├── ja.json
│   │   │   │   └── en.json
│   │   │   └── resources.ts
│   │   │
│   │   ├── types/                     # 型定義
│   │   │   ├── voiceCommands.ts
│   │   │   ├── color.ts
│   │   │   ├── api.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── constants/                # 定数
│   │   │   ├── colors.ts
│   │   │   ├── systemColors.ts
│   │   │   └── sampleColors.ts
│   │   │
│   │   ├── assets/                    # アセット
│   │   │   ├── icons/
│   │   │   └── images/
│   │   │
│   │   ├── styles/                    # スタイル
│   │   │   ├── global.css
│   │   │   └── theme.ts
│   │   │
│   │   ├── App.tsx                    # メインアプリ
│   │   ├── index.tsx                  # エントリーポイント
│   │   └── setupTests.ts
│   │
│   ├── package.json                   # フロントエンド依存関係
│   ├── tsconfig.json                  # TypeScript設定
│   ├── .eslintrc.js                   # ESLint設定
│   ├── .prettierrc                    # Prettier設定
│   └── vite.config.ts                 # Vite設定（またはwebpack.config.js）
│
├── backend/                           # バックエンド（Python + FastAPI）
│   ├── app/                           # アプリケーションコード
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPIアプリケーション
│   │   │
│   │   ├── api/                       # APIエンドポイント
│   │   │   ├── __init__.py
│   │   │   ├── routes/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── voice.py           # 音声処理エンドポイント
│   │   │   │   └── websocket.py       # WebSocketエンドポイント（後期）
│   │   │   └── schemas/               # Pydanticスキーマ
│   │   │       ├── __init__.py
│   │   │       ├── voice.py
│   │   │       └── response.py
│   │   │
│   │   ├── services/                  # ビジネスロジック
│   │   │   ├── __init__.py
│   │   │   ├── gemini_service.py     # Gemini API統合
│   │   │   ├── command_parser.py      # コマンド解析（補助）
│   │   │   ├── speech_correction.py   # 音声認識結果補正
│   │   │   └── color_coordinator.py    # カラーコーディネートロジック
│   │   │
│   │   ├── models/                    # データモデル
│   │   │   ├── __init__.py
│   │   │   └── color.py
│   │   │
│   │   ├── utils/                     # ユーティリティ
│   │   │   ├── __init__.py
│   │   │   ├── color_utils.py
│   │   │   └── text_utils.py
│   │   │
│   │   └── config/                    # 設定
│   │       ├── __init__.py
│   │       ├── settings.py            # アプリケーション設定
│   │       └── constants.py           # 定数
│   │
│   ├── tests/                          # テスト
│   │   ├── __init__.py
│   │   ├── test_api/
│   │   ├── test_services/
│   │   └── conftest.py
│   │
│   ├── requirements.txt               # Python依存関係
│   ├── requirements-dev.txt          # 開発用依存関係
│   ├── .env.example                   # 環境変数テンプレート
│   ├── pytest.ini                     # pytest設定
│   └── Dockerfile                     # ECS/Fargate用コンテナ定義
│
├── shared/                            # 共有コード
│   ├── types/                         # 共有型定義
│   │   ├── voiceCommands.ts           # TypeScript型定義
│   │   └── color.ts
│   │
│   └── constants/                     # 共有定数
│       └── colorConstants.ts
│
├── infrastructure/                    # インフラ設定
│   └── terraform/                     # Terraform設定
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
│
├── scripts/                           # デプロイ・ユーティリティスクリプト
│   ├── deploy/                        # デプロイスクリプト
│   │   ├── deploy-frontend.sh
│   │   ├── deploy-backend.sh
│   │
│   ├── dev/                           # 開発用スクリプト
│   │   └── run-backend-local.sh
│   │
│   └── setup/                         # セットアップスクリプト
│       ├── setup-dev.sh
│       └── setup-env.sh
│
├── docs/                              # ドキュメント
│   ├── DESIGN.md                      # 設計ドキュメント（このファイル）
│   └── FRONTEND_DEPLOYMENT.md         # フロントエンドデプロイ手順
│
├── .gitignore                         # Git除外設定
├── .gitattributes                     # Git属性設定
├── README.md                          # プロジェクト概要
├── LICENSE                            # ライセンス
│
└── package.json                       # ルートレベル（ワークスペース管理用）
    └── スクリプト統合用
```

### 主要な設計思想

#### 1. 明確な分離
- **`frontend/`**: React + TypeScriptのフロントエンドコード
- **`backend/`**: Python + FastAPIのバックエンドコード
- **`shared/`**: フロントエンドとバックエンドで共有するコード（型定義、定数など）

#### 2. 機能別の整理
- コンポーネントは機能別にフォルダ分け（ColorPicker、VoiceControl、Chatbot等）
- サービス層を分離（API呼び出し、外部サービス統合）
- 型定義を集約（`types/`フォルダ）

#### 3. インフラ設定の分離
- **`infrastructure/`**: AWS設定を集約
- デプロイスクリプトを`scripts/`に集約

#### 4. テストの配置
- 各パッケージに`tests/`フォルダを配置
- テストは各パッケージ内で完結

### ルートレベルのpackage.json（ワークスペース管理）

モノレポ構成を管理するため、ルートレベルに`package.json`を配置します。

```json
{
  "name": "3d-ai-color-concierge",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "frontend"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "cd frontend && npm start",
    "dev:backend": "cd backend && uvicorn app.main:app --reload",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && python -m pip install -r requirements.txt",
    "test": "npm run test:frontend && npm run test:backend",
    "test:frontend": "cd frontend && npm test",
    "test:backend": "cd backend && pytest",
    "deploy": "./scripts/deploy/deploy-all.sh"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

### 各パッケージの主要ファイル

#### frontend/package.json
```json
{
  "name": "@3d-color-concierge/frontend",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@react-three/fiber": "^8.13.5",
    "@react-three/drei": "^9.79.3",
    "i18next": "^23.0.0",
    "styled-components": "^6.0.6"
  }
}
```

#### backend/requirements.txt
```
fastapi==0.115.0
uvicorn[standard]==0.32.0
google-genai==1.63.0
pydantic==2.10.0
pydantic-settings==2.6.0
python-multipart==0.0.20
boto3==1.35.0
```

### 利点

1. **明確な分離**: フロントエンドとバックエンドが独立して管理可能
2. **共有コードの管理**: `shared/`フォルダで型定義などを共有
3. **スケーラブル**: 機能追加が容易
4. **デプロイの柔軟性**: 各パッケージを個別にデプロイ可能
5. **テストの分離**: 各パッケージでテストを実行可能
6. **インフラ設定の集約**: AWS設定を一箇所で管理

---

## データフロー

### フェーズ1: REST API実装（初期）

```
1. ユーザー音声入力
   ↓
2. Web Speech API（ブラウザ）
   → テキスト変換
   ↓
3. フロントエンド: 音声認識結果を取得
   ↓ POST /api/voice/process
4. CloudFront（/api/* はキャッシュなし）
   ↓
5. ECS Service (FastAPI)
   ├── リクエスト解析
   ├── 現在の色状態を取得（リクエストに含まれる）
   ├── 会話履歴を取得（リクエストに含まれる）
   └── Gemini 3 Flash API呼び出し
       ├── プロンプト構築（多言語対応）
       ├── 会話履歴を含めたコンテキスト
       └── レスポンス生成
   ↓
6. レスポンス返却
   {
     "type": "command" | "chatbot",
     "command": {...} | null,
     "response": "..." | null,
     "updated_history": [...]
   }
   ↓
7. フロントエンド
   ├── コマンドの場合:
   │   ├── executeCommand()
   │   ├── 既存ハンドラー関数呼び出し
   │   └── UI更新
   ├── チャットボットの場合:
   │   ├── 応答を表示
   │   └── 音声合成（TTS）
   └── 会話履歴更新
```

### フェーズ2: WebSocket API移行（後期）

```
1. ユーザー音声入力
   ↓
2. Web Speech API（ブラウザ）
   → テキスト変換
   ↓
3. フロントエンド: WebSocket接続（既存接続を使用）
   ↓ WebSocket送信
4. CloudFront（/ws/* はキャッシュなし）
   ↓
5. ECS Service (FastAPI)
   ├── 既存の処理ロジックを再利用
   ├── ストリーミング対応（オプション）
   └── WebSocket経由でレスポンス送信
   ↓
6. フロントエンド: ストリーミング受信
   ├── リアルタイムUI更新
   └── ストリーミング音声合成（オプション）
```

---

## 実装ステップ（段階的実装プラン）

### 各ステップで本番環境での動作確認可能にする

### フェーズ0: フォルダ構成の変更（3-5日）

#### ステップ0.1: 新しいフォルダ構造の作成
- [ ] `frontend/`フォルダの作成
- [ ] `backend/`フォルダの作成（空の構造のみ）
- [ ] `shared/`フォルダの作成
- [ ] `infrastructure/`フォルダの作成
- [ ] `scripts/`フォルダの作成
- [ ] `docs/`フォルダの作成

**本番環境テスト**: 
- フォルダ構造が正しく作成されたことを確認

#### ステップ0.2: 既存ファイルの移動
- [ ] `src/` → `frontend/src/`への移動
- [ ] `public/` → `frontend/public/`への移動
- [ ] `package.json` → `frontend/package.json`への移動
- [ ] 既存のコンポーネントを機能別フォルダに整理
  - [ ] `components/ColorPicker/`に3Dカラーピッカー関連を移動
    - [ ] `Structure.js` → `frontend/src/components/ColorPicker/Structure.js`
    - [ ] `ControlPane.js` → `frontend/src/components/ColorPicker/ControlPane.js`
    - [ ] `Particles.js` → `frontend/src/components/ColorPicker/Particles.js`
    - [ ] `Focus.js` → `frontend/src/components/ColorPicker/Focus.js`
    - [ ] `FocusPlane.js` → `frontend/src/components/ColorPicker/FocusPlane.js`
    - [ ] `FocusLine.js` → `frontend/src/components/ColorPicker/FocusLine.js`
    - [ ] `TwoDPicker.js` → `frontend/src/components/ColorPicker/TwoDPicker.js`
    - [ ] その他の3D関連コンポーネント
  - [ ] `constants/`を`frontend/src/constants/`に移動
  - [ ] `assets/`を`frontend/src/assets/`に移動
  - [ ] `App.js`を`frontend/src/App.js`に移動

**本番環境テスト**:
- ファイルが正しく移動されたことを確認
- ファイルの欠落がないことを確認

#### ステップ0.3: 設定ファイルの更新
- [ ] ビルド設定の更新（パス修正）
- [ ] インポートパスの更新
  - [ ] 相対パスの修正
  - [ ] 絶対パスの設定（必要に応じて）
- [ ] `.gitignore`の更新
- [ ] ルートレベルの`package.json`の作成（ワークスペース管理用）

**本番環境テスト**:
- ビルドが成功することを確認
- インポートエラーがないことを確認

#### ステップ0.4: 動作確認・デプロイ
- [ ] 既存機能が正常に動作することを確認
- [ ] ビルドが成功することを確認
- [ ] 本番環境へのデプロイと動作確認

**本番環境テスト**:
- 全ての既存機能が正常に動作することを確認
- パフォーマンスに問題がないことを確認
- ビルド・デプロイプロセスが正常に動作することを確認

---

### フェーズ1: TypeScript移行（1-2週間）

#### ステップ1.1: プロジェクト設定
- [ ] TypeScript依存関係の追加
- [ ] `tsconfig.json`の設定
- [ ] 既存コードの動作確認

**本番環境テスト**: 
- 既存機能が正常に動作することを確認
- ビルドが成功することを確認

#### ステップ1.2: 段階的移行
- [ ] `frontend/src/App.js` → `frontend/src/App.tsx`
- [ ] `frontend/src/ControlPane.js` → `frontend/src/components/ColorPicker/ControlPane.tsx`
- [ ] その他のコンポーネントを順次移行
- [ ] 型定義ファイル（`frontend/src/types/`）の作成

**本番環境テスト**:
- 各移行後にビルド・デプロイ・動作確認
- 型エラーがないことを確認

#### ステップ1.3: 最終確認・デプロイ
- [ ] 型エラーの解消
- [ ] 既存機能の動作確認
- [ ] 本番環境へのデプロイ

**本番環境テスト**:
- 全ての機能が正常に動作することを確認
- パフォーマンスに問題がないことを確認

---

### フェーズ2: 多言語対応基盤（1週間）

#### ステップ2.1: i18next統合
- [ ] i18next依存関係の追加
- [ ] i18next設定ファイルの作成
- [ ] 翻訳ファイル（日本語・英語）の作成

**本番環境テスト**:
- 言語切り替えが正常に動作することを確認
- 各言語の表示が正しいことを確認

#### ステップ2.2: UI多言語化
- [ ] 既存UI要素の多言語対応
- [ ] エラーメッセージの多言語化
- [ ] 言語切り替えボタンの実装（ヘッダー）

**本番環境テスト**:
- 全てのUI要素が多言語対応されていることを確認
- 言語切り替え時の表示が正しく切り替わることを確認

---

### フェーズ3: 音声認識統合（1週間）

#### ステップ3.1: Web Speech API統合
- [ ] `frontend/src/hooks/useVoiceRecognition.ts`の作成
- [ ] `frontend/src/components/VoiceControl/`コンポーネントの作成
- [ ] 日本語・英語の音声認識対応
- [ ] 視覚的フィードバックの実装

**本番環境テスト**:
- ブラウザで音声認識が正常に動作することを確認
- 日本語・英語の両方で認識が動作することを確認

#### ステップ3.2: テキスト入力フォールバック
- [ ] テキスト入力欄の実装
- [ ] エラーハンドリングの実装

**本番環境テスト**:
- テキスト入力でコマンドが実行できることを確認

---

### フェーズ4: バックエンド構築（REST API）（2-3週間）

#### ステップ4.1: ECS/Fargate + FastAPI基盤
- [ ] ECSクラスタ・サービスの作成
- [ ] FastAPIアプリケーションの作成
- [ ] CloudFront→`/api/*`→ECS のルーティング設定
- [ ] 基本的なエンドポイントの実装

**本番環境テスト**:
- CloudFront経由でバックエンドが正常に呼び出されることを確認
- 基本的なレスポンスが返ることを確認

#### ステップ4.2: Gemini 3 Flash統合
- [ ] Gemini APIキーの設定（環境変数）
- [ ] `backend/app/services/gemini_service.py`の作成
- [ ] 多言語対応プロンプトの設計
- [ ] コマンド解析ロジックの実装
- [ ] チャットボット応答ロジックの実装

**本番環境テスト**:
- Gemini APIが正常に呼び出されることを確認
- コマンド解析が正常に動作することを確認
- チャットボット応答が正常に生成されることを確認

#### ステップ4.3: 音声認識結果補正
- [ ] 音声認識結果の正規化ロジック
- [ ] カラー用語の辞書マッチング
- [ ] 数値の正規化

**本番環境テスト**:
- 音声認識結果の補正が正常に動作することを確認

#### ステップ4.4: CORS設定・デプロイ
- [ ] CORS設定（CloudFront + 開発環境）
- [ ] 環境変数の設定
- [ ] デプロイ自動化スクリプトの作成

**本番環境テスト**:
- フロントエンドからAPIが正常に呼び出されることを確認
- CORSエラーが発生しないことを確認

---

### フェーズ5: コマンド実行機能（1-2週間）

#### ステップ5.1: コマンド実行エンジン
- [ ] `frontend/src/hooks/useVoiceCommand.ts`の作成
- [ ] コマンドタイプごとの実行ロジック
- [ ] 既存ハンドラー関数との統合

**本番環境テスト**:
- 各コマンドタイプが正常に実行されることを確認
- UI操作が正常に反映されることを確認

#### ステップ5.2: 値調整機能
- [ ] 値調整関数の実装
- [ ] 相対値調整の実装（「上げて」「下げて」等）

**本番環境テスト**:
- 値調整が正常に動作することを確認

---

### フェーズ6: チャットボット機能（2-3週間）

#### ステップ6.1: チャットボットUI
- [ ] チャットインターフェースの作成
- [ ] 会話履歴の表示
- [ ] チャット履歴モーダルの実装
- [ ] 会話履歴管理（最大50件、自動削除）

**本番環境テスト**:
- チャット履歴が正常に表示されることを確認
- 会話履歴が正常に管理されることを確認

#### ステップ6.2: 音声合成（TTS）
- [ ] 音声合成の実装
- [ ] 再生制御の実装
   - [ ] ユーザーが話し始めたら停止
   - [ ] キューイング機能
- [ ] 停止ボタンの実装
- [ ] 多言語対応（日本語・英語）

**本番環境テスト**:
- 音声合成が正常に動作することを確認
- 再生制御が正常に動作することを確認
- 日本語・英語の両方で音声が生成されることを確認

#### ステップ6.3: カラーコーディネート基本機能
- [ ] 単色提案の実装
- [ ] 単色提案の自動適用（UIに反映）
- [ ] カラーコーディネート提案の基本実装

**本番環境テスト**:
- 単色提案が正常に動作することを確認
- 提案された色がUIに正常に反映されることを確認

---

### フェーズ7: カラーコーディネート詳細機能（2-3週間）

#### ステップ7.1: カラーコーディネート提案ロジック
- [ ] コーディネート種類の判別
- [ ] ユーザー要望の聞き出しロジック
- [ ] 3組のコーディネート提案ロジック

**本番環境テスト**:
- コーディネート提案が正常に生成されることを確認

#### ステップ7.2: カラーキューブ上での強調表示
- [ ] 複数色の点滅機能
- [ ] 強調表示の実装
- [ ] 単色・コーディネートの表示の違い

**本番環境テスト**:
- 複数色の強調表示が正常に動作することを確認
- 視覚的にわかりやすいことを確認

#### ステップ7.3: コーディネート種類の実装
- [ ] 文字色・背景色（Text/Background）
- [ ] Primary/Secondary色
- [ ] 枠色・中身の色（Border/Content）
- [ ] その他（Accent色等）

**本番環境テスト**:
- 各コーディネート種類が正常に動作することを確認

---

### フェーズ8: 最適化・改善（1-2週間）

#### ステップ8.1: パフォーマンス最適化
- [ ] API呼び出しの最適化
- [ ] レスポンス時間の改善
- [ ] ローディング表示の最適化

**本番環境テスト**:
- レスポンス時間が目標（3秒以内）を満たしていることを確認
- パフォーマンスに問題がないことを確認

#### ステップ8.2: UX改善
- [ ] 音声認識フィードバックの改善
- [ ] エラーメッセージの改善
- [ ] UIの微調整

**本番環境テスト**:
- UXに問題がないことを確認
- ユーザーテストを実施

---

### フェーズ9: WebSocket API移行（2-3週間）

#### ステップ9.1: WebSocket基盤
- [ ] CloudFront→`/ws/*`→ECS のWebSocketルーティング確認
- [ ] WebSocket接続管理の実装
- [ ] 既存処理ロジックの再利用

**本番環境テスト**:
- WebSocket接続が正常に確立されることを確認
- 既存機能がWebSocketでも正常に動作することを確認

#### ステップ9.2: ストリーミング対応（オプション）
- [ ] ストリーミングレスポンスの実装
- [ ] リアルタイムUI更新
- [ ] ストリーミング音声合成（オプション）

**本番環境テスト**:
- ストリーミングが正常に動作することを確認
- パフォーマンスが向上していることを確認

#### ステップ9.3: 最終確認・デプロイ
- [ ] REST APIとWebSocket APIの両方を提供（移行期間）
- [ ] 段階的な移行
- [ ] 最終確認

**本番環境テスト**:
- WebSocket APIが正常に動作することを確認
- パフォーマンスが向上していることを確認

---

## 注意点・制約事項

### 技術的制約

#### 1. Web Speech APIのブラウザ対応
- **Chrome/Edge**: 良好なサポート
- **Safari**: 部分的サポート
- **Firefox**: 限定的なサポート
- **モバイルブラウザ**: Chrome等で対応

**対策**: 
- テキスト入力フォールバックを提供
- 対応ブラウザの案内を表示

#### 2. セッション/接続の制約（Gemini Live）
- **無音/アイドル**: 一定時間でセッションが終了する可能性
- **切断時**: `audio_stream_end` 等で発話区切りを通知しないと応答が遅れる場合がある

**対策**: 
- バックエンドで受信ループを継続し keepalive を維持
- 発話終了時に `end_audio_stream()` を送信

#### 3. 音声認識の精度
- 背景ノイズ、方言・アクセントによる誤認識の可能性

**対策**: 
- サーバー側での補正
- LLMによる意図抽出で補完

#### 4. 会話履歴の管理
- セッション内のみ保持（ページリロードでリセット）

**対策**: 
- 将来的にlocalStorageやバックエンド保存を検討

### セキュリティ

#### 1. APIキー管理
- 環境変数で管理（将来はAWS Secrets Managerへの移行を検討）

#### 2. CORS設定
- 適切なオリジンのみ許可
- 開発環境と本番環境で分離

#### 3. 入力検証
- ユーザー入力の検証
- SQLインジェクション等の対策（FastAPIの標準機能で対応）

### パフォーマンス

#### 1. レスポンス時間
- **目標**: 音声認識から返答音声まで3秒以内
- **色の設定値・カラーキューブの反応**: 3秒を超えても可

**対策**:
- Gemini Flashモデルを使用（高速）
- キャッシング戦略の検討
- タイムアウト設定（20秒）

#### 2. ECSスケーリング/同時接続
- 同時接続数に応じてタスク数を調整（必要に応じてオートスケール）
- コストと安定性のバランスを取る

### コスト管理

#### 1. Gemini API使用量
- Flashモデルでコスト効率化
- 使用量の監視
- コストアラートの設定

#### 2. ECS/Fargate使用量
- CPU/メモリ設定の最適化
- タスク数（スケール）を含めたコスト監視

### 将来の拡張性

#### 1. ユーザー認証・ログイン（リリース後）
- 認証システムの追加
- セッション管理

#### 2. 色の履歴保存（リリース後）
- データベースの追加
- 履歴管理機能

#### 3. My Palette機能（リリース後）
- お気に入りのカラー組み合わせの保存
- データベース設計

#### 4. カスタムドメイン
- ドメイン設定
- SSL証明書の管理

---

## まとめ

本設計ドキュメントでは、3D AI Color Curatorアプリケーションの包括的な設計をまとめました。

### 主要な設計決定

1. **統合アーキテクチャ**: コマンド解析とチャットボットを同一LLM（Gemini 3 Flash）で処理
2. **段階的実装**: REST APIから開始し、後でWebSocket APIに移行
3. **多言語対応**: UI全体を多言語化
4. **音声統合**: Web Speech API + Web Speech Synthesis API
5. **インフラ**: AWS ECS (Fargate) + S3 + CloudFront

### 次のステップ

1. フェーズ1（TypeScript移行）から開始
2. 各フェーズで本番環境テストを実施
3. 段階的に機能を追加・改善

---

**最終更新**: 2024年
**バージョン**: 1.0

