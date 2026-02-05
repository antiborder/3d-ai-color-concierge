/**
 * APIエンドポイント設定
 */

// 開発環境ではlocalhost、本番環境では環境変数から取得
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  VOICE_PROCESS: `${API_BASE_URL}/api/voice/process`,
} as const;
